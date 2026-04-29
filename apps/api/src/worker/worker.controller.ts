import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('worker')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post()
  async createWorker(
    @CurrentUser('companyId') companyId: string, // 自动从 JWT 拿，安全且简单
    @Body() dto: CreateWorkerDto,
  ) {
    return this.workerService.create(companyId, dto);
  }

  @Get()
  findAll(@Body('companyId') companyId: string) {
    return this.workerService.findByCompany(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkerDto: UpdateWorkerDto) {
    return this.workerService.update(+id, updateWorkerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workerService.remove(+id);
  }
}
