import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostContent } from '@/components/post/PostContent';
import { parsePostContent } from '@/lib/markdown';

describe('parsePostContent', () => {
  it('plain text → 1 text segment', () => {
    expect(parsePostContent('hello world')).toEqual([{ type: 'text', value: 'hello world' }]);
  });

  it('1 code block giữa 2 đoạn text → 3 segments', () => {
    const segs = parsePostContent('before\n```js\nconst x = 1;\n```\nafter');
    expect(segs).toHaveLength(3);
    expect(segs[0]).toEqual({ type: 'text', value: 'before\n' });
    expect(segs[1].type).toBe('code');
    expect(segs[1].value).toBe('const x = 1;\n');
    expect(segs[2]).toEqual({ type: 'text', value: '\nafter' });
  });

  it('strip language hint `ts\\n` ở đầu code', () => {
    const segs = parsePostContent('```ts\nconst y = 2;\n```');
    expect(segs[0].type).toBe('code');
    expect(segs[0].value).toBe('const y = 2;\n');
  });

  it('unclosed code block: lấy đến cuối content', () => {
    const segs = parsePostContent('text\n```\nopen');
    expect(segs).toHaveLength(2);
    expect(segs[1].type).toBe('code');
    expect(segs[1].value).toBe('\nopen');
  });
});

describe('PostContent component', () => {
  it('renders paragraphs split bởi blank line', () => {
    const { container } = render(<PostContent content={'line one\n\nline two'} />);
    expect(container.querySelectorAll('p').length).toBe(2);
  });

  it('renders <pre> cho code block', () => {
    const { container } = render(<PostContent content={'```js\nconst x=1;\n```'} />);
    expect(container.querySelectorAll('pre').length).toBe(1);
    expect(screen.getByText('const x=1;')).toBeInTheDocument();
  });

  it('variant="detail" áp dụng font-size lớn hơn', () => {
    const { container, rerender } = render(<PostContent content="x" variant="card" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/14px/);
    rerender(<PostContent content="x" variant="detail" />);
    const detail = container.firstChild as HTMLElement;
    expect(detail.className).toMatch(/15px/);
  });
});
