import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { PostMiniCard } from '@/components/profile/PostMiniCard';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';
import type { Post } from '@/types/api';

const API = 'http://localhost:3001';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'p-abc123',
    content: 'Hello world this is a test post with some content.',
    mood: 'HAPPY',
    viewCount: 42,
    author: { id: 'u1', username: 'alice', avatarUrl: null, role: 'USER', title: null },
    tags: [{ id: 't1', name: '#dev', color: '#00FFE5' }],
    images: [],
    files: [],
    counts: { reactions: 5, comments: 3 },
    topReactions: [],
    myReaction: null,
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function wrap(ui: React.ReactElement) {
  return render(<TestProviders>{ui}</TestProviders>);
}

describe('PostMiniCard', () => {
  it('renders content + mood badge + counts + read link', () => {
    wrap(<PostMiniCard post={makePost()} />);
    expect(screen.getByText(/Hello world/)).toBeInTheDocument();
    expect(screen.getByText(/😊/)).toBeInTheDocument(); // MoodBadge emoji
    expect(screen.getByText(/5/)).toBeInTheDocument(); // reactions count
    expect(screen.getByText(/3/)).toBeInTheDocument(); // comments count
    const readLink = screen.getByRole('link', { name: /read post/i });
    expect(readLink).toHaveAttribute('href', '/post/p-abc123');
  });

  it('image thumbs — shows max 3 + "+N" overlay for extras', () => {
    const images = Array.from({ length: 5 }, (_, i) => ({
      id: `img${i}`,
      url: `https://example.com/img${i}.jpg`,
      publicId: `img${i}`,
      width: 100,
      height: 80,
      order: i,
    }));
    const { container } = wrap(<PostMiniCard post={makePost({ images })} />);
    // alt="" images have ARIA role "presentation", query via DOM
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(3); // only 3 visible
    expect(screen.getByText('+2')).toBeInTheDocument(); // overlay for 5-3=2 extras
  });

  it('read → link navigates to /post/:id', () => {
    wrap(<PostMiniCard post={makePost({ id: 'xyz789' })} />);
    expect(screen.getByRole('link', { name: /read post xyz789/i })).toHaveAttribute(
      'href',
      '/post/xyz789',
    );
  });

  it('like toggle — ♡ → calls LIKE upsert reaction mutation', async () => {
    let mutationCalled = false;
    mswServer.use(
      http.post(`${API}/posts/p-abc123/reactions`, () => {
        mutationCalled = true;
        return HttpResponse.json({ data: null });
      }),
    );
    wrap(<PostMiniCard post={makePost({ myReaction: null })} />);
    const likeBtn = screen.getByRole('button', { name: /like post/i });
    expect(likeBtn).toHaveTextContent('♡');
    fireEvent.click(likeBtn);
    await waitFor(() => expect(mutationCalled).toBe(true));
  });

  it('regression BUG-033: rich-text HTML content render dạng text (strip tag, không hiện raw <p>)', () => {
    wrap(
      <PostMiniCard
        post={makePost({
          content: '<p>test local url</p><p>second <strong>bold</strong> line</p>',
        })}
      />,
    );
    // Hiển thị text đã strip tag, KHÔNG còn `<p>` raw
    expect(screen.getByText(/test local url second bold line/i)).toBeInTheDocument();
    expect(screen.queryByText(/<p>/)).toBeNull();
  });

  it('regression BUG-008: tags render as pill chip (bg + border color) and read link is bordered cyan pill', () => {
    wrap(
      <PostMiniCard
        post={makePost({
          tags: [{ id: 't1', name: '#code', color: '#9ECE6A' }],
        })}
      />,
    );

    // Tag pill: must have inline bg + border color derived from tag color (design L327)
    const tagPill = screen.getByTestId('mini-tag-#code');
    expect(tagPill).toHaveStyle({
      backgroundColor: '#9ECE6A15',
      borderColor: '#9ECE6A40',
      color: '#9ECE6A',
    });
    // pill structural classes
    expect(tagPill.className).toMatch(/rounded-\[3px\]/);
    expect(tagPill.className).toMatch(/border/);
    expect(tagPill.className).toMatch(/px-1\.5/);

    // read → link: bordered cyan pill (design L338)
    const readLink = screen.getByTestId('mini-read-link');
    expect(readLink.className).toMatch(/border-cyan/);
    expect(readLink.className).toMatch(/rounded/);
    expect(readLink.className).toMatch(/px-2/);
    expect(readLink.className).toMatch(/text-cyan/);
  });
});
