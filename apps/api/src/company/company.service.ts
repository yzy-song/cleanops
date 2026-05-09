import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { CreateCompanyWithAdminDto } from './dto/create-company-with-admin.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from '../common/services/stripe.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async create(dto: CreateCompanyWithAdminDto) {
    const hashedPassword = await bcrypt.hash(dto.adminPass, 10);

    let stripeCustomerId: string | undefined;
    try {
      const stripe = this.stripeService.client;
      if (stripe) {
        const customer = await stripe.customers.create({
          name: dto.name,
          email: dto.adminEmail,
          metadata: { source: 'cleanops' },
        });
        stripeCustomerId = customer.id;
      }
    } catch (error) {
      this.logger.warn(`Failed to create Stripe customer: ${error}`);
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    return this.prisma.client.company.create({
      data: {
        name: dto.name,
        vatNumber: dto.vatNumber,
        baseHourlyRate: dto.baseHourlyRate ?? 1480,
        pensionEnrollment: true,
        stripeCustomerId,
        subscriptionStatus: 'TRIALING',
        trialEndsAt,
        users: {
          create: {
            email: dto.adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.client.company.findMany({
      include: { _count: { select: { workers: true, customers: true } } },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.client.company.findUnique({
      where: { id },
      include: { _count: { select: { users: true, workers: true, customers: true, jobs: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    return this.prisma.client.company.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.client.company.delete({ where: { id } });
  }

  // ==================== Stripe Connect ====================

  /** Generate Stripe Connect OAuth URL and redirect the user. */
  getConnectOAuthUrl(companyId: string): string {
    return this.stripeService.generateConnectOAuthUrl(companyId, '/settings?stripe=callback');
  }

  /** Handle Stripe Connect OAuth callback — exchange code for account ID. */
  async handleConnectCallback(companyId: string, code: string) {
    const { stripeUserId, email } = await this.stripeService.exchangeOAuthCode(code);

    // Retrieve initial account status
    let status = 'pending';
    try {
      const account = await this.stripeService.retrieveAccount(stripeUserId);
      status = account.status;
    } catch {
      // non-blocking: status will be updated via webhook
    }

    await this.prisma.client.company.update({
      where: { id: companyId },
      data: {
        stripeAccountId: stripeUserId,
        stripeAccountStatus: status,
        stripeAccountEmail: email,
      },
    });

    return { accountId: stripeUserId, email, status };
  }

  /** Get current Stripe Connect status for a company. */
  async getConnectStatus(companyId: string) {
    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: { stripeAccountId: true, stripeAccountStatus: true, stripeAccountEmail: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    // Refresh status from Stripe if account is connected
    if (company.stripeAccountId) {
      try {
        const account = await this.stripeService.retrieveAccount(company.stripeAccountId);
        if (account.status !== company.stripeAccountStatus) {
          await this.prisma.client.company.update({
            where: { id: companyId },
            data: { stripeAccountStatus: account.status },
          });
          company.stripeAccountStatus = account.status;
        }
      } catch {
        // non-blocking
      }
    }

    return {
      connected: !!company.stripeAccountId,
      accountId: company.stripeAccountId,
      email: company.stripeAccountEmail,
      status: company.stripeAccountStatus || 'disconnected',
    };
  }

  /** Update Connect account status from webhook. */
  async updateConnectAccountStatus(accountId: string, chargesEnabled: boolean) {
    const status = chargesEnabled ? 'enabled' : 'restricted';
    await this.prisma.client.company.updateMany({
      where: { stripeAccountId: accountId },
      data: { stripeAccountStatus: status },
    });
    this.logger.log(`Connect account ${accountId} status → ${status}`);
  }
}
