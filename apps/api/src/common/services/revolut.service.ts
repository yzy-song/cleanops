import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface RevolutOrder {
  id: string;
  public_id: string;
  type: string;
  state: string;
  amount: number;
  currency: string;
  description: string;
  checkout_url: string;
  merchant_order_id: string;
  created_at: string;
}

@Injectable()
export class RevolutService {
  private readonly logger = new Logger(RevolutService.name);
  private readonly apiKey: string | undefined;
  private readonly apiUrl: string;
  private readonly webhookSecret: string | undefined;

  constructor(private configService: ConfigService) {
    this.apiKey = configService.get<string>('REVOLUT_MERCHANT_API_KEY');
    this.webhookSecret = configService.get<string>('REVOLUT_WEBHOOK_SECRET');
    this.apiUrl =
      configService.get<string>('REVOLUT_API_URL') ||
      'https://sandbox-merchant.revolut.com/api/1.0';

    if (!this.apiKey) {
      this.logger.warn('REVOLUT_MERCHANT_API_KEY not set. Revolut Pay will be disabled.');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async createPaymentOrder(
    amountInCents: number,
    description: string,
    metadata: Record<string, string>,
  ): Promise<{ checkoutUrl: string; orderId: string } | null> {
    if (!this.apiKey) {
      this.logger.warn('Revolut not configured, skipping payment order creation');
      return null;
    }

    try {
      const body = {
        amount: amountInCents,
        currency: 'EUR',
        description,
        merchant_order_id: metadata.invoiceId || metadata.jobId || crypto.randomUUID(),
        metadata,
      };

      const res = await fetch(`${this.apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Revolut API error ${res.status}: ${err}`);
      }

      const order: RevolutOrder = await res.json();
      return { checkoutUrl: order.checkout_url, orderId: order.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create Revolut payment order: ${message}`);
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('REVOLUT_WEBHOOK_SECRET not configured, skipping signature verification');
      return false;
    }

    try {
      const computed = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
