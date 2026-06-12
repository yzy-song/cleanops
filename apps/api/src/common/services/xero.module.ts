import { Global, Module } from '@nestjs/common';
import { XeroService } from './xero.service';
import { XeroTimesheetService } from './xero-timesheet.service';

@Global()
@Module({
  providers: [XeroService, XeroTimesheetService],
  exports: [XeroService, XeroTimesheetService],
})
export class XeroModule {}
