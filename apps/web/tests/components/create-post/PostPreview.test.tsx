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

  it('imageCount 5 → collage 4 slot (1 trái + 3 phải) + overlay +1 (design collage)', () => {
    const { container } = render(<PostPreview mood="HAPPY" content="" tags={[]} imageCount={5} />);
    // shown = min(5,4) = 4 ImgSlot; slot phải cuối overlay "+1".
    expect(container.querySelectorAll('[role="img"]').length).toBe(4);
    expect(screen.getByTestId('preview-image-more')).toHaveTextContent('+1');
  });

  it('imageCount 4 → 4 slot, KHÔNG overlay', () => {
    const { container } = render(<PostPreview mood="HAPPY" content="" tags={[]} imageCount={4} />);
    expect(container.querySelectorAll('[role="img"]').length).toBe(4);
    expect(screen.queryByTestId('preview-image-more')).toBeNull();
  });

  it('files hiển thị attachments list (badge từ ext + name + size)', () => {
    render(
      <PostPreview
        mood="HAPPY"
        content=""
        tags={[]}
        imageCount={0}
        files={[
          { name: 'report.pdf', size: 2_100_000 },
          { name: 'data.xlsx', size: 16_275 },
        ]}
      />,
    );
    const att = screen.getByTestId('preview-attachments');
    expect(att).toHaveTextContent('// attachments [2]');
    expect(att).toHaveTextContent('report.pdf');
    expect(att).toHaveTextContent('PDF');
    expect(att).toHaveTextContent('data.xlsx');
    expect(att).toHaveTextContent('XLSX');
  });

  it('không có files → không render attachments block', () => {
    render(<PostPreview mood="HAPPY" content="" tags={[]} imageCount={0} />);
    expect(screen.queryByTestId('preview-attachments')).toBeNull();
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
