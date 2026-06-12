import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from '../common/services/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  getPriceId(plan: string, interval: 'month' | 'year'): string | undefined {
    const key = `STRIPE_${plan}_${interval === 'year' ? 'YEARLY' : 'MONTHLY'}_PRICE_ID`;
    return this.configService.get<string>(key);
  }

  async getSubscriptionStatus(companyId: string) {
    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
      },
    });

    if (!company) throw new BadRequestException('Company not found');

    const isTrialing =
      company.subscriptionStatus === 'TRIALING' &&
      company.trialEndsAt &&
      company.trialEndsAt > new Date();

    const isActive =
      company.subscriptionStatus === 'ACTIVE' &&
      company.subscriptionEndsAt &&
      company.subscriptionEndsAt > new Date();

    return {
      status: isTrialing ? 'TRIALING' : isActive ? 'ACTIVE' : company.subscriptionStatus || 'NONE',
      plan: company.subscriptionPlan,
      trialEndsAt: company.trialEndsAt,
      subscriptionEndsAt: company.subscriptionEndsAt,
    };
  }

  async createCheckoutSession(companyId: string, plan: string, interval: 'month' | 'year' = 'month') {
    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: { stripeCustomerId: true },
    });
    if (!company) throw new BadRequestException('Company not found');

    const url = await this.stripeService.createSubscriptionCheckout(plan, interval, { companyId, plan, customerId: company.stripeCustomerId! });
    if (!url) throw new BadRequestException('Stripe is not configured');

    return { url };
  }

  async createPortalSession(companyId: string) {
    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: { stripeCustomerId: true },
    });
    if (!company?.stripeCustomerId) throw new BadRequestException('No Stripe customer');

    const url = await this.stripeService.createBillingPortalSession(company.stripeCustomerId);
    if (!url) throw new BadRequestException('Stripe is not configured');

    return { url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_BILLING_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.warn('STRIPE_BILLING_WEBHOOK_SECRET not configured');
      return { received: true };
    }

    const stripe = this.stripeService.client as Stripe | null;
    if (!stripe) return { received: true };

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Billing webhook signature failed: ${err.message}`);
      throw new BadRequestException('Invalid signature');
    }

    await this.processWebhookEvent(event);
    return { received: true };
  }

  async processWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.metadata?.companyId) {
          const subscription = await this.fetchSubscription(session.subscription as string);
          if (subscription) {
            await this.prisma.client.company.update({
              where: { id: session.metadata.companyId },
              data: {
                subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
                subscriptionPlan: session.metadata.plan,
                subscriptionEndsAt: new Date((subscription as any).current_period_end * 1000),
                trialEndsAt: null,
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const periodEnd = (subscription as any).current_period_end as number | undefined;
        const companyId = subscription.metadata?.companyId as string | undefined;
        if (companyId) {
          const status =
            subscription.status === 'active'
              ? 'ACTIVE'
              : subscription.status === 'past_due'
                ? 'PAST_DUE'
                : subscription.status === 'canceled'
                  ? 'CANCELLED'
                  : 'CANCELLED';

          await this.prisma.client.company.update({
            where: { id: companyId },
            data: {
              subscriptionStatus: status,
              subscriptionEndsAt: periodEnd ? new Date(periodEnd * 1000) : undefined,
            },
          });
        }
        break;
      }
    }
  }

  private async fetchSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    return this.stripeService.retrieveSubscription(subscriptionId);
  }
}
