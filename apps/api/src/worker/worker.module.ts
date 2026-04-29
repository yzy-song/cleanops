import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerController } from './worker.controller';
import { EmailModule } from '../email/email.module';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [WorkerController],
  providers: [WorkerService, EmailService],
})
export class WorkerModule {}
