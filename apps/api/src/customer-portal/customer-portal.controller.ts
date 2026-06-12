import { Controller, Get, Post, Patch, Param, Body, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { TrialBypass } from '../billing/decorators/trial-bypass.decorator';
import {
  CalculateQuotePriceDto,
  CreateQuoteFromPortalDto,
  DeclineQuoteDto,
  CreateBookingDto,
} from './dto/portal-quote.dto';

@ApiTags('Customer Portal')
@Controller('portal')
export class CustomerPortalController {
  constructor(private readonly portalService: CustomerPortalService) {}

  @Get('book-info/:slug')
  @TrialBypass()
  @ApiOperation({ summary: '获取公开预约页面信息' })
  getBookInfo(@Param('slug') slug: string) {
    return this.portalService.getBookInfo(slug);
  }

  @Post('send-link')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
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

  @Patch('me')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '更新客户个人信息' })
  updateProfile(@Req() req: any, @Body() body: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    accessCode?: string;
  }) {
    return this.portalService.updateProfile(req.customer.id, body);
  }

  @Get('jobs')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '获取客户的任务列表' })
  getMyJobs(@Req() req: any) {
    return this.portalService.getMyJobs(req.customer.id);
  }

  @Get('jobs/:id')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '获取客户的任务详情（含照片、账单、工人信息）' })
  getMyJob(@Req() req: any, @Param('id') id: string) {
    return this.portalService.getMyJob(req.customer.id, id);
  }

  @Get('invoices')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '获取客户的账单列表（支持筛选和分页）' })
  getMyInvoices(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.portalService.getMyInvoices(
      req.customer.id,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('invoices/:id')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '获取单个账单详情' })
  getMyInvoice(@Req() req: any, @Param('id') id: string) {
    return this.portalService.getMyInvoice(req.customer.id, id);
  }

  @Post('book')
  @ApiOperation({ summary: '客户在线预约（公开）' })
  createBooking(@Body() body: CreateBookingDto) {
    return this.portalService.createBooking(body);
  }

  @Post('quote/calculate')
  @TrialBypass()
  @ApiOperation({ summary: '根据服务参数计算定价（公开）' })
  calculateQuotePrice(@Body() body: CalculateQuotePriceDto) {
    return this.portalService.calculateQuotePrice(body);
  }

  @Post('quote')
  @TrialBypass()
  @ApiOperation({ summary: '从公开表单创建报价' })
  createQuoteFromPortal(@Body() body: CreateQuoteFromPortalDto) {
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
  declineQuote(@Param('token') token: string, @Body() body: DeclineQuoteDto) {
    return this.portalService.declineQuote(token, body.reason);
  }

  @Get('quotes')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '获取已认证客户的报价列表' })
  getMyQuotes(@Req() req: any) {
    return this.portalService.getMyQuotes(req.customer.id);
  }

  @Post('invoices/:id/pay')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '生成账单的 Stripe 支付链接' })
  payInvoice(@Req() req: any, @Param('id') id: string) {
    return this.portalService.payInvoice(req.customer.id, id);
  }

  @Get('invoices/:id/pdf')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '下载账单 PDF（客户端）' })
  async downloadInvoicePdf(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.portalService.getInvoicePdf(req.customer.id, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post('quote/photo-estimate')
  @TrialBypass()
  @ApiOperation({ summary: '通过照片 AI 估算清洁报价' })
  estimateFromPhotos(@Body('photos') photos: string[]) {
    return this.portalService.estimateFromPhotos(photos);
  }

  @Get('review/:jobId')
  @ApiOperation({ summary: '获取评价页面信息（公开）' })
  getReviewInfo(@Param('jobId') jobId: string) {
    return this.portalService.getReviewInfo(jobId);
  }

  @Post('review/:jobId/feedback')
  @TrialBypass()
  @ApiOperation({ summary: '提交内部反馈（不满意的客户）' })
  submitReviewFeedback(@Param('jobId') jobId: string, @Body('feedback') feedback: string) {
    return this.portalService.submitReviewFeedback(jobId, feedback);
  }

  @Post('logout')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '客户退出登录（清除会话）' })
  logout(@Req() req: any) {
    return this.portalService.logout(req.customer.id);
  }

  @Patch('jobs/:id/reschedule')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '客户重新预约任务日期' })
  rescheduleJob(
    @Req() req: any,
    @Param('id') id: string,
    @Body('newDate') newDate: string,
  ) {
    return this.portalService.rescheduleJob(req.customer.id, id, newDate);
  }

  @Post('jobs/:id/cancel')
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: '客户取消待执行任务' })
  cancelJob(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.portalService.cancelJob(req.customer.id, id, reason);
  }
}
