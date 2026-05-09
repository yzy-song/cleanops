import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(StripeService.name);
  private readonly platformFeePercent: number;

  constructor(private configService: ConfigService) {
    const secretKey = configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not set — Stripe is disabled');
    }
    this.stripe = secretKey
      ? new Stripe(secretKey, { apiVersion: '2025-03-31' as any })
      : null;
    this.platformFeePercent = configService.get<number>('PLATFORM_FEE_PERCENT') ?? 0;
  }

  /** Expose Stripe instance for advanced operations (Customer creation, Subscriptions, etc.) */
  get client(): Stripe | null {
    return this.stripe;
  }

  // ==================== Payment Links (legacy, non-Connect) ====================

  async createPaymentLink(
    amountInCents: number,
    description: string,
    metadata: Record<string, string>,
  ): Promise<string | null> {
    if (!this.stripe) return null;
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

  // ==================== Stripe Connect ====================

  /**
   * Create a Checkout Session that routes funds to a connected account.
   * Platform takes application_fee_amount as commission.
   * All amounts in cents (EUR).
   */
  async createConnectCheckoutSession(params: {
    amount: number;
    connectedAccountId: string;
    description: string;
    metadata: Record<string, string>;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<string | null> {
    if (!this.stripe) return null;

    // Calculate platform fee: 1% of total, minimum €0.01
    const appFee = Math.max(1, Math.round(params.amount * (this.platformFeePercent / 100)));

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'eur',
            unit_amount: params.amount,
            product_data: { name: params.description },
          },
          quantity: 1,
        }],
        payment_intent_data: {
          application_fee_amount: appFee,
          transfer_data: { destination: params.connectedAccountId },
        },
        metadata: params.metadata,
        success_url: params.successUrl || `${frontendUrl}/invoices?paid=true`,
        cancel_url: params.cancelUrl || `${frontendUrl}/invoices`,
      });

      return session.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create Connect checkout session: ${message}`);
      throw error;
    }
  }

  /** Calculate platform application fee for a given total amount (in cents). */
  calcApplicationFee(totalCents: number): number {
    return Math.max(1, Math.round(totalCents * (this.platformFeePercent / 100)));
  }

  // ==================== Stripe Connect OAuth ====================

  /**
   * Generate the Stripe Connect OAuth authorization URL.
   * User is redirected to Stripe to connect their account.
   */
  generateConnectOAuthUrl(companyId: string, returnPath: string): string {
    const clientId = this.configService.get<string>('STRIPE_CONNECT_CLIENT_ID');
    if (!clientId) throw new Error('STRIPE_CONNECT_CLIENT_ID is not configured');

    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const redirectUri = `${baseUrl}${returnPath}`;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: 'read_write',
      redirect_uri: redirectUri,
      state: companyId,
      'stripe_user[email]': '',
      'stripe_user[country]': 'IE',
      'stripe_user[business_type]': 'individual',
    });

    return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  }

  /** Exchange OAuth authorization code for a Stripe account ID. */
  async exchangeOAuthCode(code: string): Promise<{ stripeUserId: string; email: string }> {
    if (!this.stripe) throw new Error('Stripe is not configured');

    const response = await this.stripe.oauth.token({ grant_type: 'authorization_code', code });

    return {
      stripeUserId: response.stripe_user_id,
      email: (response as any).stripe_user_email || '',
    };
  }

  /** Retrieve connected account status (charges/payouts enabled, requirements). */
  async retrieveAccount(accountId: string): Promise<{
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    status: string;
  }> {
    if (!this.stripe) throw new Error('Stripe is not configured');

    const account = await this.stripe.accounts.retrieve(accountId);
    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      status: account.charges_enabled ? 'enabled' : account.requirements?.currently_due?.length ? 'restricted' : 'pending',
    };
  }

  /** Refund a charge and reverse the application fee. */
  async refundWithFeeReversal(chargeId: string): Promise<void> {
    if (!this.stripe) throw new Error('Stripe is not configured');
    await this.stripe.refunds.create({ charge: chargeId, reverse_transfer: true });
  }

  // ==================== Webhook ====================

  constructWebhookEvent(payload: Buffer, signature: string, secret: string) {
    if (!this.stripe) throw new Error('Stripe is not configured');
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
