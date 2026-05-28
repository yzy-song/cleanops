import { Module } from '@nestjs/common';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { EmailModule } from 'src/email/email.module';
import { QuoteModule } from '../quote/quote.module';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [EmailModule, QuoteModule, InvoiceModule],
  controllers: [CustomerPortalController],
  providers: [CustomerPortalService, CustomerAuthGuard],
  exports: [CustomerPortalService],
})
export class CustomerPortalModule {}
