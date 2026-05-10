import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CompanyModule } from './company/company.module';
import { WorkerModule } from './worker/worker.module';
import { CustomerModule } from './customer/customer.module';
import { AuthModule } from './auth/auth.module';
import { AppLogger } from './common/utils/logger';
import { JobModule } from './job/job.module';
import { EmailModule } from './email/email.module';
import { InvoiceModule } from './invoice/invoice.module';
import { ReportModule } from './report/report.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';
import { StripeModule } from './common/services/stripe.module';
import { BillingModule } from './billing/billing.module';
import { TrialGuard } from './billing/trial.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    StripeModule,
    PrismaModule,
    CompanyModule,
    EmailModule,
    WorkerModule,
    CustomerModule,
    AuthModule,
    JobModule,
    InvoiceModule,
    ReportModule,
    CloudinaryModule,
    CustomerPortalModule,
    BillingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppLogger,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TrialGuard,
    },
  ],
})
export class AppModule {}
