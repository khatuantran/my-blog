import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImgSlot } from '@/components/post/ImgSlot';
import type { ImageItem } from '@/components/post/ImageGrid';

type Props = {
  images: ImageItem[];
  startIdx: number;
  postPath?: string;
  onClose: () => void;
};

// ImageLightbox — full-screen image viewer portal.
// Spec: docs/DESIGN_SYSTEM.md > ImageLightbox (M11.9 Gap 1).
export function ImageLightbox({ images, startIdx, postPath, onClose }: Props) {
  const [idx, setIdx] = useState(Math.max(0, Math.min(startIdx, images.length - 1)));
  const total = images.length;
  const current = images[idx];
  const hasMultiple = total > 1;

  // Body scroll lock
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultiple) {
        setIdx((i) => (i - 1 + total) % total);
      } else if (e.key === 'ArrowRight' && hasMultiple) {
        setIdx((i) => (i + 1) % total);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, hasMultiple, total]);

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      data-testid="image-lightbox"
      className="fixed inset-0 z-[500] flex flex-col bg-bg/[0.92] animate-fade-up-xs"
      onClick={onClose}
    >
      {/* Header */}
      <header
        className="flex shrink-0 items-center gap-3 border-b border-b1 bg-bg/40 px-5 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-mono text-mono-sm text-blu">{postPath ?? '~/post'}</span>
        <span className="font-mono text-mono-sm text-td">·</span>
        <span className="font-mono text-mono-sm text-tm" data-testid="image-lightbox-counter">
          {idx + 1}/{total}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image viewer"
          data-testid="image-lightbox-close"
          className="ml-auto rounded-md border-none bg-transparent px-2 py-1 font-mono text-mono-lg text-tm transition-colors hover:text-tp"
        >
          ×
        </button>
      </header>

      {/* Image area — click vùng đen quanh ảnh (chính container) → đóng; click ảnh/nút thì không.
          stopPropagation để click con không bubble lên root (tránh double-close). */}
      <div
        className="relative flex flex-1 items-center justify-center p-5"
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {current?.url ? (
          <img
            src={current.url}
            alt=""
            className="max-h-[70vh] max-w-[960px] object-contain"
            data-testid="image-lightbox-img"
          />
        ) : (
          <div className="h-[70vh] max-h-[600px] w-full max-w-[960px]">
            <ImgSlot idx={idx} />
          </div>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => setIdx((i) => (i - 1 + total) % total)}
              aria-label="Previous image"
              data-testid="image-lightbox-prev"
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-b2 bg-surf/85 font-mono text-mono-lg text-tp backdrop-blur-md transition-colors hover:bg-surf"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % total)}
              aria-label="Next image"
              data-testid="image-lightbox-next"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-b2 bg-surf/85 font-mono text-mono-lg text-tp backdrop-blur-md transition-colors hover:bg-surf"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div
          className="flex shrink-0 items-center justify-center gap-1.5 overflow-x-auto border-t border-b1 bg-bg/40 px-5 py-3"
          onClick={(e) => e.stopPropagation()}
          data-testid="image-lightbox-thumbs"
        >
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`View image ${i + 1}`}
              data-testid={`image-lightbox-thumb-${i}`}
              className={`h-10 w-14 shrink-0 overflow-hidden rounded-sm border-2 transition-all ${
                i === idx
                  ? 'border-cyan opacity-100 shadow-glow-cyan-sm'
                  : 'border-b2 opacity-55 hover:opacity-80'
              }`}
            >
              {img.url ? (
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-elev" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Footer hint */}
      <div
        className="shrink-0 border-t border-b1 bg-bg/40 px-5 py-2 text-center font-mono text-mono-sm text-td"
        onClick={(e) => e.stopPropagation()}
      >
        ← → navigate · Esc close · // click outside to close
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
