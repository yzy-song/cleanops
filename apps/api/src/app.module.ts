import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService, AppLogger],
})
export class AppModule {}
