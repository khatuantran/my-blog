// Lightweight markdown segmentation cho PostContent.
// Chỉ hỗ trợ ```fenced code blocks``` + paragraph split.
// Port từ design-file/MyBlog Feed.html:161-184.

export type Segment = { type: 'text'; value: string } | { type: 'code'; value: string };

export function parsePostContent(content: string): Segment[] {
  const segs: Segment[] = [];
  let rest = content;
  while (rest.length) {
    const open = rest.indexOf('```');
    if (open === -1) {
      segs.push({ type: 'text', value: rest });
      break;
    }
    if (open > 0) {
      segs.push({ type: 'text', value: rest.slice(0, open) });
    }
    const close = rest.indexOf('```', open + 3);
    const codeRaw = rest.slice(open + 3, close < 0 ? undefined : close);
    // Strip optional language hint `js\n` ở đầu code block
    const code = codeRaw.replace(/^[a-zA-Z]+\n/, '');
    segs.push({ type: 'code', value: code });
    rest = close < 0 ? '' : rest.slice(close + 3);
  }
  return segs;
}
