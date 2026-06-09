import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/health')
  @ApiOperation({ summary: '健康检查 — 服务状态 + 数据库连通性' })
  async healthCheck() {
    return this.appService.healthCheck();
  }
}
