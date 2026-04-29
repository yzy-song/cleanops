import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey || secretKey.startsWith('sk_live_')) {
      this.logger.warn('Stripe is configured but test mode is preferred for development');
    }
    this.stripe = secretKey
      ? new Stripe(secretKey, { apiVersion: '2025-03-31' as any })
      : null;
  }

  async createPaymentLink(
    amountInCents: number,
    description: string,
    metadata: Record<string, string>,
  ): Promise<string | null> {
    if (!this.stripe) {
      this.logger.warn('Stripe is not configured. Skipping payment link creation.');
      return null;
    }

    try {
      const price = await this.stripe.prices.create({
        currency: 'eur',
        unit_amount: amountInCents,
        product_data: { name: description },
      });

      const paymentLink = await this.stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata,
      });

      return paymentLink.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create Stripe payment link: ${message}`);
      throw error;
    }
  }

  constructWebhookEvent(payload: Buffer, signature: string, secret: string) {
    if (!this.stripe) throw new Error('Stripe is not configured');
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
