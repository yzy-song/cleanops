import { Module } from '@nestjs/common';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { PricingService } from './pricing.service';

@Module({
  controllers: [QuoteController],
  providers: [QuoteService, PricingService],
  exports: [QuoteService, PricingService],
})
export class QuoteModule {}
