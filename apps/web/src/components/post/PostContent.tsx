import { parsePostContent } from '@/lib/markdown';

type Variant = 'card' | 'detail';

type Props = {
  content: string;
  variant?: Variant;
};

const VARIANT_TEXT: Record<Variant, string> = {
  card: 'text-body',
  detail: 'text-body leading-[1.75]',
};

// T-368: detect rich-text HTML output (RichTextEditor) vs legacy markdown.
// Heuristic — content starts with an HTML tag means new HTML format.
function isHtmlContent(content: string): boolean {
  return /^\s*<[a-z]/i.test(content);
}

export function PostContent({ content, variant = 'card' }: Props) {
  if (isHtmlContent(content)) {
    // Admin-only content creation in current version — trust HTML directly.
    // When public posting opens, swap in a sanitizer (DOMPurify) here.
    return (
      <div
        className={`text-tp ${VARIANT_TEXT[variant]}`}
        style={{ color: '#C9D1D9' }}
        data-testid="post-content-html"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  const segs = parsePostContent(content);
  return (
    <div className={`text-tp ${VARIANT_TEXT[variant]}`} style={{ color: '#C9D1D9' }}>
      {segs.map((s, i) =>
        s.type === 'code' ? (
          <pre
            key={i}
            className="my-3 overflow-x-auto whitespace-pre rounded-md border border-b2 bg-[#070A14] px-3.5 py-3 font-mono text-mono-md leading-[1.6] text-grn"
            style={{ borderLeft: '2px solid rgba(158,206,106,.4)' }}
          >
            {s.value.trim()}
          </pre>
        ) : (
          s.value.split('\n\n').map((p, j) =>
            p.trim() ? (
              <p key={`${i}-${j}`} className="mb-2">
                {p.trim()}
              </p>
            ) : null,
          )
        ),
      )}
    </div>
  );
}
