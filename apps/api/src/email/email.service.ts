import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Customer, User, Company } from '@cleanops/db';
import { format } from 'date-fns';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.resend = new Resend(configService.get<string>('RESEND_API_KEY'));
  }

  // 发送老板/管理员欢迎邮件
  async sendWelcomeEmail(user: User & { company: Company }) {
    const subject = `Welcome to CleanOps, ${user.company.name}!`;
    const html = `
      <h3>Hello, ${user.email}!</h3>
      <p>Thank you for choosing <strong>CleanOps</strong> to manage <strong>${user.company.name}</strong>.</p>
      <p>Our platform is here to help you streamline your cleaning business operations.</p>
    `;
    await this.sendEmail(user.email, subject, html);
  }

  // 密码重置邮件 (通用)
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

  // 任务确认邮件 (发送给客户)
  async sendJobConfirmationEmail(customer: Customer, job: Job, company: Company) {
    const startTime = format(new Date(job.scheduledStart), 'yyyy-MM-dd HH:mm');
    const subject = `Service Confirmed: Your booking with ${company.name}`;
    const html = `
      <h3>Hello, ${customer.name}!</h3>
      <p>Your cleaning service with <strong>${company.name}</strong> has been scheduled.</p>
      <p><strong>Scheduled Time:</strong> ${startTime}</p>
      <p><strong>Location:</strong> ${customer.address}</p>
      <p><strong>Access Instructions:</strong> ${customer.accessCode || 'None provided'}</p>
      <p>If you need to change your booking, please contact ${company.name} directly.</p>
    `;
    await this.sendEmail(customer.email || '', subject, html); // 确保 Customer 模型有 email 字段
  }

  // 账号邀请邮件 (用于给员工或新管理员发送临时密码)
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

  private async sendEmail(to: string, subject: string, html: string) {
    if (!to) return;
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
