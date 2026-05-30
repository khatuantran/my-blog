import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from '@/components/create-post/RichTextEditor';

function Wrapper(props: { initial?: string; onRequestLink?: (selectedText: string) => void }) {
  const [value, setValue] = useState(props.initial ?? '');
  return <RichTextEditor value={value} onChange={setValue} onRequestLink={props.onRequestLink} />;
}

// JSDOM doesn't implement document.execCommand by default — stub it to capture invocations.
function stubExecCommand() {
  const calls: Array<[string, boolean, string | null]> = [];
  const original = document.execCommand;
  document.execCommand = vi.fn((cmd: string, ui = false, val: string | null = null) => {
    calls.push([cmd, ui, val]);
    return true;
  }) as typeof document.execCommand;
  return {
    calls,
    restore: () => {
      document.execCommand = original;
    },
  };
}

describe('RichTextEditor (T-368)', () => {
  it('renders 11 toolbar buttons + contentEditable region', () => {
    render(<Wrapper />);
    expect(screen.getByTestId('rte-toolbar')).toBeInTheDocument();
    const editor = screen.getByTestId('rte-editor');
    expect(editor.getAttribute('contenteditable')).toBe('true');
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

  it('click B → exec(bold) invoked', async () => {
    const user = userEvent.setup();
    const stub = stubExecCommand();
    render(<Wrapper />);
    await user.click(screen.getByTitle(/Bold/));
    expect(stub.calls.some(([cmd]) => cmd === 'bold')).toBe(true);
    stub.restore();
  });

  it('click H1 → exec(formatBlock, h1)', async () => {
    const user = userEvent.setup();
    const stub = stubExecCommand();
    render(<Wrapper />);
    await user.click(screen.getByTitle(/Heading 1/));
    expect(stub.calls.some(([cmd, , val]) => cmd === 'formatBlock' && val === 'h1')).toBe(true);
    stub.restore();
  });

  it('click A (text color) → opens 7-swatch popover', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    expect(screen.queryByTestId('rte-popover-textcolor')).toBeNull();
    await user.click(screen.getByTestId('rte-btn-textcolor'));
    expect(screen.getByTestId('rte-popover-textcolor')).toBeInTheDocument();
    // 7 TEXT_COLORS swatches present
    expect(screen.getByTestId('rte-textcolor-default')).toBeInTheDocument();
    expect(screen.getByTestId('rte-textcolor-pink')).toBeInTheDocument();
    expect(screen.getByTestId('rte-textcolor-cyan')).toBeInTheDocument();
    expect(screen.getByTestId('rte-textcolor-green')).toBeInTheDocument();
    expect(screen.getByTestId('rte-textcolor-yellow')).toBeInTheDocument();
    expect(screen.getByTestId('rte-textcolor-purple')).toBeInTheDocument();
    expect(screen.getByTestId('rte-textcolor-blue')).toBeInTheDocument();
  });

  it('click 🖍 (highlight) → opens 7-swatch popover with /40 transparency colors', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByTestId('rte-btn-highlight'));
    expect(screen.getByTestId('rte-popover-highlight')).toBeInTheDocument();
    // 7 HIGHLIGHT_COLORS swatches (yellow/pink/cyan/green/purple/orange/blue) — orange exclusive to highlight set.
    expect(screen.getByTestId('rte-highlight-orange')).toBeInTheDocument();
  });

  it('text + highlight popovers are mutually exclusive (opening one closes the other)', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByTestId('rte-btn-textcolor'));
    expect(screen.getByTestId('rte-popover-textcolor')).toBeInTheDocument();
    await user.click(screen.getByTestId('rte-btn-highlight'));
    expect(screen.queryByTestId('rte-popover-textcolor')).toBeNull();
    expect(screen.getByTestId('rte-popover-highlight')).toBeInTheDocument();
  });

  it('⌘B keyboard shortcut while editor focused → exec(bold)', () => {
    const stub = stubExecCommand();
    render(<Wrapper />);
    const editor = screen.getByTestId('rte-editor');
    editor.focus();
    fireEvent.keyDown(document, { key: 'b', metaKey: true });
    expect(stub.calls.some(([cmd]) => cmd === 'bold')).toBe(true);
    stub.restore();
  });

  it('click 🔗 with onRequestLink prop → invokes callback (T-369 wires modal)', async () => {
    const user = userEvent.setup();
    const onRequestLink = vi.fn();
    render(<Wrapper onRequestLink={onRequestLink} />);
    await user.click(screen.getByTestId('rte-btn-link'));
    expect(onRequestLink).toHaveBeenCalledTimes(1);
  });

  it('saveSelection / restoreSelection pattern — text color popover preserves selection when opened', async () => {
    // Selection lifecycle: button mousedown prevents focus loss → saveSelection captures range
    // → popover opens → click swatch → restoreSelection → exec(foreColor).
    const user = userEvent.setup();
    const stub = stubExecCommand();
    render(<Wrapper />);
    await user.click(screen.getByTestId('rte-btn-textcolor'));
    await user.click(screen.getByTestId('rte-textcolor-cyan'));
    expect(stub.calls.some(([cmd, , val]) => cmd === 'foreColor' && val === '#00FFE5')).toBe(true);
    stub.restore();
  });

  describe('T-397 emoji picker integration', () => {
    it('🙂 button present in toolbar', () => {
      render(<Wrapper />);
      expect(screen.getByTestId('rte-btn-emoji')).toBeInTheDocument();
    });

    it('click 🙂 → opens EmojiPicker (closed by default)', async () => {
      const user = userEvent.setup();
      render(<Wrapper />);
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
      await user.click(screen.getByTestId('rte-btn-emoji'));
      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
      expect(screen.getByTestId('rte-btn-emoji')).toHaveAttribute('aria-expanded', 'true');
    });

    it('close button → hides picker', async () => {
      const user = userEvent.setup();
      render(<Wrapper />);
      await user.click(screen.getByTestId('rte-btn-emoji'));
      await user.click(screen.getByTestId('emoji-picker-close'));
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
    });

    it('select emoji → insertHTML(emoji) + GIỮ picker mở (chỉ × đóng — design behavior)', async () => {
      const user = userEvent.setup();
      const stub = stubExecCommand();
      render(<Wrapper />);
      await user.click(screen.getByTestId('rte-btn-emoji'));
      // First emoji in 'faces' group is 😊 (button aria-label="Insert 😊")
      await user.click(screen.getByLabelText('Insert 😊'));
      expect(stub.calls.some(([cmd, , val]) => cmd === 'insertHTML' && val === '😊')).toBe(true);
      // Picker GIỮ mở sau khi chèn (multi-insert) — chỉ × mới đóng (design-file L638).
      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
      await user.click(screen.getByTestId('emoji-picker-close'));
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
      stub.restore();
    });

    it('opening emoji closes text-color popover (mutual exclusion)', async () => {
      const user = userEvent.setup();
      render(<Wrapper />);
      await user.click(screen.getByTestId('rte-btn-textcolor'));
      expect(screen.getByTestId('rte-popover-textcolor')).toBeInTheDocument();
      await user.click(screen.getByTestId('rte-btn-emoji'));
      expect(screen.queryByTestId('rte-popover-textcolor')).not.toBeInTheDocument();
      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
    });
  });
});
