import 'reflect-metadata';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // FR-18: tin reverse proxy (Fly.io) để `req.ip` lấy client IP thật từ X-Forwarded-For.
  app.set('trust proxy', 1);

  // ADR-010: STORAGE_DRIVER=local → serve file đã upload tại /uploads từ volume.
  if (process.env.STORAGE_DRIVER === 'local') {
    const uploadsPath = resolve(process.env.STORAGE_LOCAL_PATH ?? './storage/uploads');
    app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });
    new Logger('Bootstrap').log(`📁 serving local uploads from ${uploadsPath} at /uploads`);
  }

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MyBlog API')
      .setDescription('REST + WebSocket contract — auto-gen from NestJS Swagger')
      .setVersion('0.2.0-alpha')
      .addCookieAuth('access_token')
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, doc);
  }

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  new Logger('Bootstrap').log(`🚀 api listening on :${port}`);
}

bootstrap();
