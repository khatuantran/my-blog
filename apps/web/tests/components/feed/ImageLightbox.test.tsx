import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageLightbox } from '@/components/feed/ImageLightbox';
import { TestProviders } from '../../_helpers/test-providers';
import type { ImageItem } from '@/components/post/ImageGrid';

const sampleImages: ImageItem[] = [
  { id: 'i1', url: 'https://e/x1.jpg', width: 100, height: 100 },
  { id: 'i2', url: 'https://e/x2.jpg', width: 100, height: 100 },
  { id: 'i3', url: 'https://e/x3.jpg', width: 100, height: 100 },
];

describe('ImageLightbox (T-355)', () => {
  it('1. open render image + header info + close button + counter 1/N', () => {
    render(
      <TestProviders>
        <ImageLightbox
          images={sampleImages}
          startIdx={0}
          postPath="~/post/abc123"
          onClose={() => {}}
        />
      </TestProviders>,
    );
    expect(screen.getByTestId('image-lightbox')).toBeInTheDocument();
    expect(screen.getByText('~/post/abc123')).toBeInTheDocument();
    expect(screen.getByTestId('image-lightbox-counter')).toHaveTextContent('1/3');
    expect(screen.getByTestId('image-lightbox-close')).toBeInTheDocument();
    expect(screen.getByTestId('image-lightbox-img')).toHaveAttribute('src', 'https://e/x1.jpg');
  });

  it('regression BUG-031: click vùng đen (image area) → onClose; click ảnh → KHÔNG đóng', () => {
    const onClose = vi.fn();
    render(
      <TestProviders>
        <ImageLightbox images={sampleImages} startIdx={0} onClose={onClose} />
      </TestProviders>,
    );
    const img = screen.getByTestId('image-lightbox-img');
    const area = img.parentElement as HTMLElement;
    fireEvent.click(img); // click ảnh → giữ nguyên
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(area); // click vùng đen quanh ảnh → đóng
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('2. keyboard ← → → nav between images', async () => {
    render(
      <TestProviders>
        <ImageLightbox images={sampleImages} startIdx={0} onClose={() => {}} />
      </TestProviders>,
    );
    expect(screen.getByTestId('image-lightbox-counter')).toHaveTextContent('1/3');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('image-lightbox-counter')).toHaveTextContent('2/3');
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('image-lightbox-counter')).toHaveTextContent('3/3');
    // Wrap-around: → from last goes to first
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('image-lightbox-counter')).toHaveTextContent('1/3');
    // ← from first wraps to last
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('image-lightbox-counter')).toHaveTextContent('3/3');
  });

  it('3. Esc key → onClose called', () => {
    let closed = false;
    render(
      <TestProviders>
        <ImageLightbox images={sampleImages} startIdx={0} onClose={() => (closed = true)} />
      </TestProviders>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(true);
  });

  it('4. multi-image: thumbnail strip render + click thumb → jump to that image', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <ImageLightbox images={sampleImages} startIdx={0} onClose={() => {}} />
      </TestProviders>,
    );
    expect(screen.getByTestId('image-lightbox-thumbs')).toBeInTheDocument();
    expect(screen.getByTestId('image-lightbox-thumb-0')).toBeInTheDocument();
    expect(screen.getByTestId('image-lightbox-thumb-1')).toBeInTheDocument();
    expect(screen.getByTestId('image-lightbox-thumb-2')).toBeInTheDocument();
    await user.click(screen.getByTestId('image-lightbox-thumb-2'));
    expect(screen.getByTestId('image-lightbox-counter')).toHaveTextContent('3/3');
    expect(screen.getByTestId('image-lightbox-img')).toHaveAttribute('src', 'https://e/x3.jpg');
  });

  it('5. single image: KHÔNG render thumbnail strip + nav arrows', () => {
    render(
      <TestProviders>
        <ImageLightbox images={[sampleImages[0]]} startIdx={0} onClose={() => {}} />
      </TestProviders>,
    );
    expect(screen.queryByTestId('image-lightbox-thumbs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('image-lightbox-prev')).not.toBeInTheDocument();
    expect(screen.queryByTestId('image-lightbox-next')).not.toBeInTheDocument();
  });
});
