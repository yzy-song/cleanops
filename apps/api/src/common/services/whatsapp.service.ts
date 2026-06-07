import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class WhatsAppService {
  private readonly client: Twilio | null;
  private readonly fromNumber: string;
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private configService: ConfigService) {
    const accountSid = configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = configService.get<string>('TWILIO_WHATSAPP_FROM') || '';

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not set — WhatsApp will be disabled');
      this.client = null;
    } else {
      this.client = new Twilio(accountSid, authToken);
    }
  }

  /** Send a WhatsApp message. Returns true if sent, false if skipped. */
  async send(phone: string, body: string): Promise<boolean> {
    if (!this.client) {
      this.logger.warn(`WhatsApp disabled — skipping message to ${phone}`);
      return false;
    }
    if (!phone) {
      this.logger.warn('No phone number provided — skipping WhatsApp');
      return false;
    }

    // Normalize phone to E.164
    const to = phone.startsWith('+') ? phone : `+${phone.replace(/^0+/, '')}`;

    try {
      await this.client.messages.create({
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${to}`,
        body,
      });
      this.logger.log(`WhatsApp sent to ${to}`);
      return true;
    } catch (err: any) {
      this.logger.error(`WhatsApp send failed to ${to}: ${err.message}`);
      return false;
    }
  }

  /** Compose and send a service reminder via WhatsApp */
  async sendServiceReminder(
    customer: { name: string; phone?: string | null },
    job: {
      scheduledStart: Date;
      estimatedDuration?: number | null;
      customer?: { address?: string; accessCode?: string | null };
    },
    workerName?: string | null,
  ): Promise<boolean> {
    if (!customer.phone) return false;

    const dateStr = job.scheduledStart.toISOString
      ? job.scheduledStart.toISOString().split('T')[0]
      : new Date(job.scheduledStart).toISOString().split('T')[0];

    const msg = [
      `Hi ${customer.name}, this is a reminder that your cleaning service is tomorrow (${dateStr}).`,
      job.estimatedDuration ? `Duration: ~${job.estimatedDuration} min.` : '',
      workerName ? `Your cleaner: ${workerName}.` : '',
      job.customer?.address ? `Location: ${job.customer.address}.` : '',
      job.customer?.accessCode && job.customer.accessCode !== 'None provided'
        ? `Access: ${job.customer.accessCode}.`
        : '',
      'Reply if you need to reschedule.',
    ]
      .filter(Boolean)
      .join('\n');

    return this.send(customer.phone, msg);
  }
}
