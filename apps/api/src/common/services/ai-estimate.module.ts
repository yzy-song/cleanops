import { Module, Global } from '@nestjs/common';
import { AiEstimateService } from './ai-estimate.service';

@Global()
@Module({
  providers: [AiEstimateService],
  exports: [AiEstimateService],
})
export class AiEstimateModule {}
