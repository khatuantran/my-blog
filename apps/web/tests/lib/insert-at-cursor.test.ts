import { describe, expect, it } from 'vitest';
import { wrapSelection } from '@/lib/insert-at-cursor';

describe('wrapSelection', () => {
  it('wrap selection với **bold**', () => {
    const r = wrapSelection('hello world', 6, 11, '**', '**');
    expect(r.value).toBe('hello **world**');
    expect(r.selectionStart).toBe(8);
    expect(r.selectionEnd).toBe(13);
  });

  it('insert at cursor (selectionStart === selectionEnd)', () => {
    const r = wrapSelection('abc', 1, 1, '_', '_');
    expect(r.value).toBe('a__bc');
    expect(r.selectionStart).toBe(2);
    expect(r.selectionEnd).toBe(2);
  });

  it('asymmetric wrap (heading prefix only)', () => {
    const r = wrapSelection('title', 0, 5, '# ', '');
    expect(r.value).toBe('# title');
    expect(r.selectionStart).toBe(2);
    expect(r.selectionEnd).toBe(7);
  });

  it('link insert giữ url placeholder', () => {
    const r = wrapSelection('click me', 0, 8, '[', '](url)');
    expect(r.value).toBe('[click me](url)');
  });
});
