import { describe, it, expect } from 'vitest';
import { insertAt } from '@/lib/insert-at-cursor';

describe('insertAt', () => {
  it('insert tại cursor không có selection', () => {
    const r = insertAt('hello world', 5, 5, ' 😊');
    expect(r.value).toBe('hello 😊 world');
    expect(r.selectionStart).toBe(5 + ' 😊'.length);
    expect(r.selectionEnd).toBe(r.selectionStart);
  });

  it('replace selection với text mới', () => {
    const r = insertAt('hello world', 6, 11, 'react');
    expect(r.value).toBe('hello react');
    expect(r.selectionStart).toBe(11);
  });

  it('insert empty string', () => {
    const r = insertAt('abc', 1, 1, '');
    expect(r.value).toBe('abc');
    expect(r.selectionStart).toBe(1);
  });
});
