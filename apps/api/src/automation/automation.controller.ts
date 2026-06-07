import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '@cleanops/db';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Automations')
@Controller('automations')
export class AutomationController {
  constructor(private readonly service: AutomationService) {}

  @Post()
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '创建自动化规则' })
  async create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateAutomationDto): Promise<any> {
    return this.service.create(companyId, dto);
  }

  @Get()
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '获取自动化规则列表' })
  async findAll(@CurrentUser('companyId') companyId: string): Promise<any> {
    return this.service.findAll(companyId);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '更新自动化规则' })
  update(@Param('id') id: string, @CurrentUser('companyId') companyId: string, @Body() dto: Partial<CreateAutomationDto>) {
    return this.service.update(id, companyId, dto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '删除自动化规则' })
  remove(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.remove(id, companyId);
  }
}
