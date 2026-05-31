import { describe, expect, it, vi, afterEach } from 'vitest';
import { buildShareUrl, openShare } from '@/lib/share';

describe('buildShareUrl (FR-05.1)', () => {
  const url = 'https://kha.blog/post/abc';
  const text = 'Hello & world';

  it('facebook → sharer.php?u= với url đã encode', () => {
    const out = buildShareUrl('facebook', { url, text });
    expect(out).toContain('https://www.facebook.com/sharer/sharer.php?u=');
    expect(out).toContain(encodeURIComponent(url));
  });

  it('x → twitter intent với url + text đã encode', () => {
    const out = buildShareUrl('x', { url, text });
    expect(out).toContain('https://twitter.com/intent/tweet?url=');
    expect(out).toContain(encodeURIComponent(url));
    expect(out).toContain(`text=${encodeURIComponent(text)}`);
  });

  it('telegram → t.me/share/url với url + text đã encode', () => {
    const out = buildShareUrl('telegram', { url, text });
    expect(out).toContain('https://t.me/share/url?url=');
    expect(out).toContain(encodeURIComponent(url));
    expect(out).toContain(`text=${encodeURIComponent(text)}`);
  });

  it('encode url để query param của bài không phá vỡ intent URL', () => {
    const tricky = 'https://kha.blog/post/abc?x=1&y=2';
    const out = buildShareUrl('facebook', { url: tricky });
    expect(out).toContain(encodeURIComponent(tricky));
    expect(out).not.toContain('&y=2'); // raw ampersand phải bị encode
  });
});

describe('openShare', () => {
  afterEach(() => vi.restoreAllMocks());

  it('mở intent URL ở tab mới (_blank)', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    openShare('telegram', { url: 'https://kha.blog/post/x', text: 'hi' });
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][0] as string).toContain('https://t.me/share/url?url=');
    expect(open.mock.calls[0][1]).toBe('_blank');
  });
});
