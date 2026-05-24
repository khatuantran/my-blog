import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactionButton } from '@/components/feed/ReactionButton';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';

const API_URL = 'http://localhost:3001';

function upsertOk(type: string, total: number, topThree: string[]) {
  return http.post(`${API_URL}/posts/:id/reactions`, () =>
    HttpResponse.json({
      data: {
        type,
        totalCounts: { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0, [type]: total },
        topThree,
      },
    }),
  );
}

function deleteOk() {
  return http.delete(
    `${API_URL}/posts/:id/reactions`,
    () => new HttpResponse(null, { status: 204 }),
  );
}

describe('ReactionButton (T-317)', () => {
  beforeEach(() => {
    mswServer.use(upsertOk('LIKE', 1, ['LIKE']), deleteOk());
  });

  it('1. hover trigger → reveals picker với 6 emoji', async () => {
    render(
      <TestProviders>
        <ReactionButton postId="p1" myReaction={null} topReactions={[]} count={0} />
      </TestProviders>,
    );
    fireEvent.mouseEnter(screen.getByTestId('reaction-button-p1').parentElement!);
    await waitFor(() => expect(screen.getByTestId('reaction-picker')).toBeInTheDocument());
    expect(screen.getByTestId('reaction-picker-LIKE')).toBeInTheDocument();
    expect(screen.getByTestId('reaction-picker-LOVE')).toBeInTheDocument();
    expect(screen.getByTestId('reaction-picker-ANGRY')).toBeInTheDocument();
  });

  it('2. click trigger (no myReaction) → optimistic LIKE applied', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <ReactionButton postId="p1" myReaction={null} topReactions={[]} count={3} />
      </TestProviders>,
    );
    const btn = screen.getByTestId('reaction-button-p1');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    await user.click(btn);
    await waitFor(() => {
      expect(screen.getByTestId('reaction-button-p1')).toHaveAttribute('aria-pressed', 'true');
    });
    expect(screen.getByLabelText('View 4 reactions')).toBeInTheDocument();
  });

  it('3. change type LIKE → LOVE via picker', async () => {
    mswServer.use(upsertOk('LOVE', 5, ['LOVE']));
    render(
      <TestProviders>
        <ReactionButton postId="p1" myReaction="LIKE" topReactions={['LIKE']} count={5} />
      </TestProviders>,
    );
    // Open picker (hover semantics) via fireEvent — avoids jsdom userEvent timing gap.
    fireEvent.mouseEnter(screen.getByTestId('reaction-button-p1').parentElement!);
    await waitFor(() => expect(screen.getByTestId('reaction-picker')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('reaction-picker-LOVE'));
    await waitFor(() => {
      expect(screen.getByTestId('reaction-button-p1')).toHaveAttribute(
        'aria-label',
        'Remove Love reaction',
      );
    });
  });

  it('4. toggle off — click trigger khi đã có active → remove', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <ReactionButton postId="p1" myReaction="LIKE" topReactions={['LIKE']} count={1} />
      </TestProviders>,
    );
    await user.click(screen.getByTestId('reaction-button-p1'));
    await waitFor(() => {
      expect(screen.getByTestId('reaction-button-p1')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('5. display top 3 emoji + total count dưới button', () => {
    render(
      <TestProviders>
        <ReactionButton
          postId="p1"
          myReaction={null}
          topReactions={['LOVE', 'LIKE', 'HAHA']}
          count={12}
        />
      </TestProviders>,
    );
    expect(screen.getByLabelText('View 12 reactions')).toBeInTheDocument();
  });

  it('6. click count → opens ReactionList modal', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts/p1/reactions`, () =>
        HttpResponse.json({
          data: {
            items: [
              {
                actor: { id: 'u1', username: 'alice', avatarUrl: null },
                type: 'LIKE',
                createdAt: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            limit: 20,
            byType: { LIKE: 1, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
          },
        }),
      ),
    );
    const user = userEvent.setup();
    render(
      <TestProviders>
        <ReactionButton postId="p1" myReaction={null} topReactions={['LIKE']} count={1} />
      </TestProviders>,
    );
    await user.click(screen.getByTestId('reaction-count-p1'));
    await waitFor(() => expect(screen.getByTestId('reaction-list-modal')).toBeInTheDocument());
    expect(await screen.findByText('alice')).toBeInTheDocument();
  });

  it('7. modal tab switch → filters by type', async () => {
    mswServer.use(
      http.get(`${API_URL}/posts/p1/reactions`, ({ request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get('type');
        const items =
          type === 'LOVE'
            ? [
                {
                  actor: { id: 'u2', username: 'bob', avatarUrl: null },
                  type: 'LOVE',
                  createdAt: new Date().toISOString(),
                },
              ]
            : [];
        return HttpResponse.json({
          data: {
            items,
            total: items.length,
            page: 1,
            limit: 20,
            byType: { LIKE: 0, LOVE: 1, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
          },
        });
      }),
    );
    const user = userEvent.setup();
    render(
      <TestProviders>
        <ReactionButton postId="p1" myReaction={null} topReactions={['LOVE']} count={1} />
      </TestProviders>,
    );
    await user.click(screen.getByTestId('reaction-count-p1'));
    await waitFor(() => expect(screen.getByTestId('reaction-list-modal')).toBeInTheDocument());
    await user.click(screen.getByTestId('reaction-tab-LOVE'));
    expect(await screen.findByText('bob')).toBeInTheDocument();
  });

  it('regression BUG-001: picker stays open when mouse moves through 6px gap between button and picker', async () => {
    render(
      <TestProviders>
        <ReactionButton postId="p1" myReaction={null} topReactions={[]} count={0} />
      </TestProviders>,
    );
    const container = screen.getByTestId('reaction-button-p1').parentElement!;
    fireEvent.mouseEnter(container);
    await waitFor(() => expect(screen.getByTestId('reaction-picker')).toBeInTheDocument());
    // Mouse enters picker (simulates move through gap to popover)
    fireEvent.mouseEnter(screen.getByTestId('reaction-picker'));
    // Picker must still be open — debounce timer was cleared
    expect(screen.getByTestId('reaction-picker')).toBeInTheDocument();
    // Mouse leaves container entirely → picker closes after 250ms debounce
    fireEvent.mouseLeave(container);
    await waitFor(() => expect(screen.queryByTestId('reaction-picker')).not.toBeInTheDocument(), {
      timeout: 100,
    });
  });

  it('8. 410 Gone từ legacy endpoint → disable button + show inline error', async () => {
    mswServer.use(
      http.post(`${API_URL}/posts/p1/reactions`, () =>
        HttpResponse.json(
          { error: { code: 'GONE', message: 'use /posts/:id/reactions' } },
          { status: 410 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(
      <TestProviders>
        <ReactionButton postId="p1" myReaction={null} topReactions={[]} count={0} />
      </TestProviders>,
    );
    await user.click(screen.getByTestId('reaction-button-p1'));
    await waitFor(() => {
      expect(screen.getByTestId('reaction-button-p1')).toBeDisabled();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('reactions endpoint unavailable');
  });
});
