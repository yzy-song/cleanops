import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CustomerPortalService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async sendMagicLink(email: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { email },
    });
    if (!customer) throw new NotFoundException('No customer found with this email');

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await this.prisma.client.customer.update({
      where: { id: customer.id },
      data: { authToken: token, authTokenExpiresAt: expiresAt },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const link = `${frontendUrl}/portal/verify?token=${token}`;

    await this.emailService.sendEmail(
      email,
      'Your CleanOps Portal Access',
      `<p>Hello ${customer.name},</p>
       <p>Click the link below to access your account:</p>
       <p><a href="${link}">${link}</a></p>
       <p>This link expires in 30 minutes.</p>`,
    );

    return { message: 'Magic link sent to your email' };
  }

  async verifyToken(token: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { authToken: token },
    });
    if (!customer) throw new UnauthorizedException('Invalid token');
    if (customer.authTokenExpiresAt && customer.authTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Token expired');
    }
    return { token, customerId: customer.id, name: customer.name, email: customer.email };
  }

  async getProfile(customerId: string) {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async getMyJobs(customerId: string) {
    return this.prisma.client.job.findMany({
      where: { customerId },
      include: { assignments: { include: { worker: true } }, invoice: true },
      orderBy: { scheduledStart: 'desc' },
      take: 50,
    });
  }

  async getMyInvoices(customerId: string) {
    return this.prisma.client.invoice.findMany({
      where: { job: { customerId } },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getMyInvoice(customerId: string, invoiceId: string) {
    const invoice = await this.prisma.client.invoice.findFirst({
      where: { id: invoiceId, job: { customerId } },
      include: {
        company: true,
        job: { include: { customer: true, assignments: { include: { worker: true } } } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async createBooking(data: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    eircode?: string;
    accessCode?: string;
    lat?: number;
    lng?: number;
    scheduledDate: string;
    notes?: string;
    companyId?: string;
  }) {
    // If no companyId provided, use the first company (MVP)
    if (!data.companyId) {
      const firstCompany = await this.prisma.client.company.findFirst();
      if (!firstCompany) throw new BadRequestException('No company configured');
      data.companyId = firstCompany.id;
    }

    // Find or create customer
    let customer = await this.prisma.client.customer.findFirst({
      where: { email: data.email, companyId: data.companyId },
    });

    if (!customer) {
      customer = await this.prisma.client.customer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          eircode: data.eircode,
          accessCode: data.accessCode,
          lat: data.lat ?? 53.3498,
          lng: data.lng ?? -6.2603,
          company: { connect: { id: data.companyId } },
        },
      });
    }

    const job = await this.prisma.client.job.create({
      data: {
        scheduledStart: new Date(data.scheduledDate),
        notes: data.notes,
        status: 'PENDING',
        customer: { connect: { id: customer.id } },
        company: { connect: { id: data.companyId } },
      },
      include: { customer: true },
    });

    return { customer, job };
  }
}
