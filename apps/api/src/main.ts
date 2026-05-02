import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { AppModule } from './app.module';
// 注意：请确保以下文件在你当前项目中已存在，如果路径不同请自行调整
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppLogger } from './common/utils/logger';

async function bootstrap() {
  // 使用 NestExpressApplication 以获得更好的 Express 中间件支持
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger: false,
  });

  // 2. 安全与基础中间件
  app.use(helmet()); // 增强 HTTP 头部安全性

  // 3. 全局日志处理 (如果 AppLogger 已实现)
  const logger = await app.resolve(AppLogger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  // 4. Swagger 配置 - 合并了两个项目的描述
  const config = new DocumentBuilder()
    .setTitle('CleanOps API')
    .setDescription('The CleanOps 2026 Management API - 专业清洁业务管理系统')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:3000', 'Local development')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 5. 全局管道：自动验证请求体 (DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剔除 DTO 中未定义的属性
      transform: true, // 自动转换类型（如 string 转 number）
    }),
  );

  // 6. 全局拦截器与过滤器
  app.useGlobalInterceptors(new TransformInterceptor()); // 统一返回格式
  app.useGlobalFilters(new AllExceptionsFilter()); // 统一错误处理

  // 7. 灵活的 CORS 配置
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins ? corsOrigins.split(',').map((url) => url.trim()) : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 8. 静态资源（如有需要，例如存放清洁报告照片）
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // 9. 端口监听
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📝 Swagger API docs: http://localhost:${port}/api-docs`);
}

bootstrap().catch((err) => {
  console.error('💥 Error during bootstrap:', err);
});
