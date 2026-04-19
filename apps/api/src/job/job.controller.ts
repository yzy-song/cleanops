import { Controller, Post, Body, Get, Param, UseGuards, Patch, Request } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { CheckInDto } from './dto/check-in.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentCompanyId } from 'src/common/decorators/get-company.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: '老板指派新任务' })
  create(@CurrentCompanyId() companyId: string, @Body() dto: CreateJobDto) {
    return this.jobService.create(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取公司所有任务列表' })
  findAll(@CurrentCompanyId() companyId: string) {
    return this.jobService.findAll(companyId);
  }

  @Patch(':id/check-in')
  @ApiOperation({ summary: '员工打卡开始工作' })
  checkIn(
    @Param('id') id: string,
    @Request() req, // 从 JWT 获取 workerId (通常对应 User 表中的关联)
    @Body() location: CheckInDto,
  ) {
    // 假设你的 JWT payload 中记录了 user.id
    return this.jobService.checkIn(id, req.user.userId, location);
  }
}
