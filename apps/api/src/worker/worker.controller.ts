import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '@cleanops/db';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Workers')
@Controller('worker')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post()
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '添加清洁工' })
  async createWorker(@CurrentUser('companyId') companyId: string, @Body() dto: CreateWorkerDto) {
    return this.workerService.create(companyId, dto);
  }

  @Get('me/earnings')
  @Auth(Role.WORKER)
  @ApiOperation({ summary: '查看我的收入' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getMyEarnings(@CurrentUser() user: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.workerService.getMyEarnings(user.id, from, to);
  }

  @Get('me/jobs')
  @Auth(Role.WORKER)
  @ApiOperation({ summary: '查看我的任务' })
  getMyJobs(@CurrentUser() user: any) {
    return this.workerService.getMyJobs(user.id);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: '获取清洁工列表' })
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.workerService.findByCompany(companyId);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: '获取清洁工详情' })
  findOne(@Param('id') id: string) {
    return this.workerService.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '更新清洁工信息' })
  update(@Param('id') id: string, @Body() updateWorkerDto: UpdateWorkerDto) {
    return this.workerService.update(id, updateWorkerDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '停用清洁工' })
  remove(@Param('id') id: string) {
    return this.workerService.remove(id);
  }
}
