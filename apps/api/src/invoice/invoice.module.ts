import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { StripeService } from '../common/services/stripe.service';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, StripeService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
