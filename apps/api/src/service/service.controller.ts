import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '@cleanops/db';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Services')
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '创建服务' })
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateServiceDto) {
    return this.serviceService.create(companyId, dto);
  }

  @Get()
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '获取服务列表' })
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.serviceService.findAll(companyId);
  }

  @Get(':id')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '获取服务详情' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.serviceService.findOne(id, companyId);
  }

  @Patch(':id')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '更新服务' })
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.serviceService.update(id, companyId, dto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '删除服务' })
  remove(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.serviceService.remove(id, companyId);
  }
}
