import { describe, expect, it, vi } from 'vitest';
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

describe('ImageCarousel (T-377)', () => {
  it('returns null khi không có images', () => {
    const { container } = render(<ImageCarousel images={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('T-377: 1 image — no nav arrows, no dots, no counter', () => {
    render(<ImageCarousel images={makeImages(1)} />);
    expect(screen.queryByRole('button', { name: /previous image/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /next image/i })).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByText('1/1')).toBeNull();
  });

  it('T-377: multi-image — prev/next arrows render + counter shows N/total', () => {
    render(<ImageCarousel images={makeImages(4)} />);
    expect(screen.getByRole('button', { name: /previous image/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next image/i })).toBeInTheDocument();
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').length).toBe(4);
  });

  it('T-377: active dot has w-[18px] pill shape, inactive dots have w-1.5', () => {
    const { container } = render(<ImageCarousel images={makeImages(3)} />);
    const activeDot = container.querySelector('[role="tab"][aria-selected="true"]');
    expect(activeDot).not.toBeNull();
    expect(activeDot!.className).toContain('w-[18px]');
    const inactiveDots = container.querySelectorAll('[role="tab"][aria-selected="false"]');
    inactiveDots.forEach((dot) => {
      expect(dot.className).toContain('w-1.5');
    });
  });

  it('T-377: click dot jump → correct index + active dot shifts', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={makeImages(4)} />);
    await user.click(screen.getByRole('tab', { name: /go to image 3/i }));
    expect(screen.getByText('3/4')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /go to image 3/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('T-377: keyboard ArrowRight advances, ArrowLeft wraps from 0 to last', () => {
    const { container } = render(<ImageCarousel images={makeImages(3)} />);
    const region = container.querySelector('[role="region"]') as HTMLElement;
    region.focus();
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(screen.getByText('2/3')).toBeInTheDocument();
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('click Next → counter advance + active dot shifts', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={makeImages(3)} />);
    await user.click(screen.getByRole('button', { name: /next image/i }));
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /go to image 2/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('click Prev at idx 0 → wraps to last', async () => {
    const user = userEvent.setup();
    render(<ImageCarousel images={makeImages(3)} />);
    await user.click(screen.getByRole('button', { name: /previous image/i }));
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('onError fallback → ImgSlot placeholder renders', () => {
    const { container } = render(<ImageCarousel images={makeImages(1)} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: /photo.01/i })).toBeInTheDocument();
  });

  it('T-331: onImageClick callback fires với current idx khi click image', async () => {
    const user = userEvent.setup();
    const onImageClick = vi.fn();
    render(<ImageCarousel images={makeImages(3)} onImageClick={onImageClick} />);
    // idx 0 → click
    const opener = screen.getByTestId('image-carousel-open-lightbox');
    await user.click(opener);
    expect(onImageClick).toHaveBeenCalledTimes(1);
    expect(onImageClick).toHaveBeenLastCalledWith(0);
    // advance to idx 1 → click again
    await user.click(screen.getByRole('button', { name: /next image/i }));
    await user.click(screen.getByTestId('image-carousel-open-lightbox'));
    expect(onImageClick).toHaveBeenLastCalledWith(1);
  });

  it('T-331: KHÔNG render image button khi onImageClick không cung cấp', () => {
    render(<ImageCarousel images={makeImages(2)} />);
    expect(screen.queryByTestId('image-carousel-open-lightbox')).toBeNull();
  });
});
