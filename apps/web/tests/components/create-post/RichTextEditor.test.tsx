import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from '@/components/create-post/RichTextEditor';

function Wrapper(props: { initial?: string; onRequestLink?: (selectedText: string) => void }) {
  const [value, setValue] = useState(props.initial ?? '');
  return <RichTextEditor value={value} onChange={setValue} onRequestLink={props.onRequestLink} />;
}

// useEditor({ immediatelyRender: false }) mounts the ProseMirror element after first effect.
async function waitForEditor() {
  return waitFor(() => screen.getByTestId('rte-editor'));
}

describe('RichTextEditor (T-435 — TipTap engine)', () => {
  it('renders 11 toolbar buttons + TipTap editor region', async () => {
    render(<Wrapper />);
    expect(screen.getByTestId('rte-toolbar')).toBeInTheDocument();
    const editor = await waitForEditor();
    // TipTap renders a contentEditable ProseMirror node carrying our attributes.
    expect(editor.getAttribute('contenteditable')).toBe('true');
    expect(editor).toHaveClass('ProseMirror');
    // Spot-check key buttons present (B / I / U / S + color/highlight + H1/H2 + lists + 🔗 + ✕)
    expect(screen.getByTitle(/Bold/)).toBeInTheDocument();
    expect(screen.getByTitle(/Italic/)).toBeInTheDocument();
    expect(screen.getByTitle(/Underline/)).toBeInTheDocument();
    expect(screen.getByTitle(/Strikethrough/)).toBeInTheDocument();
    expect(screen.getByTitle(/Text color/)).toBeInTheDocument();
    expect(screen.getByTitle(/Highlight background/)).toBeInTheDocument();
    expect(screen.getByTitle(/Heading 1/)).toBeInTheDocument();
    expect(screen.getByTitle(/Heading 2/)).toBeInTheDocument();
    expect(screen.getByTitle(/Bullet list/)).toBeInTheDocument();
    expect(screen.getByTitle(/Numbered list/)).toBeInTheDocument();
    expect(screen.getByTestId('rte-btn-link')).toBeInTheDocument();
    expect(screen.getByTitle(/Clear formatting/)).toBeInTheDocument();
  });

  it('regression BUG-020: initial messy <font> HTML → editor normalizes to semantic <strong> (no <font>/inline-weight)', async () => {
    render(<Wrapper initial={'<p><font color="#ff0000" style="font-weight:700">hi</font></p>'} />);
    const editor = await waitForEditor();
    await waitFor(() => expect(editor.textContent).toContain('hi'));
    // execCommand-era bloat must be gone — TipTap schema only emits semantic marks.
    expect(editor.innerHTML).not.toContain('<font');
    expect(editor.innerHTML).not.toContain('font-weight');
    // font-weight:700 → Bold mark → <strong>
    expect(editor.querySelector('strong')?.textContent).toBe('hi');
  });

  it('regression BUG-020: char counter shows text length only (not HTML markup length)', async () => {
    render(<Wrapper initial={'<p><strong>abc</strong></p>'} />);
    await waitForEditor();
    // text "abc" = 3 chars, even though the HTML string is much longer.
    await waitFor(() => expect(screen.getByText(/rich-text · 3 chars/)).toBeInTheDocument());
  });

  it('click A (text color) → opens 7-swatch popover', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await waitForEditor();
    expect(screen.queryByTestId('rte-popover-textcolor')).toBeNull();
    await user.click(screen.getByTestId('rte-btn-textcolor'));
    expect(screen.getByTestId('rte-popover-textcolor')).toBeInTheDocument();
    for (const label of ['default', 'pink', 'cyan', 'green', 'yellow', 'purple', 'blue']) {
      expect(screen.getByTestId(`rte-textcolor-${label}`)).toBeInTheDocument();
    }
  });

  it('click 🖍 (highlight) → opens 7-swatch popover with orange (exclusive to highlight set)', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await waitForEditor();
    await user.click(screen.getByTestId('rte-btn-highlight'));
    expect(screen.getByTestId('rte-popover-highlight')).toBeInTheDocument();
    expect(screen.getByTestId('rte-highlight-orange')).toBeInTheDocument();
    expect(screen.getByTestId('rte-highlight-clear')).toBeInTheDocument();
  });

  it('text + highlight popovers are mutually exclusive', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await waitForEditor();
    await user.click(screen.getByTestId('rte-btn-textcolor'));
    expect(screen.getByTestId('rte-popover-textcolor')).toBeInTheDocument();
    await user.click(screen.getByTestId('rte-btn-highlight'));
    expect(screen.queryByTestId('rte-popover-textcolor')).toBeNull();
    expect(screen.getByTestId('rte-popover-highlight')).toBeInTheDocument();
  });

  it('click 🔗 with onRequestLink prop → invokes callback (T-369 wires modal)', async () => {
    const user = userEvent.setup();
    const onRequestLink = vi.fn();
    render(<Wrapper onRequestLink={onRequestLink} />);
    await waitForEditor();
    await user.click(screen.getByTestId('rte-btn-link'));
    expect(onRequestLink).toHaveBeenCalledTimes(1);
  });

  describe('emoji picker integration (T-397)', () => {
    it('🙂 button present + picker closed by default', async () => {
      render(<Wrapper />);
      await waitForEditor();
      expect(screen.getByTestId('rte-btn-emoji')).toBeInTheDocument();
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
    });

    it('click 🙂 → opens EmojiPicker (aria-expanded true)', async () => {
      const user = userEvent.setup();
      render(<Wrapper />);
      await waitForEditor();
      await user.click(screen.getByTestId('rte-btn-emoji'));
      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
      expect(screen.getByTestId('rte-btn-emoji')).toHaveAttribute('aria-expanded', 'true');
    });

    it('select emoji → picker GIỮ mở (chỉ × đóng — design behavior)', async () => {
      const user = userEvent.setup();
      render(<Wrapper />);
      await waitForEditor();
      await user.click(screen.getByTestId('rte-btn-emoji'));
      await user.click(screen.getByLabelText('Insert 😊'));
      // Picker stays open for multi-insert (design-file L638) — only × closes.
      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
      await user.click(screen.getByTestId('emoji-picker-close'));
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
    });

    it('opening emoji closes text-color popover (mutual exclusion)', async () => {
      const user = userEvent.setup();
      render(<Wrapper />);
      await waitForEditor();
      await user.click(screen.getByTestId('rte-btn-textcolor'));
      expect(screen.getByTestId('rte-popover-textcolor')).toBeInTheDocument();
      await user.click(screen.getByTestId('rte-btn-emoji'));
      expect(screen.queryByTestId('rte-popover-textcolor')).not.toBeInTheDocument();
      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
    });
  });
});
