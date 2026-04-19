// apps/api/src/modules/auth/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';
// 确保是从生成的 prisma 客户端导入那个 enum
import { Role } from '@cleanops/db';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
