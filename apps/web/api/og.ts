// Vercel Edge Function — trả Open Graph meta tags per-post cho social crawler (FR-05.3).
// KHÔNG cần API key — OG chỉ là thẻ <meta>. Crawler (facebookexternalhit / Twitterbot /
// Telegrambot...) không chạy JS nên SPA không set được meta cho chúng → function này
// fetch dữ liệu post từ BE rồi render HTML tĩnh có OG tags. Người dùng thật (browser)
// KHÔNG vào đây — vercel.json chỉ rewrite /post/:id sang đây khi User-Agent là bot.
//
// Env (Vercel): OG_API_URL = base URL của BE (vd https://myblog-api.fly.dev).

export const config = { runtime: 'edge' };

// Type-only (web project không có @types/node); Vercel Edge cung cấp process.env runtime.
declare const process: { env: Record<string, string | undefined> };

const SITE_NAME = 'kha.blog';
const DEFAULT_API_URL = 'https://myblog-api.fly.dev';

type PostLike = {
  id?: string;
  content?: string;
  author?: { name?: string | null; username?: string } | null;
  images?: { url?: string }[];
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(input: string): string {
  return input
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function page(meta: {
  title: string;
  description: string;
  url: string;
  image?: string;
  id?: string;
}): string {
  const { title, description, url, image, id } = meta;
  const card = image ? 'summary_large_image' : 'summary';
  const imageTags = image
    ? `<meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />`
    : '';
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    ${imageTags}
    <meta name="twitter:card" content="${card}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
  </head>
  <body>
    <p>${escapeHtml(title)}</p>
    ${id ? `<script>location.href = '/post/' + ${JSON.stringify(id)};</script>` : ''}
    <noscript><a href="${escapeHtml(url)}">Mở bài viết</a></noscript>
  </body>
</html>`;
}

export default async function handler(req: Request): Promise<Response> {
  const reqUrl = new URL(req.url);
  const id = reqUrl.searchParams.get('id') ?? '';
  const origin = reqUrl.origin;
  const postUrl = id ? `${origin}/post/${id}` : origin;
  const apiBase = (process.env.OG_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');

  const headers = {
    'content-type': 'text/html; charset=utf-8',
    // Cache ở CDN: crawler refetch lại sẽ thấy bản mới sau 5 phút.
    'cache-control': 'public, max-age=300, s-maxage=300',
  };

  const fallback = page({
    title: SITE_NAME,
    description: 'Blog cá nhân — code, cuộc sống và những thứ linh tinh.',
    url: postUrl,
    id: id || undefined,
  });

  if (!id) return new Response(fallback, { headers });

  try {
    const res = await fetch(`${apiBase}/posts/${encodeURIComponent(id)}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return new Response(fallback, { headers });

    const post = (await res.json()) as PostLike;
    const text = stripHtml(post.content ?? '');
    const author = post.author?.name || post.author?.username || 'kha';
    const description = text.slice(0, 200) || 'Bài viết trên kha.blog';
    const title = text
      ? `${text.slice(0, 70)} · ${SITE_NAME}`
      : `Bài viết của ${author} · ${SITE_NAME}`;
    const image = post.images?.[0]?.url; // absolute https ở prod (Cloudinary); local thì bỏ qua

    return new Response(page({ title, description, url: postUrl, image, id }), { headers });
  } catch {
    return new Response(fallback, { headers });
  }
}
