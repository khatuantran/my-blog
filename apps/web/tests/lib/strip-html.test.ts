import { describe, it, expect } from 'vitest';
import { stripHtml } from '@/lib/strip-html';

describe('stripHtml', () => {
  it('bỏ tag HTML → plain text + collapse whitespace', () => {
    expect(stripHtml('<p>test local url</p>')).toBe('test local url');
    expect(stripHtml('<p>a</p><p>b <strong>c</strong></p>')).toBe('a b c');
  });

  it('decode entity cơ bản', () => {
    expect(stripHtml('<p>a &amp; b &lt;x&gt; &quot;q&quot;</p>')).toBe('a & b <x> "q"');
    expect(stripHtml('a&nbsp;b')).toBe('a b');
  });

  it('bỏ trọn script/style content', () => {
    expect(stripHtml('<p>hi</p><script>alert(1)</script>')).toBe('hi');
    expect(stripHtml('<style>.x{color:red}</style><p>ok</p>')).toBe('ok');
  });

  it('markdown legacy (không tag) đi qua nguyên (chỉ collapse space)', () => {
    expect(stripHtml('Hello   world')).toBe('Hello world');
    expect(stripHtml('**bold** text')).toBe('**bold** text');
  });
});
