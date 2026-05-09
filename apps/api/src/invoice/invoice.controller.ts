import { Controller, Get, Post, Patch, Param, Body, Query, Req, Headers, HttpCode, HttpStatus, RawBodyRequest, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@cleanops/db';
import { TrialBypass } from '../billing/decorators/trial-bypass.decorator';

@ApiTags('Invoices')
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('generate/:jobId')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '从已完成任务自动生成账单' })
  generateFromJob(@Param('jobId') jobId: string, @CurrentUser('companyId') companyId: string) {
    return this.invoiceService.generateFromJob(companyId, jobId);
  }

  @Post()
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '手动创建账单' })
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(companyId, dto);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: '获取账单列表' })
  findAll(@CurrentUser('companyId') companyId: string, @Query() query: QueryInvoiceDto) {
    return this.invoiceService.findAll(companyId, query);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: '获取账单详情' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.invoiceService.findOne(id, companyId);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '更新账单（仅限未支付状态）' })
  update(@Param('id') id: string, @CurrentUser('companyId') companyId: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoiceService.update(id, companyId, dto);
  }

  @Post(':id/pay')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '生成 Stripe 支付链接' })
  generatePaymentLink(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.invoiceService.generatePaymentLink(id, companyId);
  }

  @Post(':id/mark-paid')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '手动标记已支付' })
  markAsPaid(@Param('id') id: string, @CurrentUser('companyId') companyId: string, @Body('paymentMethod') paymentMethod?: string) {
    return this.invoiceService.markAsPaid(id, companyId, paymentMethod);
  }

  @Post(':id/void')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '作废账单' })
  voidInvoice(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.invoiceService.voidInvoice(id, companyId);
  }

  @Post(':id/send-reminder')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '发送催款邮件' })
  sendReminder(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.invoiceService.sendReminder(id, companyId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @TrialBypass()
  @ApiOperation({ summary: 'Stripe webhook 回调（支付 + 退款）' })
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.invoiceService.handleStripeWebhook(req.rawBody!, signature);
  }

  @Post('webhook/connect')
  @HttpCode(HttpStatus.OK)
  @TrialBypass()
  @ApiOperation({ summary: 'Stripe Connect webhook (account.updated)' })
  async connectWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.invoiceService.handleConnectWebhook(req.rawBody!, signature);
  }

  @Get(':id/pdf')
  @Auth()
  @ApiOperation({ summary: '下载账单 PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.invoiceService.generatePdf(id, companyId);
    res.setHeader('Content-Type', 'application/pdf');
    const invoice = await this.invoiceService.findOne(id, companyId);
    const invNum = invoice.invoiceNumber
      ? `INV-${new Date(invoice.createdAt).getFullYear()}-${String(invoice.invoiceNumber).padStart(4, '0')}`
      : id.slice(0, 8);
    res.setHeader('Content-Disposition', `attachment; filename="${invNum}.pdf"`);
    res.send(pdfBuffer);
  }
}
