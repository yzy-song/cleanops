import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PayslipPdfService } from './payslip-pdf.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, PayslipPdfService],
  exports: [ReportService, PayslipPdfService],
})
export class ReportModule {}
