import { Controller, Get, Post, Body, Patch, Param, Delete, Logger } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyWithAdminDto } from './dto/create-company-with-admin.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@cleanops/db';
import { TrialBypass } from '../billing/decorators/trial-bypass.decorator';

@ApiTags('Companies')
@Controller('company')
export class CompanyController {
  private readonly logger = new Logger(CompanyController.name);

  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @TrialBypass()
  @ApiOperation({ summary: '注册新清洁公司（公开）' })
  create(@Body() body: CreateCompanyWithAdminDto) {
    return this.companyService.create(body);
  }

  // ---- Stripe Key Management ----

  @Post('stripe/key')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '保存公司的 Stripe Secret Key' })
  async saveStripeKey(
    @CurrentUser('companyId') companyId: string,
    @Body('secretKey') secretKey: string,
  ) {
    if (!secretKey || (!secretKey.startsWith('sk_live_') && !secretKey.startsWith('sk_test_'))) {
      return { success: false, message: 'Invalid Stripe secret key. Must start with sk_live_ or sk_test_' };
    }
    await this.companyService.saveStripeKey(companyId, secretKey);
    return { success: true, message: 'Stripe key saved' };
  }

  @Get('stripe/status')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '检查公司是否已配置 Stripe' })
  async getStripeStatus(@CurrentUser('companyId') companyId: string) {
    return this.companyService.getStripeStatus(companyId);
  }

  @Post('stripe/disconnect')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '移除公司的 Stripe 密钥' })
  async disconnectStripe(@CurrentUser('companyId') companyId: string) {
    await this.companyService.removeStripeKey(companyId);
    return { success: true };
  }

  // ---- CRUD ----

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
