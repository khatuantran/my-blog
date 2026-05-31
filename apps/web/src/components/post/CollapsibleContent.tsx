import { useEffect, useRef, useState } from 'react';
import { PostContent } from './PostContent';

type Variant = 'card' | 'detail';

type Props = {
  content: string;
  variant?: Variant;
  /** Ngưỡng chiều cao (px) trước khi clamp + hiện show more. */
  maxHeight?: number;
  className?: string;
};

// CollapsibleContent (T-440) — bọc PostContent, clamp khi content cao quá maxHeight + nút
// show more/collapse. Dùng chung Feed PostCard + Create Post live preview.
// Cắt ĐÚNG ranh giới dòng cuối còn trọn trong ngưỡng (đo từng line box qua
// Range.getClientRects()) → không lú nửa dòng, xử lý đúng multi-paragraph + margin + heading.
export function CollapsibleContent({
  content,
  variant = 'card',
  maxHeight = 360,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [collapsedH, setCollapsedH] = useState(maxHeight);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setOverflowing(false);
      return;
    }
    // Overflow = nội dung CAO HƠN ngưỡng maxHeight (scrollHeight gồm cả margin cuối). Chỉ khi
    // đó mới hiện nút + clamp — tránh false-positive với bài ngắn (collapsedH theo line-box
    // không gồm margin nên so collapsedH sẽ sai). +1 cho rounding.
    const over = el.scrollHeight > maxHeight + 1;
    setOverflowing(over);
    if (!over) {
      setCollapsedH(maxHeight);
      return;
    }
    // Khi overflow: cắt ĐÚNG ranh giới dòng cuối còn ≤ maxHeight (đo line box qua getClientRects).
    const top = el.getBoundingClientRect().top;
    const limit = top + maxHeight;
    const range = document.createRange();
    range.selectNodeContents(el);
    let cut = 0;
    for (const r of Array.from(range.getClientRects())) {
      if (r.height <= 0) continue;
      if (r.bottom <= limit) cut = r.bottom - top;
      else break;
    }
    setCollapsedH(cut > 0 ? cut : maxHeight);
  }, [content, maxHeight]);

  // Content ngắn lại (không còn overflow) → reset về collapsed.
  useEffect(() => {
    if (!overflowing) setExpanded(false);
  }, [overflowing]);

  return (
    <div className={className}>
      <div
        ref={ref}
        className="overflow-hidden"
        style={overflowing && !expanded ? { maxHeight: collapsedH } : undefined}
        data-testid="collapsible-content"
      >
        <PostContent content={content} variant={variant} />
      </div>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          data-testid="collapsible-toggle"
          aria-expanded={expanded}
          className="mt-1 font-mono text-mono-sm text-cyan transition-colors hover:text-tp"
        >
          {expanded ? '▴ collapse' : '▾ show more'}
        </button>
      )}
    </div>
  );
}
