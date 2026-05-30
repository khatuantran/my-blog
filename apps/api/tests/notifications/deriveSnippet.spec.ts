import { deriveSnippet } from '@/notifications/notifications.service';

describe('deriveSnippet (T-403)', () => {
  it('returns undefined cho null/empty/whitespace input', () => {
    expect(deriveSnippet(null)).toBeUndefined();
    expect(deriveSnippet(undefined)).toBeUndefined();
    expect(deriveSnippet('')).toBeUndefined();
    expect(deriveSnippet('   ')).toBeUndefined();
  });

  it('strips HTML tags', () => {
    expect(deriveSnippet('<p>Hello <b>world</b></p>')).toBe('Hello world');
    expect(deriveSnippet('<div><span>a</span> <em>b</em></div>')).toBe('a b');
  });

  it('collapses whitespace runs', () => {
    expect(deriveSnippet('foo\n\n  bar\t\tbaz')).toBe('foo bar baz');
  });

  it('truncates > 80 chars + appends `…`', () => {
    const long = 'a'.repeat(120);
    const result = deriveSnippet(long);
    expect(result).toBe(`${'a'.repeat(80)}…`);
    expect(result?.length).toBe(81);
  });

  it('keeps ≤ 80 chars intact (no truncation marker)', () => {
    const text = 'a'.repeat(80);
    expect(deriveSnippet(text)).toBe(text);
  });
});
