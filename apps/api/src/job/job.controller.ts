import { Controller, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JobService } from './job.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@cleanops/db';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Patch(':id/check-in')
  @Roles(Role.WORKER, Role.ADMIN) // 员工和管理员都能打卡
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
  async checkIn(@Param('id') jobId: string, @Request() req: any, @Body('lat') lat: number, @Body('lng') lng: number) {
    // 这里的 req.user.userId 是从 JwtStrategy 返回的对象中提取的
    return this.jobService.checkIn(jobId, req.user.userId, lat, lng);
  }

  @Patch(':id/complete')
  @Roles(Role.WORKER, Role.ADMIN)
  @ApiOperation({ summary: '员工完成任务' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string', description: '内部备注或现场反馈', example: 'Everything went well, keys returned.' },
      },
    },
  })
  async completeJob(@Param('id') jobId: string, @Request() req: any, @Body('notes') notes?: string) {
    return this.jobService.complete(jobId, req.user.userId, notes);
  }
}
