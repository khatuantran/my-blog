import { env } from '@/lib/env';

/**
 * Base HTTP client. Wrap `fetch` với base URL + credentials cookie.
 *
 * Dev: Vite proxy `/api` → BE :3001 → có thể gọi relative `'/api/...'`
 * Prod: VITE_API_URL fully qualified → gọi absolute
 *
 * Typed wrappers per-endpoint sẽ gen từ `openapi-typescript` khi BE có routes (M3+).
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = env.VITE_API_URL.replace(/\/$/, '');
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;

  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? res.statusText,
      err?.details,
    );
  }

  // BE wraps `{ data, meta }` qua TransformInterceptor
  return (body as { data?: T })?.data ?? (body as T);
}
