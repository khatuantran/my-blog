import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_WS_URL: z.string().min(1),
  VITE_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
});

export type ViteEnv = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`❌ Invalid VITE_* environment variables:\n${issues}`);
  throw new Error('Invalid VITE_* environment variables. Xem console.');
}

export const env: ViteEnv = parsed.data;
