import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsibleContent } from '@/components/post/CollapsibleContent';

describe('CollapsibleContent (T-440)', () => {
  it('regression BUG-019: HTML content render nguyên thẻ (không cắt giữa tag)', () => {
    const html = `<p><strong>bold start</strong> ${'word '.repeat(120)}</p><h2>heading</h2>`;
    render(<CollapsibleContent content={html} variant="card" />);
    const rendered = screen.getByTestId('post-content-html');
    expect(rendered.querySelector('strong')?.textContent).toBe('bold start');
    expect(rendered.querySelector('h2')?.textContent).toBe('heading');
    expect(screen.getByTestId('collapsible-content')).toHaveClass('overflow-hidden');
  });

  it('content ngắn (không overflow) → KHÔNG hiện toggle', () => {
    render(<CollapsibleContent content="<p>short</p>" />);
    // jsdom scrollHeight = 0 → not overflowing → no toggle.
    expect(screen.queryByTestId('collapsible-toggle')).toBeNull();
  });

  it('content dài (overflow) → hiện show more/collapse + toggle clamp maxHeight', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(999);
    try {
      render(<CollapsibleContent content={`<p>${'x'.repeat(80)}</p>`} maxHeight={300} />);
      const toggle = await screen.findByTestId('collapsible-toggle');
      expect(toggle).toHaveTextContent('show more');
      const clamp = screen.getByTestId('collapsible-content');
      // getClientRects polyfill rỗng → fallback maxHeight prop.
      expect(clamp).toHaveStyle({ maxHeight: '300px' });
      await user.click(toggle);
      expect(toggle).toHaveTextContent('collapse');
      expect(clamp).not.toHaveStyle({ maxHeight: '300px' });
    } finally {
      spy.mockRestore();
    }
  });
});
