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

  // ==================== Stripe Key Management ====================

  async saveStripeKey(companyId: string, secretKey: string) {
    return this.prisma.client.company.update({
      where: { id: companyId },
      data: { stripeSecretKey: secretKey },
    });
  }

  async removeStripeKey(companyId: string) {
    return this.prisma.client.company.update({
      where: { id: companyId },
      data: { stripeSecretKey: null },
    });
  }

  async getStripeStatus(companyId: string) {
    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: { stripeSecretKey: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const hasKey = !!company.stripeSecretKey;
    return {
      connected: hasKey,
      mode: hasKey
        ? (company.stripeSecretKey!.startsWith('sk_live_') ? 'live' : 'test')
        : 'disconnected',
    };
  }
}
