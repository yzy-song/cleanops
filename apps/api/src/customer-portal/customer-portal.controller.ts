import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { TrialBypass } from '../billing/decorators/trial-bypass.decorator';

@ApiTags('Customer Portal')
@Controller('portal')
export class CustomerPortalController {
  constructor(private readonly portalService: CustomerPortalService) {}

  @Post('send-link')
  @ApiOperation({ summary: '发送 magic link 到客户邮箱' })
  sendMagicLink(@Body('email') email: string) {
    return this.portalService.sendMagicLink(email);
  }

  @Post('verify')
  @ApiOperation({ summary: '验证 magic link token' })
  verifyToken(@Body('token') token: string) {
    return this.portalService.verifyToken(token);
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '获取客户个人信息' })
  getProfile(@Req() req: any) {
    return this.portalService.getProfile(req.customer.id);
  }

  @Get('jobs')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '获取客户的任务列表' })
  getMyJobs(@Req() req: any) {
    return this.portalService.getMyJobs(req.customer.id);
  }

  @Get('invoices')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '获取客户的账单列表' })
  getMyInvoices(@Req() req: any) {
    return this.portalService.getMyInvoices(req.customer.id);
  }

  @Get('invoices/:id')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '获取单个账单详情' })
  getMyInvoice(@Req() req: any, @Param('id') id: string) {
    return this.portalService.getMyInvoice(req.customer.id, id);
  }

  @Post('book')
  @ApiOperation({ summary: '客户在线预约（公开）' })
  createBooking(@Body() body: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    postalCode?: string;
    accessCode?: string;
    lat?: number;
    lng?: number;
    scheduledDate: string;
    notes?: string;
    companyId?: string;
  }) {
    return this.portalService.createBooking(body);
  }

  @Post('quote/calculate')
  @TrialBypass()
  @ApiOperation({ summary: '根据服务参数计算定价（公开）' })
  calculateQuotePrice(@Body() body: {
    serviceType: string;
    propertySize: string;
    bathrooms?: number;
    frequency: string;
    isCommercial: boolean;
    companyId?: string;
  }) {
    return this.portalService.calculateQuotePrice(body);
  }

  @Post('quote')
  @TrialBypass()
  @ApiOperation({ summary: '从公开表单创建报价' })
  createQuoteFromPortal(@Body() body: {
    serviceType: string;
    propertySize: string;
    bathrooms?: number;
    frequency: string;
    isCommercial: boolean;
    notes?: string;
    name: string;
    email: string;
    phone?: string;
    address: string;
    postalCode?: string;
    accessCode?: string;
    lat?: number;
    lng?: number;
    companyId?: string;
  }) {
    return this.portalService.createQuoteFromPortal(body);
  }

  @Get('quote/:token')
  @TrialBypass()
  @ApiOperation({ summary: '通过公开 token 查看报价' })
  viewQuoteByToken(@Param('token') token: string) {
    return this.portalService.viewQuoteByToken(token);
  }

  @Post('quote/:token/accept')
  @TrialBypass()
  @ApiOperation({ summary: '接受报价并创建任务（如需定金则返回支付链接）' })
  acceptQuote(@Param('token') token: string) {
    return this.portalService.acceptQuote(token);
  }

  @Post('quote/:token/decline')
  @TrialBypass()
  @ApiOperation({ summary: '拒绝报价' })
  declineQuote(@Param('token') token: string, @Body('reason') reason?: string) {
    return this.portalService.declineQuote(token, reason);
  }

  @Get('quotes')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '获取已认证客户的报价列表' })
  getMyQuotes(@Req() req: any) {
    return this.portalService.getMyQuotes(req.customer.id);
  }
}
