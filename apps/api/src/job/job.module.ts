import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { SchedulingService } from './scheduling.service';
import { RecurringJobService } from './recurring-job.service';
import { ReminderService } from './reminder.service';
import { ReviewService } from './review.service';
import { JobController } from './job.controller';
import { EmailModule } from 'src/email/email.module';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [EmailModule, InvoiceModule, CloudinaryModule],
  controllers: [JobController],
  providers: [JobService, SchedulingService, RecurringJobService, ReminderService, ReviewService],
})
export class JobModule {}
