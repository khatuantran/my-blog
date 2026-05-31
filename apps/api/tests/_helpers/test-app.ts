import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import cookieParser from 'cookie-parser';
import { AppModule } from '@/app.module';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { StorageService } from '@/files/storage.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  cloudinaryMock: {
    signUpload: jest.Mock;
    destroyMany: jest.Mock;
  };
}

export async function createTestApp(): Promise<TestContext> {
  // Override StorageService (facade mà files/posts/users dùng) = mock cloudinary → e2e xác định,
  // KHÔNG phụ thuộc STORAGE_DRIVER (tránh local rò từ apps/api/.env dev qua dotenv). Tên giữ
  // `cloudinaryMock` cho tương thích assertion hiện có.
  const cloudinaryMock = {
    provider: 'cloudinary',
    signUpload: jest.fn().mockReturnValue({
      provider: 'cloudinary',
      signature: 'stub-signature',
      timestamp: 1715952000,
      apiKey: 'test-key',
      cloudName: 'test-cloud',
      folder: 'myblog',
      resourceType: 'image',
      publicId: null,
    }),
    destroyMany: jest.fn().mockResolvedValue(undefined),
    saveUpload: jest.fn().mockResolvedValue({
      url: 'http://localhost:3001/uploads/myblog/x.png',
      publicId: 'myblog/x.png',
      size: 1,
      name: 'x.png',
      type: 'image/png',
    }),
  };

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(StorageService)
    .useValue(cloudinaryMock)
    .compile();
  const app = moduleRef.createNestApplication();

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma, cloudinaryMock };
}
