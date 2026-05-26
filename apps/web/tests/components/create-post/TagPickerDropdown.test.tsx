import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useState } from 'react';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { TagPickerDropdown, type TagDraft } from '@/components/create-post/TagPickerDropdown';
import { createTestQueryClient } from '../../_helpers/query-client';
import { mswServer } from '../../_helpers/msw-server';

const API_URL = 'http://localhost:3001';

beforeEach(() => {
  mswServer.use(
    http.get(`${API_URL}/tags`, () =>
      HttpResponse.json({
        data: {
          items: [
            {
              id: 't1',
              name: 'react',
              color: '#00FFE5',
              description: null,
              postCount: 42,
              sparkline7d: [],
              createdAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 't2',
              name: 'typescript',
              color: '#BB9AF7',
              description: null,
              postCount: 30,
              sparkline7d: [],
              createdAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 't3',
              name: 'nextjs',
              color: '#9ECE6A',
              description: null,
              postCount: 18,
              sparkline7d: [],
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      }),
    ),
  );
});

function Wrapper(props: { initial?: TagDraft[] }) {
  const [value, setValue] = useState<TagDraft[]>(props.initial ?? []);
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <TagPickerDropdown value={value} onChange={setValue} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TagPickerDropdown (T-367)', () => {
  it('click `+ add tag` → dropdown opens with system tag chips', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByTestId('tag-picker-trigger'));
    await waitFor(() => {
      expect(screen.getByTestId('tag-picker-chip-react')).toBeInTheDocument();
    });
    expect(screen.getByTestId('tag-picker-chip-typescript')).toBeInTheDocument();
    expect(screen.getByTestId('tag-picker-chip-nextjs')).toBeInTheDocument();
  });

  it('already-selected tags filtered out from dropdown chips', async () => {
    const user = userEvent.setup();
    render(<Wrapper initial={[{ name: 'react', color: '#00FFE5' }]} />);
    await user.click(screen.getByTestId('tag-picker-trigger'));
    await waitFor(() => {
      expect(screen.getByTestId('tag-picker-chip-typescript')).toBeInTheDocument();
    });
    // react chip filtered out
    expect(screen.queryByTestId('tag-picker-chip-react')).toBeNull();
  });

  it('click chip → adds to value via onChange', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByTestId('tag-picker-trigger'));
    await waitFor(() => {
      expect(screen.getByTestId('tag-picker-chip-react')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('tag-picker-chip-react'));
    // Selected chip should now render as TagPill in the field row + react chip removed from dropdown
    expect(screen.getByLabelText('Remove tag #react')).toBeInTheDocument();
    expect(screen.queryByTestId('tag-picker-chip-react')).toBeNull();
  });

  it('shows only system tags (no free-form input — typing not possible)', () => {
    render(<Wrapper />);
    // No <input> in dropdown — picker is button-only.
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByPlaceholderText(/add tag\.\.\./)).toBeNull();
  });

  it('footer manage tags link navigates to /tags', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByTestId('tag-picker-trigger'));
    await waitFor(() => {
      expect(screen.getByTestId('tag-picker-manage-link')).toBeInTheDocument();
    });
    const link = screen.getByTestId('tag-picker-manage-link');
    expect(link).toHaveAttribute('href', '/tags');
  });
});

// Silence MSW unhandled-request warnings — qk.tags.list("top") may issue duplicate
// requests during test setup since useTags has no staleTime customization.
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
