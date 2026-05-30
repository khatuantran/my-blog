import { env } from '@/lib/env';

/**
 * Base HTTP client. Wrap `fetch` với base URL + credentials cookie.
 *
 * Dev: Vite proxy `/api` → BE :3001 → có thể gọi relative `'/api/...'`
 * Prod: VITE_API_URL fully qualified → gọi absolute
 *
 * 401 strategy: nếu access cookie expired → tự động POST /auth/refresh + retry
 * request gốc 1 lần. Concurrent 401s share cùng 1 refresh in-flight qua mutex.
 * Refresh fail → throw + emit `auth:logout` event để store reset.
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

// Caller có thể opt-out refresh attempt (auth endpoints chính nó tránh loop).
export type ApiFetchInit = RequestInit & { skipRefresh?: boolean };

// Paths không trigger refresh (response 401 = expected, không nên retry).
const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/login', '/auth/register'];

// Mutex: 1 refresh in-flight tối đa.
let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(baseUrl: string): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      // Allow next refresh sau khi current resolve
      queueMicrotask(() => {
        refreshPromise = null;
      });
    }
  })();
  return refreshPromise;
}

function shouldAttemptRefresh(path: string, skip: boolean | undefined): boolean {
  if (skip) return false;
  return !NO_REFRESH_PATHS.some((p) => path.startsWith(p));
}

function emitLogoutEvent() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
}

async function doFetch(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: unknown; details?: unknown } })
      ?.error;
    // BE class-validator BadRequest trả `message: string[]` (e.g. `["color must be a hexadecimal color"]`).
    // Coerce → joined string ở source để ApiError.message luôn hiển thị được trong UI/log.
    const rawMsg = err?.message ?? res.statusText;
    const message = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg);
    throw new ApiError(res.status, err?.code ?? 'UNKNOWN', message, err?.details);
  }
  return (body as { data?: T })?.data ?? (body as T);
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const baseUrl = env.VITE_API_URL.replace(/\/$/, '');
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const { skipRefresh, ...fetchInit } = init;

  let res = await doFetch(url, fetchInit);

  if (res.status === 401 && shouldAttemptRefresh(path, skipRefresh)) {
    const refreshed = await performRefresh(baseUrl);
    if (refreshed) {
      // Skip retry nếu caller signal đã aborted (component unmounted / query cancelled).
      const aborted = fetchInit.signal?.aborted ?? false;
      if (!aborted) {
        res = await doFetch(url, fetchInit);
      }
    } else {
      emitLogoutEvent();
    }
  }

  return parseResponse<T>(res);
}
