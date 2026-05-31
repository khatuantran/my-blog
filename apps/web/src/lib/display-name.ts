// Hiển thị tên tác giả (FR-11.8): ưu tiên full name; fallback handle `${prefix}${username}`
// (giữ style terminal cho user chưa đặt name). Dùng ở PostHeader (~/), CommentItem/ReplyRow (@).
export function authorLabel(
  author: { name?: string | null; username: string },
  handlePrefix = '~/',
): string {
  const n = author.name?.trim();
  return n ? n : `${handlePrefix}${author.username}`;
}
