import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@cleanops/db';

@ApiTags('Quotes')
@Controller('quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '创建报价' })
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateQuoteDto) {
    return this.quoteService.create(companyId, dto);
  }

  @Get()
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '获取报价列表' })
  findAll(@CurrentUser('companyId') companyId: string, @Query() query: QueryQuoteDto) {
    return this.quoteService.findAll(companyId, query);
  }

  @Get(':id')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '获取报价详情' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.quoteService.findOne(id, companyId);
  }

  @Patch(':id')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '更新报价（仅限 DRAFT 状态）' })
  update(@Param('id') id: string, @CurrentUser('companyId') companyId: string, @Body() dto: UpdateQuoteDto) {
    return this.quoteService.update(id, companyId, dto);
  }

  @Post(':id/send')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '发送报价给客户' })
  send(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.quoteService.send(id, companyId);
  }

  @Post(':id/convert')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '将已接受报价转为任务' })
  convertToJob(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.quoteService.convertToJob(id, companyId);
  }

  @Post(':id/decline')
  @Auth(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '拒绝报价（管理员操作）' })
  decline(@Param('id') id: string, @CurrentUser('companyId') companyId: string, @Body('reason') reason?: string) {
    return this.quoteService.markDeclined(id, companyId, reason);
  }
}
