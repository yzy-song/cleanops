import { Module } from '@nestjs/common';
import { XeroController } from './xero.controller';

@Module({
  controllers: [XeroController],
})
export class XeroModule {}
