import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactionIcon } from '@/components/feed/ReactionIcon';
import { REACTION_TYPES } from '@/types/api';

describe('ReactionIcon (T-357)', () => {
  it('renders 6 reaction variants — each emits SVG with type-specific testid', () => {
    expect(REACTION_TYPES).toHaveLength(6);
    const { container } = render(
      <>
        {REACTION_TYPES.map((t) => (
          <ReactionIcon key={t} r={t} />
        ))}
      </>,
    );
    // Every variant produces an <svg> with viewBox 0 0 24 24.
    const svgs = container.querySelectorAll('svg[viewBox="0 0 24 24"]');
    expect(svgs.length).toBe(REACTION_TYPES.length);
    for (const t of REACTION_TYPES) {
      expect(screen.getByTestId(`reaction-icon-${t}`)).toBeInTheDocument();
    }
  });

  it('glow=true adds drop-shadow filter tinted with reaction color', () => {
    const { container, rerender } = render(<ReactionIcon r="LOVE" />);
    const svgNoGlow = container.querySelector('svg') as SVGElement;
    expect(svgNoGlow.style.filter).toBe('none');

    rerender(<ReactionIcon r="LOVE" glow />);
    const svgGlow = container.querySelector('svg') as SVGElement;
    // LOVE color = #FF6E96 (mag) per T-357 config update.
    expect(svgGlow.style.filter).toMatch(/drop-shadow\(.*#FF6E96/i);
  });

  it('size prop sets width/height (default 18 / override 24)', () => {
    const { container, rerender } = render(<ReactionIcon r="WOW" />);
    const def = container.querySelector('svg') as SVGElement;
    expect(def.getAttribute('width')).toBe('18');
    expect(def.getAttribute('height')).toBe('18');

    rerender(<ReactionIcon r="WOW" size={24} />);
    const big = container.querySelector('svg') as SVGElement;
    expect(big.getAttribute('width')).toBe('24');
    expect(big.getAttribute('height')).toBe('24');
  });
});
