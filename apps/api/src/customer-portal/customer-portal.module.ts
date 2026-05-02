import { Module } from '@nestjs/common';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [CustomerPortalController],
  providers: [CustomerPortalService, CustomerAuthGuard],
  exports: [CustomerPortalService],
})
export class CustomerPortalModule {}
