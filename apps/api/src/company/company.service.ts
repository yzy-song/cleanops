import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateCompanyWithAdminDto } from './dto/create-company-with-admin.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from '../common/services/stripe.service';
import * as bcrypt from 'bcrypt';
import Stripe from 'stripe';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async create(dto: CreateCompanyWithAdminDto) {
    const hashedPassword = await bcrypt.hash(dto.adminPass, 10);

    // Create Stripe Customer
    let stripeCustomerId: string | undefined;
    try {
      const stripe = (this.stripeService as any).stripe as Stripe | null;
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
    return await this.prisma.client.company.findMany({
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
}
