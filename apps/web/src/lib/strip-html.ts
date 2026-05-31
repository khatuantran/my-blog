// Chuyển HTML (rich-text post từ TipTap) → plain text excerpt cho card/preview ngắn.
// Dùng khi render content dạng text (KHÔNG dangerouslySetInnerHTML) — vd PostMiniCard.
// Markdown legacy (không có tag) đi qua an toàn (chỉ collapse whitespace).
export function stripHtml(input: string): string {
  return input
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ') // bỏ trọn script/style
    .replace(/<[^>]+>/g, ' ') // tag → space
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
