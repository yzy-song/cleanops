import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { StripeService } from '../common/services/stripe.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [InvoiceController],
  providers: [InvoiceService, StripeService],
  exports: [InvoiceService, StripeService],
})
export class InvoiceModule {}
