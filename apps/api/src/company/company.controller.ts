import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyWithAdminDto } from './dto/create-company-with-admin.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '@cleanops/db';

@ApiTags('Companies')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: '注册新清洁公司（公开）' })
  create(@Body() body: CreateCompanyWithAdminDto) {
    return this.companyService.create(body);
  }

  @Get()
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '获取所有公司（平台管理员）' })
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: '获取公司详情' })
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '更新公司信息' })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '删除公司' })
  remove(@Param('id') id: string) {
    return this.companyService.remove(id);
  }
}
