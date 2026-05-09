import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res, Logger } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyWithAdminDto } from './dto/create-company-with-admin.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@cleanops/db';
import { TrialBypass } from '../billing/decorators/trial-bypass.decorator';
import { Response } from 'express';

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

  // ---- Stripe Connect (must be before :id) ----

  @Get('stripe/connect')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '获取 Stripe Connect OAuth 链接' })
  connectStripe(@CurrentUser('companyId') companyId: string) {
    const url = this.companyService.getConnectOAuthUrl(companyId);
    return { url };
  }

  @Get('stripe/callback')
  @TrialBypass()
  @ApiOperation({ summary: 'Stripe Connect OAuth 回调' })
  async stripeConnectCallback(
    @Query('code') code: string,
    @Query('state') companyId: string,
    @Res() res: Response,
  ) {
    if (!code || !companyId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?stripe=error`);
    }
    try {
      await this.companyService.handleConnectCallback(companyId, code);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?stripe=success`);
    } catch (err: any) {
      this.logger.error(`Stripe Connect callback failed: ${err.message}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?stripe=error`);
    }
  }

  @Get('stripe/status')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '获取当前公司 Stripe Connect 状态' })
  getStripeStatus(@CurrentUser('companyId') companyId: string) {
    return this.companyService.getConnectStatus(companyId);
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
