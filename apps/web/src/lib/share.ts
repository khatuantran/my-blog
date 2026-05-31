// Social share helpers (FR-05.1). KHÔNG cần API key/SDK/OAuth — chỉ dùng
// "share intent URL" công khai của từng nền tảng (nhận url + text qua query param,
// mở dialog share; user vốn đã đăng nhập sẵn trong browser).

export const SHARE_PLATFORMS = ['facebook', 'x', 'telegram'] as const;
export type SharePlatform = (typeof SHARE_PLATFORMS)[number];

type ShareInput = {
  /** Absolute URL của bài viết (vd: https://kha.blog/post/abc). */
  url: string;
  /** Text kèm theo (excerpt) — Facebook bỏ qua, X/Telegram dùng. */
  text?: string;
};

/**
 * Build intent URL cho từng nền tảng.
 * - Facebook: chỉ nhận `u` (URL); text/quote bị Facebook bỏ qua theo policy.
 * - X (Twitter): `twitter.com/intent/tweet` vẫn hoạt động, tự redirect sang x.com.
 * - Telegram: `t.me/share/url`.
 */
export function buildShareUrl(platform: SharePlatform, { url, text = '' }: ShareInput): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case 'x':
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case 'telegram':
      return `https://t.me/share/url?url=${u}&text=${t}`;
  }
}

/** Mở dialog share trong popup window (no-op nếu không có `window`). */
export function openShare(platform: SharePlatform, input: ShareInput): void {
  if (typeof window === 'undefined') return;
  window.open(buildShareUrl(platform, input), '_blank', 'noopener,noreferrer,width=600,height=520');
}
