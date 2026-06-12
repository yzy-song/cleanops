import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly platformStripe: Stripe | null;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretKey = configService.get<string>('STRIPE_SECRET_KEY');
    this.platformStripe = secretKey
      ? new Stripe(secretKey, { apiVersion: '2025-03-31' as any })
      : null;
    if (!this.platformStripe) {
      this.logger.warn('STRIPE_SECRET_KEY not set — Stripe platform features disabled');
    }
  }

  /** Platform-level Stripe client (for subscriptions, billing) */
  get client(): Stripe | null {
    return this.platformStripe;
  }

  /** Get a company-specific Stripe client using their own secret key */
  private async getCompanyStripe(companyId: string): Promise<Stripe | null> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: { stripeSecretKey: true },
    });
    if (!company?.stripeSecretKey) return null;
    return new Stripe(company.stripeSecretKey, { apiVersion: '2025-03-31' as any });
  }

  // ==================== Simple Payment Links ====================

  async createPaymentLink(
    companyId: string,
    amountInCents: number,
    description: string,
    metadata: Record<string, string>,
  ): Promise<string | null> {
    const stripe = await this.getCompanyStripe(companyId);
    if (!stripe) return null;

    try {
      const price = await stripe.prices.create({
        currency: 'eur',
        unit_amount: amountInCents,
        product_data: { name: description },
      });
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata,
      });
      return paymentLink.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create payment link for company ${companyId}: ${message}`);
      throw error;
    }
  }

  // ==================== Webhook ====================

  constructWebhookEvent(payload: Buffer, signature: string, secret: string) {
    if (!this.platformStripe) throw new Error('Stripe is not configured');
    return this.platformStripe.webhooks.constructEvent(payload, signature, secret);
  }

  /** Verify a company-specific webhook signature */
  async constructCompanyWebhookEvent(
    companyId: string,
    payload: Buffer,
    signature: string,
    secret: string,
  ) {
    const stripe = await this.getCompanyStripe(companyId);
    if (!stripe) throw new Error(`Stripe not configured for company ${companyId}`);
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }

  // ==================== Platform: Subscriptions ====================

  async createSubscriptionCheckout(
    plan: string,
    interval: 'month' | 'year',
    metadata: Record<string, string>,
  ): Promise<string | null> {
    if (!this.platformStripe) return null;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    const priceId = this.configService.get<string>(
      `STRIPE_${plan.toUpperCase()}_${interval.toUpperCase()}_PRICE_ID`,
    );
    if (!priceId) throw new Error(`No price ID configured for ${plan} ${interval}`);

    const session = await this.platformStripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      success_url: `${frontendUrl}/settings?stripe=success`,
      cancel_url: `${frontendUrl}/pricing`,
    });

    return session.url;
  }

  async createBillingPortalSession(customerId: string): Promise<string | null> {
    if (!this.platformStripe) return null;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const session = await this.platformStripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/settings`,
    });
    return session.url;
  }

  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    if (!this.platformStripe) return null;
    try {
      return await this.platformStripe.subscriptions.retrieve(subscriptionId);
    } catch {
      return null;
    }
  }
}
