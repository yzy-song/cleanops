import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { XeroService } from '../common/services/xero.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '@cleanops/db';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TrialBypass } from '../billing/decorators/trial-bypass.decorator';

@ApiTags('Xero')
@Controller('xero')
export class XeroController {
  constructor(
    private xeroService: XeroService,
    private configService: ConfigService,
  ) {}

  @Get('connect')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Get Xero OAuth2 authorization URL' })
  async connect(@CurrentUser('companyId') companyId: string) {
    return this.xeroService.generateAuthUrl(companyId);
  }

  @Get('callback')
  @TrialBypass()
  @ApiOperation({ summary: 'Xero OAuth2 callback' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    try {
      await this.xeroService.handleCallback(state, code);
      res.redirect(`${frontendUrl}/settings?xero=success`);
    } catch (err: any) {
      const msg = encodeURIComponent(err.message || 'Xero connection failed');
      res.redirect(`${frontendUrl}/settings?xero=error&message=${msg}`);
    }
  }

  @Get('status')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Get Xero connection status' })
  async status(@CurrentUser('companyId') companyId: string) {
    return this.xeroService.getConnectionStatus(companyId);
  }

  @Post('disconnect')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: 'Disconnect Xero' })
  async disconnect(@CurrentUser('companyId') companyId: string) {
    await this.xeroService.disconnect(companyId);
    return { success: true };
  }
}
