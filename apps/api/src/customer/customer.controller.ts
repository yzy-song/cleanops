import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '@cleanops/db';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Customers')
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '添加客户' })
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateCustomerDto) {
    return this.customerService.create({ ...dto, companyId });
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: '获取客户列表' })
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.customerService.findAll(companyId);
  }

  @Get('list/credit-risk')
  @Auth()
  @ApiOperation({ summary: '获取客户信用风险列表' })
  findAllWithCreditRisk(@CurrentUser('companyId') companyId: string) {
    return this.customerService.findAllWithCreditRisk(companyId);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: '获取客户详情' })
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Get(':id/credit-summary')
  @Auth()
  @ApiOperation({ summary: '获取客户信用摘要（未付账单和风险等级）' })
  getCreditSummary(@Param('id') id: string) {
    return this.customerService.getCreditSummary(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '更新客户信息' })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '删除客户' })
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }
}
