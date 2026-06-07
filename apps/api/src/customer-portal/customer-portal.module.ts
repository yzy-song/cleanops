import { Module } from '@nestjs/common';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { EmailModule } from 'src/email/email.module';
import { QuoteModule } from '../quote/quote.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { ReviewService } from '../job/review.service';

@Module({
  imports: [EmailModule, QuoteModule, InvoiceModule],
  controllers: [CustomerPortalController],
  providers: [CustomerPortalService, CustomerAuthGuard, ReviewService],
  exports: [CustomerPortalService],
})
export class CustomerPortalModule {}
