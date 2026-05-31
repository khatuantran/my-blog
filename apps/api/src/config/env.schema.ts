import { z } from 'zod';

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  // FR-18: số hop proxy tin tưởng để lấy client IP thật từ X-Forwarded-For.
  // Default 1 (Fly.io 1 reverse proxy). Đặt cao hơn nếu thêm CDN/proxy chain.
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  DATABASE_URL_TEST: z.string().url().optional(),

  // JWT
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  // Storage driver (ADR-010): cloudinary (prod) | local (dev volume)
  STORAGE_DRIVER: z.enum(['cloudinary', 'local']).default('cloudinary'),
  STORAGE_LOCAL_PATH: z.string().default('./storage/uploads'),
  STORAGE_PUBLIC_URL: z.string().default('http://localhost:3001'),

  // Cloudinary (chỉ required khi STORAGE_DRIVER=cloudinary)
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  CLOUDINARY_UPLOAD_PRESET: z.string().default('myblog_uploads'),

  // Admin seed
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(8),

  // CORS — comma-separated origins
  CORS_ORIGIN: z.string().min(1),

  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`❌ Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
