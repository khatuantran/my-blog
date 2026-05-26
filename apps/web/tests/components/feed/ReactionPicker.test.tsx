import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactionPicker } from '@/components/feed/ReactionPicker';

describe('ReactionPicker (T-358 pill → panel refactor)', () => {
  it('container uses rounded-lg panel (NOT rounded-full pill)', () => {
    render(<ReactionPicker open selected={null} onPick={vi.fn()} />);
    const picker = screen.getByTestId('reaction-picker');
    expect(picker.className).toContain('rounded-lg');
    expect(picker.className).not.toContain('rounded-full');
  });

  it('each reaction button is 40×40 inline style NOT 36×36', () => {
    // T-358 polish (2026-05-26): switched from Tailwind h-10/w-10 to inline style
    // because per-color hover/active bg + border + box-shadow require dynamic hex
    // interpolation that Tailwind can't tree-shake.
    render(<ReactionPicker open selected={null} onPick={vi.fn()} />);
    const btn = screen.getByTestId('reaction-picker-LIKE') as HTMLButtonElement;
    expect(btn.style.width).toBe('40px');
    expect(btn.style.height).toBe('40px');
    expect(btn.style.borderRadius).toBe('6px');
  });

  it('hover handler applies translateY + per-color background + boxShadow glow', () => {
    // T-358 polish: hover state moved from Tailwind hover: classes → inline onMouseEnter
    // handlers per design-file Feed.html L750 spec (needs runtime hex interpolation).
    render(<ReactionPicker open selected={null} onPick={vi.fn()} />);
    const btn = screen.getByTestId('reaction-picker-LOVE') as HTMLButtonElement;
    // Initial state — no transform, no glow.
    expect(btn.style.transform).toBe('');
    expect(btn.style.boxShadow).toBe('');
    fireEvent.mouseEnter(btn);
    expect(btn.style.transform).toBe('translateY(-2px)');
    // LOVE color #FF6E96 + 22 alpha — JSDOM normalizes to rgba(255, 110, 150, 0.133).
    expect(btn.style.background.toLowerCase()).toMatch(/rgba\(255,\s*110,\s*150/);
    expect(btn.style.boxShadow).toMatch(/0px 0px 10px|0 0 10px/);
    fireEvent.mouseLeave(btn);
    expect(btn.style.transform).toBe('translateY(0)');
    expect(btn.style.boxShadow).toBe('none');
  });

  it('selected reaction renders icon with glow filter (drop-shadow) + active bg/border', () => {
    const { container } = render(<ReactionPicker open selected="WOW" onPick={vi.fn()} />);
    const wowSvg = container.querySelector('[data-testid="reaction-icon-WOW"]') as SVGElement;
    expect(wowSvg).toBeTruthy();
    // WOW color in T-357 config = #BB9AF7 (pur).
    expect(wowSvg.style.filter).toMatch(/drop-shadow\(.*#BB9AF7/i);
    // Non-selected variant has no glow filter.
    const likeSvg = container.querySelector('[data-testid="reaction-icon-LIKE"]') as SVGElement;
    expect(likeSvg.style.filter).toBe('none');
    // Active button has bg color tint + colored border (not transparent).
    // WOW color #BB9AF7 + 18 alpha → JSDOM rgba(187, 154, 247, ...).
    const wowBtn = screen.getByTestId('reaction-picker-WOW') as HTMLButtonElement;
    expect(wowBtn.style.background.toLowerCase()).toMatch(/rgba\(187,\s*154,\s*247/);
    expect(wowBtn.style.borderColor).not.toBe('transparent');
  });
});
