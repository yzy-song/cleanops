import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Customer, User, Company } from '@cleanops/db';
import { format } from 'date-fns';
import { Resend } from 'resend';

function formatInvoiceRef(invoice: { invoiceNumber?: number | null; createdAt: Date }): string {
  const year = invoice.createdAt.getFullYear();
  if (!(invoice as any).invoiceNumber) return `INV-${year}-DRAFT`;
  return `INV-${year}-${String((invoice as any).invoiceNumber).padStart(4, '0')}`;
}

@Injectable()
export class EmailService {
  private readonly resend: Resend | null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not set. Email functionality will be disabled.');
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendWelcomeEmail(user: User & { company: Company }) {
    const subject = `Welcome to CleanOps, ${user.company.name}!`;
    const html = `
      <h3>Hello, ${user.email}!</h3>
      <p>Thank you for choosing <strong>CleanOps</strong> to manage <strong>${user.company.name}</strong>.</p>
      <p>Our platform is here to help you streamline your cleaning business operations.</p>
    `;
    await this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
    const subject = 'CleanOps Password Reset Request';
    const html = `
      <p>Hello,</p>
      <p>Please click the link below to reset your password for your CleanOps account:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 15 minutes.</p>
    `;
    await this.sendEmail(email, subject, html);
  }

  async sendJobConfirmationEmail(customer: Customer, job: Job, company: Company) {
    const startTime = format(new Date(job.scheduledStart), 'yyyy-MM-dd HH:mm');
    const subject = `Service Confirmed: Your booking with ${company.name}`;
    const html = `
      <h3>Hello, ${customer.name}!</h3>
      <p>Your cleaning service with <strong>${company.name}</strong> has been scheduled.</p>
      <p><strong>Scheduled Time:</strong> ${startTime}</p>
      <p><strong>Location:</strong> ${customer.address}</p>
      <p><strong>Access Instructions:</strong> ${customer.accessCode || 'None provided'}</p>
      ${(job as any).depositAmount ? `<p><strong>Deposit:</strong> €${((job as any).depositAmount / 100).toFixed(2)} — ${(job as any).isDepositPaid ? 'Paid' : 'Pending'}</p>` : ''}
      <p>If you need to change your booking, please contact ${company.name} directly.</p>
    `;
    await this.sendEmail(customer.email || '', subject, html);
  }

  async sendInvoiceEmail(
    customer: Customer,
    job: Job,
    invoice: { id: string; amount: number; vatAmount: number; invoiceNumber?: number | null; createdAt: Date },
    paymentLink?: string,
  ) {
    const startTime = format(new Date(job.scheduledStart), 'yyyy-MM-dd HH:mm');
    const vatRate = (customer as any).isCommercial ? '23%' : '13.5%';
    const subtotal = invoice.amount - invoice.vatAmount;
    const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;
    const ref = formatInvoiceRef(invoice);

    const subject = `Your cleaning invoice ${ref} is ready`;
    const html = `
      <h3>Hello, ${customer.name}!</h3>
      <p>Your cleaning service has been completed.</p>
      <p><strong>Invoice:</strong> ${ref}</p>
      <p><strong>Service Date:</strong> ${startTime}</p>
      <p><strong>Location:</strong> ${customer.address}</p>
      <hr />
      <p><strong>Subtotal:</strong> ${eur(subtotal)}</p>
      <p><strong>VAT (${vatRate}):</strong> ${eur(invoice.vatAmount)}</p>
      <p><strong>Total:</strong> ${eur(invoice.amount)}</p>
      ${paymentLink ? `<p><a href="${paymentLink}">Pay online</a></p>` : ''}
      <p>Thank you for your business!</p>
    `;
    await this.sendEmail(customer.email || '', subject, html);
  }

  async sendNewAccountInfoEmail(email: string, name: string, temporaryPassword: string, companyName: string) {
    const subject = `Your New Account at ${companyName} (CleanOps)`;
    const html = `
        <h3>Welcome, ${name}!</h3>
        <p>An account has been created for you at <strong>${companyName}</strong>.</p>
        <p>You can log in to the CleanOps platform using these credentials:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        <p>Please change your password after your first login.</p>
      `;
    await this.sendEmail(email, subject, html);
  }

  async sendDepositRequestEmail(customer: Customer, job: Job, depositLink?: string) {
    const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;
    const startTime = format(new Date(job.scheduledStart), 'yyyy-MM-dd HH:mm');
    const subject = `Deposit requested for your booking`;

    const html = `
      <h3>Hello, ${customer.name}!</h3>
      <p>Your booking has been received. A deposit is required to confirm your service.</p>
      <p><strong>Scheduled:</strong> ${startTime}</p>
      <p><strong>Deposit Amount:</strong> ${eur((job as any).depositAmount || 0)}</p>
      ${depositLink ? `<p><a href="${depositLink}">Pay deposit online</a></p>` : '<p>We will contact you with payment details.</p>'}
      <p>Your booking will be confirmed once the deposit is received.</p>
    `;
    await this.sendEmail(customer.email || '', subject, html);
  }

  async sendDepositConfirmationEmail(customer: Customer, job: Job) {
    const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;
    const startTime = format(new Date(job.scheduledStart), 'yyyy-MM-dd HH:mm');
    const subject = `Deposit received — booking confirmed`;

    const html = `
      <h3>Hello, ${customer.name}!</h3>
      <p>Your deposit of <strong>${eur((job as any).depositAmount || 0)}</strong> has been received.</p>
      <p>Your booking for <strong>${startTime}</strong> at <strong>${customer.address}</strong> is now confirmed.</p>
      <p>Thank you!</p>
    `;
    await this.sendEmail(customer.email || '', subject, html);
  }

  async sendInvoiceReminderEmail(
    invoice: { id: string; amount: number; invoiceNumber?: number | null; createdAt: Date },
    customer: Customer,
    paymentLink?: string,
  ) {
    const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;
    const ref = formatInvoiceRef(invoice);

    const subject = `Reminder: Your invoice ${ref} is due`;
    const html = `
      <h3>Hello, ${customer.name}!</h3>
      <p>This is a friendly reminder that your invoice <strong>${ref}</strong> for <strong>${eur(invoice.amount)}</strong> is still unpaid.</p>
      <p>Please settle at your earliest convenience.</p>
      ${paymentLink ? `<p><a href="${paymentLink}">Pay online</a></p>` : ''}
      <p>If you have already paid, please disregard this message.</p>
    `;
    await this.sendEmail(customer.email || '', subject, html);
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!to) return;
    if (!this.resend) {
      this.logger.warn(`Email service is disabled. Skipping email to ${to}`);
      return;
    }
    try {
      const from = this.configService.get<string>('EMAIL_FROM') || 'noreply@cleanops.com';
      await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${to}: ${errorMessage}`);
    }
  }
}
