import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { EmailModule } from 'src/email/email.module';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [EmailModule, InvoiceModule, CloudinaryModule],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
