import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';

const TRIAL_BYPASS_KEY = 'TRIAL_BYPASS';

@Injectable()
export class TrialGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const bypass = this.reflector.getAllAndOverride<boolean>(TRIAL_BYPASS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (bypass) return true;

    const request = context.switchToHttp().getRequest();
    const companyId = request.user?.companyId;
    if (!companyId) return true; // public endpoint, let auth guard handle

    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
      },
    });

    if (!company) return true;

    const now = new Date();

    // Active subscription → allow
    if (
      company.subscriptionStatus === 'ACTIVE' &&
      company.subscriptionEndsAt &&
      company.subscriptionEndsAt > now
    ) {
      return true;
    }

    // In trial → allow
    if (
      company.subscriptionStatus === 'TRIALING' &&
      company.trialEndsAt &&
      company.trialEndsAt > now
    ) {
      return true;
    }

    // Trial active but status not set → check trialEndsAt only
    if (company.trialEndsAt && company.trialEndsAt > now) {
      return true;
    }

    throw new HttpException(
      {
        statusCode: 402,
        message: 'Trial expired. Please subscribe to continue.',
        code: 'TRIAL_EXPIRED',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
