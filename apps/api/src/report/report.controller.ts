import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@cleanops/db';

@ApiTags('Reports')
@Controller('report')
@Auth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '仪表盘 KPI 数据' })
  getDashboard(@CurrentUser('companyId') companyId: string) {
    return this.reportService.getDashboard(companyId);
  }

  @Get('payroll')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '薪资报表（含养老金和 PRSI）' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getPayroll(@CurrentUser('companyId') companyId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportService.getPayroll(companyId, from, to);
  }

  @Get('vat')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'VAT 报税汇总' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getVatReport(@CurrentUser('companyId') companyId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportService.getVatReport(companyId, from, to);
  }

  @Get('timesheet')
  @ApiOperation({ summary: '工时表' })
  @ApiQuery({ name: 'workerId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getTimesheet(
    @CurrentUser('companyId') companyId: string,
    @Query('workerId') workerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportService.getTimesheet(companyId, workerId, from, to);
  }
}
