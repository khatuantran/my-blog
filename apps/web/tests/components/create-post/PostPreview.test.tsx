import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostPreview } from '@/components/create-post/PostPreview';

// Collapse/expand + clamp logic được test riêng ở CollapsibleContent.test.tsx (T-440 extract).
describe('PostPreview', () => {
  it('empty content → italic placeholder text', () => {
    render(<PostPreview mood="HAPPY" content="" tags={[]} imageCount={0} />);
    expect(screen.getByText(/content preview will appear here/i)).toBeInTheDocument();
  });

  it('content rendered (qua CollapsibleContent) + mood badge reflects', () => {
    render(<PostPreview mood="EXCITED" content="hello world" tags={[]} imageCount={0} />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
    expect(screen.getByText(/excited/i)).toBeInTheDocument();
    expect(screen.getByTestId('collapsible-content')).toBeInTheDocument();
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
