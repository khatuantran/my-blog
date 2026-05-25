import { useState, useEffect, useRef } from 'react';
import { ImgSlot } from './ImgSlot';
import type { ImageItem } from './ImageGrid';

type Props = {
  images: ImageItem[];
};

// Full carousel — prev/next buttons + dot indicator + counter + keyboard nav.
// Match design-file/MyBlog Post Detail.html ImageCarousel section.
export function ImageCarousel({ images }: Props) {
  const [idx, setIdx] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const count = images?.length ?? 0;

  // Reset khi images thay đổi (e.g. nav to different post)
  useEffect(() => {
    setIdx(0);
    setBroken({});
  }, [images]);

  // Keyboard nav khi container focused
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIdx((i) => (i - 1 + count) % count);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIdx((i) => (i + 1) % count);
      }
    }
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [count]);

  if (count === 0) return null;

  const current = images[idx];
  const isBroken = !current?.url || broken[idx];

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={`Image ${idx + 1} of ${count}`}
      aria-roledescription="carousel"
      className="relative mb-4 h-[280px] overflow-hidden rounded-md border border-b2 bg-bg outline-none focus-visible:border-cyan"
    >
      {isBroken ? (
        <ImgSlot idx={idx} />
      ) : (
        <img
          src={current.url}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setBroken((s) => ({ ...s, [idx]: true }))}
        />
      )}

      {count > 1 && (
        <>
          {/* Prev */}
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + count) % count)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-b2 bg-bg/80 px-3 py-1 font-mono text-tp hover:border-cyan hover:bg-bg"
          >
            ←
          </button>
          {/* Next */}
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % count)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-b2 bg-bg/80 px-3 py-1 font-mono text-tp hover:border-cyan hover:bg-bg"
          >
            →
          </button>

          {/* Counter + dots */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-b2 bg-bg/80 px-3 py-1 font-mono text-mono-sm text-tm">
            <div className="flex gap-1.5" role="tablist" aria-label="Image selector">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`Go to image ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === idx ? 'bg-cyan' : 'bg-b2 hover:bg-b3'
                  }`}
                />
              ))}
            </div>
            <span>
              {idx + 1}/{count}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
