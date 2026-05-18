import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageGrid, type ImageItem } from '@/components/post/ImageGrid';

function makeImages(n: number, urlPrefix = 'https://cdn/img'): ImageItem[] {
  return Array.from({ length: n }).map((_, i) => ({
    id: `img-${i}`,
    url: `${urlPrefix}-${i}.jpg`,
  }));
}

describe('ImageGrid', () => {
  it('returns null khi không có images', () => {
    const { container } = render(<ImageGrid images={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('1 image: render single 200px cell', () => {
    const { container } = render(<ImageGrid images={makeImages(1)} />);
    expect(container.querySelectorAll('img').length).toBe(1);
  });

  it('2 images: render 2-col grid', () => {
    const { container } = render(<ImageGrid images={makeImages(2)} />);
    expect(container.querySelectorAll('img').length).toBe(2);
  });

  it('3 images: render 1 main + 2 stacked, không overlay', () => {
    const { container } = render(<ImageGrid images={makeImages(3)} />);
    expect(container.querySelectorAll('img').length).toBe(3);
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it('5 images: render 4 cells + "+1" overlay trên cell cuối', () => {
    const { container } = render(<ImageGrid images={makeImages(5)} />);
    expect(container.querySelectorAll('img').length).toBe(4);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('image.url thiếu → fallback ImgSlot placeholder', () => {
    const { container } = render(<ImageGrid images={[{ id: 'a' }]} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: /photo.01/i })).toBeInTheDocument();
  });

  it('onError → swap sang ImgSlot fallback', () => {
    const { container } = render(<ImageGrid images={makeImages(1)} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: /photo.01/i })).toBeInTheDocument();
  });
});
