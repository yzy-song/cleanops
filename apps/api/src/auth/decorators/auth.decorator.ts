import { applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '@cleanops/db';
import { Roles } from './roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(), // 自动在 Swagger 加上锁图标
    ApiUnauthorizedResponse({ description: '未登录或 Token 无效' }),
    ApiForbiddenResponse({ description: '权限不足' }),
  );
}
