import { Module, Global } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { RevolutService } from './revolut.service';

@Global()
@Module({
  providers: [StripeService, RevolutService],
  exports: [StripeService, RevolutService],
})
export class StripeModule {}
