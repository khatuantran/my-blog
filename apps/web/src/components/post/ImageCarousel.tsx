import { useState, useEffect, useRef } from 'react';
import { ImgSlot } from './ImgSlot';
import type { ImageItem } from './ImageGrid';

type Props = {
  images: ImageItem[];
  onImageClick?: (idx: number) => void;
};

const NAV_BTN =
  'absolute top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-b2 font-mono text-tp transition-colors hover:border-cyan hover:text-cyan';

export function ImageCarousel({ images, onImageClick }: Props) {
  const [idx, setIdx] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const count = images?.length ?? 0;

  useEffect(() => {
    setIdx(0);
    setBroken({});
  }, [images]);

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
      ) : onImageClick ? (
        <button
          type="button"
          data-testid="image-carousel-open-lightbox"
          aria-label={`Open image ${idx + 1} in lightbox`}
          onClick={() => onImageClick(idx)}
          className="block h-full w-full cursor-zoom-in"
        >
          <img
            src={current.url}
            alt=""
            className="h-full w-full object-contain"
            onError={() => setBroken((s) => ({ ...s, [idx]: true }))}
          />
        </button>
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
          {/* Prev arrow — 44px round, frosted glass */}
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + count) % count)}
            aria-label="Previous image"
            className={`${NAV_BTN} left-3`}
            style={{ background: 'rgba(10,14,26,.75)', backdropFilter: 'blur(4px)' }}
          >
            ←
          </button>

          {/* Next arrow — 44px round, frosted glass */}
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % count)}
            aria-label="Next image"
            className={`${NAV_BTN} right-3`}
            style={{ background: 'rgba(10,14,26,.75)', backdropFilter: 'blur(4px)' }}
          >
            →
          </button>

          {/* Pagination dots — centered bottom */}
          <div
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5"
            role="tablist"
            aria-label="Image selector"
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === idx}
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all ${
                  i === idx ? 'h-1.5 w-[18px] bg-cyan' : 'h-1.5 w-1.5 bg-b2 hover:bg-b3'
                }`}
                style={i === idx ? { boxShadow: '0 0 6px var(--cyan)' } : undefined}
              />
            ))}
          </div>

          {/* Counter — bottom-right */}
          <div className="absolute bottom-3 right-3 font-mono text-[11px] text-td">
            {idx + 1}/{count}
          </div>
        </>
      )}
    </div>
  );
}
