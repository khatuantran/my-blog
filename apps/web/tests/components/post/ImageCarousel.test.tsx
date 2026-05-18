import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageCarousel } from '@/components/post/ImageCarousel';
import type { ImageItem } from '@/components/post/ImageGrid';

function makeImages(n: number): ImageItem[] {
  return Array.from({ length: n }).map((_, i) => ({
    id: `img-${i}`,
    url: `https://cdn/img-${i}.jpg`,
  }));
}

describe('ImageCarousel', () => {
  it('returns null khi không có images', () => {
    const { container } = render(<ImageCarousel images={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('1 image: render KHÔNG có nav buttons + dots', () => {
    render(<ImageCarousel images={makeImages(1)} />);
    expect(screen.queryByRole('button', { name: /previous image/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /next image/i })).toBeNull();
  });

  it('4 images: render counter "1/4" + 4 dots + prev/next', () => {
    render(<ImageCarousel images={makeImages(4)} />);
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous image/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next image/i })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').length).toBe(4);
  });

  it('click Next → counter advance + dot select shift', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={makeImages(3)} />);
    expect(screen.getByText('1/3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next image/i }));
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /go to image 2/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('click Prev tại idx 0 → wrap về last', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={makeImages(3)} />);
    await user.click(screen.getByRole('button', { name: /previous image/i }));
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('keyboard ArrowRight advance khi container focused', () => {
    const { container } = render(<ImageCarousel images={makeImages(3)} />);
    const region = container.querySelector('[role="region"]') as HTMLElement;
    region.focus();
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('click dot trực tiếp jump tới index đó', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={makeImages(4)} />);
    await user.click(screen.getByRole('tab', { name: /go to image 3/i }));
    expect(screen.getByText('3/4')).toBeInTheDocument();
  });

  it('onError fallback sang ImgSlot', () => {
    const { container } = render(<ImageCarousel images={makeImages(1)} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: /photo.01/i })).toBeInTheDocument();
  });
});
