import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ResultCard } from '@/components/search/ResultCard';
import { makePost } from '../../_helpers/post-factory';

function renderCard(post = makePost(), query?: string) {
  return render(
    <MemoryRouter>
      <ResultCard post={post} query={query} />
    </MemoryRouter>,
  );
}

describe('ResultCard (T-400 enriched design-file 1:1)', () => {
  it('T-400.1 base render: avatar + author + timestamp + mood + content + post-id deco', () => {
    renderCard(makePost({ id: 'abc123def', content: 'Hello world' }));
    expect(screen.getByTestId('result-card-avatar')).toHaveTextContent('A');
    expect(screen.getByText('~/admin')).toBeInTheDocument();
    expect(screen.getByTestId('result-card-timestamp')).toHaveTextContent(/\[\d{4}-\d{2}-\d{2}/);
    expect(screen.getByTestId('result-card-mood')).toHaveTextContent('happy');
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByTestId('result-card-post-id')).toHaveTextContent('#abc123');
  });

  it('regression BUG-033: rich-text HTML content → strip tag (không hiện raw <p>)', () => {
    renderCard(makePost({ content: '<p>test local url</p><p><strong>bold</strong> two</p>' }));
    expect(screen.getByText(/test local url bold two/i)).toBeInTheDocument();
    expect(screen.queryByText(/<p>/)).toBeNull();
  });

  it('T-400.2 ADMIN badge: renders when author.role=ADMIN, hidden otherwise', () => {
    const { unmount } = renderCard(
      makePost({ author: { id: 'u', username: 'admin', role: 'ADMIN', avatarUrl: null } }),
    );
    expect(screen.getByTestId('result-card-admin-badge')).toHaveTextContent('[ ADMIN ]');
    unmount();
    renderCard(makePost({ author: { id: 'u', username: 'user', role: 'USER', avatarUrl: null } }));
    expect(screen.queryByTestId('result-card-admin-badge')).not.toBeInTheDocument();
  });

  it('T-400.3 tags render inline per-color, empty array → no tag elements', () => {
    renderCard(
      makePost({
        tags: [
          { id: 't1', name: '#code', color: '#9ECE6A' },
          { id: 't2', name: '#dev', color: null },
        ],
      }),
    );
    expect(screen.getByTestId('result-card-tag-#code')).toBeInTheDocument();
    expect(screen.getByTestId('result-card-tag-#dev')).toBeInTheDocument();
  });

  it('T-400.4 files badge: renders 📎 + count when files.length > 0, hidden when empty', () => {
    const { unmount } = renderCard(
      makePost({
        files: [
          { id: 'f1', name: 'a.pdf', type: 'PDF', size: 100, url: '/a', publicId: 'p1' },
          { id: 'f2', name: 'b.docx', type: 'DOCX', size: 200, url: '/b', publicId: 'p2' },
        ],
      }),
    );
    expect(screen.getByTestId('result-card-files-badge')).toHaveTextContent('2 files');
    unmount();
    renderCard(makePost({ files: [] }));
    expect(screen.queryByTestId('result-card-files-badge')).not.toBeInTheDocument();
  });

  it('T-400.5 engagement stats: ♡ reactions · 💬 comments', () => {
    renderCard(makePost({ counts: { reactions: 24, comments: 5 } }));
    const stats = screen.getByTestId('result-card-stats');
    expect(stats).toHaveTextContent('♡ 24');
    expect(stats).toHaveTextContent('💬 5');
  });

  it('T-400.6 query highlight: matched text wrapped in <mark>', () => {
    renderCard(makePost({ content: 'cyberpunk fantasy world' }), 'cyber');
    const mark = screen.getByText('cyber');
    expect(mark.tagName.toLowerCase()).toBe('mark');
  });
});
