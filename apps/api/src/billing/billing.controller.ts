import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@cleanops/db';
import { TrialBypass } from './decorators/trial-bypass.decorator';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @Auth()
  @ApiOperation({ summary: '查询当前订阅状态' })
  getSubscription(@CurrentUser('companyId') companyId: string) {
    return this.billingService.getSubscriptionStatus(companyId);
  }

  @Post('checkout')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '创建 Stripe Checkout Session（订阅付费）' })
  createCheckout(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCheckoutDto,
    @Body('interval') interval?: 'month' | 'year',
  ) {
    return this.billingService.createCheckoutSession(companyId, dto.plan, interval || 'month');
  }

  @Post('portal')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '创建 Stripe Customer Portal Session（管理订阅）' })
  createPortal(@CurrentUser('companyId') companyId: string) {
    return this.billingService.createPortalSession(companyId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @TrialBypass()
  @ApiOperation({ summary: 'Stripe billing webhook（订阅事件）' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody!, signature);
  }
}
