import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostPreview } from '@/components/create-post/PostPreview';

describe('PostPreview', () => {
  it('empty content → italic placeholder text', () => {
    render(<PostPreview mood="HAPPY" content="" tags={[]} imageCount={0} />);
    expect(screen.getByText(/content preview will appear here/i)).toBeInTheDocument();
  });

  it('content rendered + mood badge reflects', () => {
    render(<PostPreview mood="EXCITED" content="hello world" tags={[]} imageCount={0} />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
    expect(screen.getByText(/excited/i)).toBeInTheDocument();
  });

  it('regression BUG-019: HTML content render nguyên thẻ (không cắt giữa tag) + clamp bằng CSS', () => {
    // Content HTML dài (TipTap output). Cách cũ slice(0,300) cắt giữa thẻ → vỡ render.
    const html = `<p><strong>bold start</strong> ${'word '.repeat(120)}</p><h2>heading</h2>`;
    const { container } = render(
      <PostPreview mood="HAPPY" content={html} tags={[]} imageCount={0} />,
    );
    // HTML render qua PostContent (dangerouslySetInnerHTML) — thẻ semantic còn nguyên.
    const rendered = screen.getByTestId('post-content-html');
    expect(rendered.querySelector('strong')?.textContent).toBe('bold start');
    expect(rendered.querySelector('h2')?.textContent).toBe('heading');
    // Clamp bằng CSS max-height + overflow-hidden (không cắt chuỗi).
    const clamp = screen.getByTestId('preview-content-clamp');
    expect(clamp).toHaveClass('overflow-hidden');
    expect(container).toBeTruthy();
  });

  it('imageCount 3 → 3 ImgSlot grid cells', () => {
    const { container } = render(<PostPreview mood="HAPPY" content="" tags={[]} imageCount={5} />);
    // 3 visible (capped at min(count,3))
    expect(container.querySelectorAll('[role="img"]').length).toBe(3);
  });

  it('tags hiển thị TagPill list', () => {
    render(
      <PostPreview
        mood="HAPPY"
        content=""
        tags={[
          { name: 'code', color: '#00FFE5' },
          { name: 'dev', color: '#FF6E96' },
        ]}
        imageCount={0}
      />,
    );
    expect(screen.getByText('#code')).toBeInTheDocument();
    expect(screen.getByText('#dev')).toBeInTheDocument();
  });
});
