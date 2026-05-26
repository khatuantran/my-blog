import { useState } from 'react';
import { ImgSlot } from './ImgSlot';

export type ImageItem = {
  id?: string;
  url?: string;
  width?: number;
  height?: number;
};

type Props = {
  images: ImageItem[];
  onImageClick?: (idx: number) => void;
};

// Single cell: <img> với onError fallback sang <ImgSlot>.
function ImageCell({
  image,
  idx,
  onClick,
}: {
  image: ImageItem;
  idx: number;
  onClick?: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const inner =
    !image.url || broken ? (
      <ImgSlot idx={idx} />
    ) : (
      <img
        src={image.url}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
        className="h-full w-full object-cover"
      />
    );

  if (!onClick) return inner;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open image ${idx + 1}`}
      data-testid={`image-grid-cell-${idx}`}
      className="block h-full w-full border-none bg-transparent p-0 cursor-pointer"
    >
      {inner}
    </button>
  );
}

// Responsive grid layout 1/2/3+ images. Port từ design-file/myblog-components.jsx:161-188.
// 1: single 200px. 2: 2-col 160px. 3+: 2-col left-big + right stacked, last cell `+N` overlay.
export function ImageGrid({ images, onImageClick }: Props) {
  if (!images || images.length === 0) return null;
  const count = images.length;
  const handle = (idx: number) => (onImageClick ? () => onImageClick(idx) : undefined);

  if (count === 1) {
    return (
      <div className="mb-3 h-[200px] overflow-hidden rounded-sm">
        <ImageCell image={images[0]} idx={0} onClick={handle(0)} />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="mb-3 grid h-[160px] grid-cols-2 gap-[3px] overflow-hidden rounded-md">
        {images.slice(0, 2).map((img, i) => (
          <div key={img.id ?? i} className="overflow-hidden rounded-sm">
            <ImageCell image={img} idx={i} onClick={handle(i)} />
          </div>
        ))}
      </div>
    );
  }

  // 3+: max 4 visible, last shows +N overlay
  const shown = Math.min(count, 4);
  const main = images[0];
  const rest = images.slice(1, shown);
  return (
    <div className="mb-3 grid h-[180px] grid-cols-2 gap-[3px] overflow-hidden rounded-md">
      <div className="overflow-hidden rounded-sm">
        <ImageCell image={main} idx={0} onClick={handle(0)} />
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateRows: `repeat(${rest.length}, 1fr)` }}>
        {rest.map((img, i) => (
          <div key={img.id ?? i + 1} className="relative overflow-hidden rounded-sm">
            <ImageCell image={img} idx={i + 1} onClick={handle(i + 1)} />
            {count > 4 && i === rest.length - 1 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-bg/[0.78]">
                <span className="font-mono text-lg font-bold text-tp">+{count - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
