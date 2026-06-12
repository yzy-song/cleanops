import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { XeroClient, TokenSet } from 'xero-node';
import crypto from 'crypto';

interface XeroTokenSet {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
}

@Injectable()
export class XeroService {
  private readonly logger = new Logger(XeroService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly pendingClients = new Map<string, { client: XeroClient; companyId: string }>();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.clientId = configService.get<string>('XERO_CLIENT_ID') || '';
    this.clientSecret = configService.get<string>('XERO_CLIENT_SECRET') || '';
    this.redirectUri =
      configService.get<string>('XERO_REDIRECT_URI') ||
      'https://api.cleanops.yzysong.com/xero/callback';
  }

  get isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  async disconnect(companyId: string): Promise<void> {
    await this.prisma.client.company.update({
      where: { id: companyId },
      data: {
        xeroTenantId: null,
        xeroTenantName: null,
        xeroAccessToken: null,
        xeroRefreshToken: null,
        xeroTokenExpiresAt: null,
      },
    });
  }

  // ==================== OAuth Flow ====================

  async generateAuthUrl(companyId: string): Promise<{ url: string }> {
    if (!this.isConfigured) throw new BadRequestException('Xero is not configured');

    const state = crypto.randomBytes(16).toString('hex');

    const client = new XeroClient({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUris: [this.redirectUri],
      scopes: 'offline_access accounting.invoices accounting.contacts accounting.settings'.split(' '),
      state,
    });

    const url = await client.buildConsentUrl();

    this.pendingClients.set(state, { client, companyId });

    // Clean up old entries (keep last 100)
    if (this.pendingClients.size > 100) {
      const keys = [...this.pendingClients.keys()].slice(0, 50);
      keys.forEach((k) => this.pendingClients.delete(k));
    }

    return { url };
  }

  async handleCallback(state: string, code: string): Promise<{ companyId: string }> {
    const entry = this.pendingClients.get(state);
    if (!entry) throw new BadRequestException('Invalid or expired Xero OAuth state');

    this.pendingClients.delete(state);

    const tokenSet = (await entry.client.apiCallback(
      new URL(`http://localhost?code=${code}&state=${state}`).toString(),
    )) as unknown as XeroTokenSet;

    if (!tokenSet.access_token) {
      throw new BadRequestException('Failed to obtain Xero access token');
    }

    await entry.client.updateTenants();
    const tenants = entry.client.tenants;

    if (!tenants.length) {
      throw new BadRequestException('No Xero organisation found');
    }

    const tenant = tenants[0];

    await this.prisma.client.company.update({
      where: { id: entry.companyId },
      data: {
        xeroTenantId: tenant.tenantId,
        xeroTenantName: tenant.tenantName,
        xeroAccessToken: tokenSet.access_token,
        xeroRefreshToken: tokenSet.refresh_token || '',
        xeroTokenExpiresAt: tokenSet.expires_at
          ? new Date(tokenSet.expires_at * 1000)
          : new Date(Date.now() + 30 * 60 * 1000),
        xeroConnectedAt: new Date(),
      },
    });

    return { companyId: entry.companyId };
  }

  // ==================== Client Management ====================

  async getClient(companyId: string): Promise<XeroClient | null> {
    const company = await this.prisma.client.company.findUnique({ where: { id: companyId } });
    if (!company?.xeroTenantId || !company?.xeroAccessToken) return null;

    // Refresh if token expires within 5 minutes
    if (company.xeroTokenExpiresAt && company.xeroTokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      await this.refreshToken(companyId);
      const refreshed = await this.prisma.client.company.findUnique({ where: { id: companyId } });
      if (!refreshed?.xeroAccessToken) return null;
      return this.createClientFromCompany(refreshed);
    }

    return this.createClientFromCompany(company);
  }

  private createClientFromCompany(company: {
    xeroAccessToken: string;
    xeroRefreshToken: string;
    xeroTokenExpiresAt: Date | null;
  }): XeroClient {
    const xero = new XeroClient({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUris: [this.redirectUri],
      scopes: 'offline_access accounting.invoices accounting.contacts accounting.settings'.split(' '),
    });

    // Populate token set using the official setter
    const tokenSet = new TokenSet();
    tokenSet.access_token = company.xeroAccessToken;
    tokenSet.refresh_token = company.xeroRefreshToken;
    tokenSet.expires_at = company.xeroTokenExpiresAt
      ? Math.floor(company.xeroTokenExpiresAt.getTime() / 1000)
      : undefined;
    tokenSet.token_type = 'Bearer';
    xero.setTokenSet(tokenSet);

    return xero;
  }

  async refreshToken(companyId: string): Promise<void> {
    const company = await this.prisma.client.company.findUnique({ where: { id: companyId } });
    if (!company?.xeroRefreshToken) return;

    try {
      const xero = this.createClientFromCompany(company);
      const tokenSet = (await xero.refreshToken()) as XeroTokenSet;

      await this.prisma.client.company.update({
        where: { id: companyId },
        data: {
          xeroAccessToken: tokenSet.access_token,
          xeroRefreshToken: tokenSet.refresh_token || company.xeroRefreshToken,
          xeroTokenExpiresAt: tokenSet.expires_at
            ? new Date(tokenSet.expires_at * 1000)
            : new Date(Date.now() + 30 * 60 * 1000),
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to refresh Xero token for company ${companyId}: ${msg}`);
    }
  }

  // ==================== Token Refresh ====================

  @Cron('*/25 * * * *')
  async refreshTokensCron() {
    const companies = await this.prisma.client.company.findMany({
      where: {
        xeroRefreshToken: { not: null },
        xeroTokenExpiresAt: { lte: new Date(Date.now() + 30 * 60 * 1000) },
      },
      select: { id: true },
    });

    for (const c of companies) {
      await this.refreshToken(c.id);
    }
  }

  // ==================== Status ====================

  async getConnectionStatus(companyId: string) {
    const company = await this.prisma.client.company.findUnique({
      where: { id: companyId },
      select: {
        xeroTenantId: true,
        xeroTenantName: true,
        xeroTokenExpiresAt: true,
        xeroConnectedAt: true,
      },
    });

    return {
      connected: !!company?.xeroTenantId,
      tenantId: company?.xeroTenantId || null,
      tenantName: company?.xeroTenantName || null,
      connectedAt: company?.xeroConnectedAt || null,
      tokenExpiresAt: company?.xeroTokenExpiresAt || null,
    };
  }
}
