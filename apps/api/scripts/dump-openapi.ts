import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as yaml from 'js-yaml';
import { AppModule } from '../src/app.module';

async function dump() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('MyBlog API')
    .setDescription('REST + WebSocket contract — auto-generated from NestJS Swagger')
    .setVersion('0.2.0-alpha')
    .addCookieAuth('access_token')
    .addServer('http://localhost:3001', 'Local dev')
    .addServer('https://kha-blog-api.fly.dev', 'Production')
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  const outPath = resolve(__dirname, '../../../docs/contracts/openapi.yaml');
  const banner =
    '# Auto-generated từ NestJS Swagger. KHÔNG edit thủ công.\n# Regen: pnpm openapi:sync\n';
  writeFileSync(outPath, banner + yaml.dump(doc, { noRefs: true, lineWidth: 120 }));

  await app.close();
  console.log(`✓ openapi.yaml written → ${outPath}`);
}

dump().catch((err) => {
  console.error(err);
  process.exit(1);
});
