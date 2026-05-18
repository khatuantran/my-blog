// Minimal stub — T-067 sẽ implement đầy đủ với prev/next + dots + keyboard.
// Hiện tại fall back về ImageGrid cho layout cơ bản.

import { ImageGrid } from './ImageGrid';
import type { ImageItem } from './ImageGrid';

type Props = {
  images: ImageItem[];
};

export function ImageCarousel({ images }: Props) {
  if (!images || images.length === 0) return null;
  return <ImageGrid images={images} />;
}
