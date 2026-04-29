import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@cleanops/db';

@ApiTags('Jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '创建新任务' })
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateJobDto) {
    return this.jobService.create(companyId, dto);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: '获取任务列表（支持筛选和分页）' })
  findAll(@CurrentUser('companyId') companyId: string, @Query() query: QueryJobDto) {
    return this.jobService.findAll(companyId, query);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: '获取任务详情' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.jobService.findOne(id, companyId);
  }

  @Patch(':id')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '更新任务' })
  update(@Param('id') id: string, @CurrentUser('companyId') companyId: string, @Body() dto: UpdateJobDto) {
    return this.jobService.update(id, companyId, dto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '取消任务' })
  cancel(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.jobService.cancel(id, companyId);
  }

  @Patch(':id/assign')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '指派员工到任务' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { workerIds: { type: 'array', items: { type: 'string' } } },
      required: ['workerIds'],
    },
  })
  assignWorkers(@Param('id') id: string, @CurrentUser('companyId') companyId: string, @Body('workerIds') workerIds: string[]) {
    return this.jobService.assignWorkers(id, companyId, workerIds);
  }

  @Patch(':id/unassign/:workerId')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '从任务中移除员工' })
  unassignWorker(@Param('id') id: string, @Param('workerId') workerId: string, @CurrentUser('companyId') companyId: string) {
    return this.jobService.unassignWorker(id, companyId, workerId);
  }

  @Patch(':id/check-in')
  @Auth(Role.WORKER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '员工打卡开始工作' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lat: { type: 'number', example: 53.3498 },
        lng: { type: 'number', example: -6.2603 },
      },
      required: ['lat', 'lng'],
    },
  })
  async checkIn(
    @Param('id') jobId: string,
    @CurrentUser() user: any,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    return this.jobService.checkIn(jobId, user.id, lat, lng);
  }

  @Patch(':id/complete')
  @Auth(Role.WORKER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '员工完成任务' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string', description: '内部备注或现场反馈', example: 'Everything went well, keys returned.' },
      },
    },
  })
  async completeJob(
    @Param('id') jobId: string,
    @CurrentUser() user: any,
    @Body('notes') notes?: string,
  ) {
    return this.jobService.complete(jobId, user.id, notes);
  }
}
