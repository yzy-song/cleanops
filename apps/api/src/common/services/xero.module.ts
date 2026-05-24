import { Global, Module } from '@nestjs/common';
import { XeroService } from './xero.service';

@Global()
@Module({
  providers: [XeroService],
  exports: [XeroService],
})
export class XeroModule {}
