import { Module } from '@nestjs/common';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { PricingService } from './pricing.service';
import { EmailModule } from '../email/email.module';
import { GeocodingModule } from '../common/services/geocoding.module';

@Module({
  imports: [EmailModule, GeocodingModule],
  controllers: [QuoteController],
  providers: [QuoteService, PricingService],
  exports: [QuoteService, PricingService],
})
export class QuoteModule {}
