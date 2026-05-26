import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import config from '../../tailwind.config';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

// T-360 token verification — DESIGN_SYSTEM L147 (z-index) + L163 (shadow) + L1281 (typography).
// Tests assert config + globals.css contain the new tokens. Static checks (no DOM render).

describe('T-360 design tokens', () => {
  it('Z-index resolution: 9 named tiers wired into Tailwind zIndex + CSS custom properties', () => {
    const zIndex = (config.theme?.extend?.zIndex ?? {}) as Record<string, string>;
    const expectedKeys = [
      'base',
      'popover',
      'subbar',
      'topbar',
      'dropdown',
      'modal',
      'modal-stacked',
      'lightbox',
      'dev-tweaks',
    ];
    for (const k of expectedKeys) {
      expect(zIndex[k]).toMatch(/^var\(--z-/);
    }
    // CSS custom properties in globals.css :root block.
    const css = readFileSync(resolve(repoRoot, 'src/styles/globals.css'), 'utf-8');
    expect(css).toMatch(/--z-base:\s*0/);
    expect(css).toMatch(/--z-modal:\s*300/);
    expect(css).toMatch(/--z-lightbox:\s*500/);
    expect(css).toMatch(/--z-dev-tweaks:\s*9999/);
  });

  it('Shadow class: 4 cyan-glow tiers + per-color glow-md + 4 drop + stack compound', () => {
    const shadows = (config.theme?.extend?.boxShadow ?? {}) as Record<string, string>;
    // 4 cyan glow tiers
    expect(shadows['glow-cyan-xs']).toContain('rgba(0, 255, 229');
    expect(shadows['glow-cyan-sm']).toContain('rgba(0, 255, 229');
    expect(shadows['glow-cyan-md']).toContain('rgba(0, 255, 229');
    expect(shadows['glow-cyan-lg']).toContain('rgba(0, 255, 229');
    // Per-color glow-md (7 non-cyan accents)
    expect(shadows['glow-mag-md']).toContain('rgba(255, 110, 150');
    expect(shadows['glow-pur-md']).toContain('rgba(187, 154, 247');
    expect(shadows['glow-grn-md']).toContain('rgba(158, 206, 106');
    expect(shadows['glow-yel-md']).toContain('rgba(224, 175, 104');
    expect(shadows['glow-ora-md']).toContain('rgba(255, 158, 100');
    expect(shadows['glow-red-md']).toContain('rgba(247, 118, 142');
    expect(shadows['glow-blu-md']).toContain('rgba(125, 207, 255');
    // 4 drop variants
    expect(shadows['drop-sm']).toBe('0 4px 20px rgba(0, 0, 0, 0.4)');
    expect(shadows['drop-md']).toContain('rgba(0, 0, 0, 0.55)');
    expect(shadows['drop-lg']).toContain('rgba(0, 0, 0, 0.7)');
    expect(shadows['drop-xl']).toContain('rgba(0, 0, 0, 0.8)');
    // Compound stack
    expect(shadows.stack).toContain('rgba(0, 255, 229'); // glow part
    expect(shadows.stack).toContain('rgba(0, 0, 0'); // drop part
  });

  it('Typography v2.1 variants: 5 new fontSize tokens + 3 letterSpacing + 3 lineHeight', () => {
    const fontSize = (config.theme?.extend?.fontSize ?? {}) as Record<
      string,
      [string, ...unknown[]]
    >;
    expect(fontSize['h1-hero']?.[0]).toBe('26px');
    expect(fontSize['input-hero']?.[0]).toBe('18px');
    expect(fontSize['display-sm']?.[0]).toBe('24px');
    expect(fontSize['mono-tiny']?.[0]).toBe('8px');
    expect(fontSize['display-glyph']?.[0]).toBe('40px');

    const letterSpacing = (config.theme?.extend?.letterSpacing ?? {}) as Record<string, string>;
    expect(letterSpacing['wide-1']).toBe('0.05em');
    expect(letterSpacing['wide-2']).toBe('0.06em');
    expect(letterSpacing['wide-3']).toBe('0.08em');

    const lineHeight = (config.theme?.extend?.lineHeight ?? {}) as Record<string, string>;
    expect(lineHeight['relaxed-1']).toBe('1.75');
    expect(lineHeight['relaxed-2']).toBe('1.8');
    expect(lineHeight['relaxed-3']).toBe('1.9');
  });
});
