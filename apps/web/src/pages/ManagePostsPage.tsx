import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAdminPosts, useDeleteAdminPost } from '@/hooks/queries/use-admin-posts';
import { useToast } from '@/hooks/use-toast';
import { MOOD_CFG, MOOD_KEYS } from '@/lib/mood-config';
import { PostRow } from '@/components/admin/manage-posts/PostRow';
import { PostCardMng } from '@/components/admin/manage-posts/PostCardMng';
import { QuickEditModal } from '@/components/admin/QuickEditModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { AdminPost, Mood, PostStatus } from '@/types/api';

type View = 'list' | 'card';

const STATUS_FILTERS: { label: string; value: PostStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export default function ManagePostsPage() {
  const [params, setParams] = useSearchParams();
  const view = (params.get('view') as View | null) ?? 'list';
  const statusParam = (params.get('status') as PostStatus | null) ?? '';
  const moodParam = (params.get('mood') as Mood | null) ?? '';
  const sortParam = (params.get('sort') ?? 'latest') as 'latest' | 'oldest';

  const [q, setQ] = useState(params.get('q') ?? '');
  const [debouncedQ, setDebouncedQ] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editPost, setEditPost] = useState<AdminPost | null>(null);
  const [deletePost, setDeletePost] = useState<AdminPost | null>(null);

  const { showToast } = useToast();
  const deleteMut = useDeleteAdminPost();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  const { data, isLoading } = useAdminPosts({
    status: statusParam || undefined,
    mood: moodParam || undefined,
    sort: sortParam,
    q: debouncedQ || undefined,
    limit: 20,
  });

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setSelected(new Set());
  }

  function toggleView(v: View) {
    const next = new URLSearchParams(params);
    if (v === 'list') next.delete('view');
    else next.set('view', v);
    setParams(next, { replace: true });
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!data) return;
    if (selected.size === data.items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.items.map((p) => p.id)));
    }
  }

  function handleDelete() {
    if (!deletePost) return;
    deleteMut.mutate(deletePost.id, {
      onSuccess: () => {
        showToast('Post deleted', 'success');
        setDeletePost(null);
      },
      onError: (err) => {
        showToast(err.message, 'error');
        setDeletePost(null);
      },
    });
  }

  const posts = data?.items ?? [];
  const total = data?.total ?? 0;
  const allSelected = posts.length > 0 && selected.size === posts.length;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5">
      {/* SubBar */}
      <div
        className="mb-4 flex items-center justify-between rounded-md border border-b2 bg-surf px-4 py-2"
        data-testid="subbar"
      >
        <div className="font-mono text-mono-sm text-tm">
          <span className="text-cyan">~/admin/posts</span>
          {total > 0 && <span className="ml-2 text-td">· {total} posts</span>}
        </div>
        <Link
          to="/admin/create"
          aria-label="New Post"
          className="rounded-sm border border-cyan/50 bg-cyan/10 px-3 py-1 font-mono text-mono-sm text-cyan hover:bg-cyan/20"
        >
          + New Post →
        </Link>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-b2 bg-surf px-4 py-2">
        {/* Search */}
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="⌕ search posts..."
          aria-label="Search posts"
          className="min-w-[160px] flex-1 rounded-sm border border-b2 bg-bg px-3 py-1 font-mono text-mono-sm text-tp outline-none placeholder:text-td focus:border-cyan"
        />

        {/* Status filter */}
        <div className="flex gap-1" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={statusParam === f.value}
              data-testid={`status-filter-${f.value || 'all'}`}
              onClick={() => setFilter('status', f.value)}
              className={`rounded-sm border px-2 py-0.5 font-mono text-mono-sm transition-colors ${
                statusParam === f.value
                  ? 'border-cyan/50 bg-cyan/10 text-cyan'
                  : 'border-b2 text-tm hover:border-b3 hover:text-tp'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Mood filter */}
        <div className="flex gap-0.5" role="group" aria-label="Filter by mood">
          <button
            type="button"
            aria-pressed={moodParam === ''}
            onClick={() => setFilter('mood', '')}
            className={`rounded-sm border px-2 py-0.5 font-mono text-mono-sm ${
              moodParam === '' ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-b2 text-tm'
            }`}
          >
            All
          </button>
          {MOOD_KEYS.map((m) => (
            <button
              key={m}
              type="button"
              aria-label={`Filter by ${MOOD_CFG[m].label}`}
              aria-pressed={moodParam === m}
              onClick={() => setFilter('mood', m)}
              className={`rounded-sm border px-1.5 py-0.5 transition-colors ${
                moodParam === m ? 'border-cyan/50 bg-cyan/10' : 'border-b2 hover:border-b3'
              }`}
            >
              {MOOD_CFG[m].emoji}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortParam}
          onChange={(e) => setFilter('sort', e.target.value)}
          aria-label="Sort posts"
          className="rounded-sm border border-b2 bg-bg px-2 py-1 font-mono text-mono-sm text-tp outline-none focus:border-cyan"
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
        </select>

        {/* View toggle */}
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => toggleView('list')}
            className={`rounded-sm border px-2 py-0.5 font-mono text-mono-sm ${
              view === 'list' ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-b2 text-tm'
            }`}
          >
            ☰
          </button>
          <button
            type="button"
            aria-label="Card view"
            aria-pressed={view === 'card'}
            onClick={() => toggleView('card')}
            className={`rounded-sm border px-2 py-0.5 font-mono text-mono-sm ${
              view === 'card' ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-b2 text-tm'
            }`}
          >
            ▦
          </button>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div
          data-testid="bulk-bar"
          className="mb-3 flex items-center gap-3 rounded-sm border border-cyan/30 bg-cyan/[0.06] px-4 py-2 font-mono text-mono-sm text-cyan"
        >
          <span>{selected.size} selected</span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-td hover:text-tm"
          >
            ✕ clear
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="py-12 text-center font-mono text-mono-sm text-tm" data-testid="loading">
          ⠋ loading...
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center font-mono text-mono-sm text-td" data-testid="empty">
          // no posts match filter
        </div>
      ) : view === 'list' ? (
        <div
          className="rounded-md border border-b2 bg-surf"
          data-testid="list-view"
          role="list"
          aria-label="Posts list"
        >
          {/* List header */}
          <div
            className="grid border-b border-b2 px-3 py-1.5 font-mono text-[10px] text-td"
            style={{ gridTemplateColumns: '28px 1fr 100px 36px 140px 130px 64px' }}
          >
            <input
              type="checkbox"
              checked={allSelected}
              aria-label="Select all"
              onChange={toggleSelectAll}
              className="cursor-pointer accent-cyan"
            />
            <span>Content</span>
            <span>Status</span>
            <span>Mood</span>
            <span>Tags</span>
            <span>Stats</span>
            <span>Actions</span>
          </div>
          {posts.map((p) => (
            <PostRow
              key={p.id}
              post={p}
              selected={selected.has(p.id)}
              onSelect={toggleSelect}
              onEdit={setEditPost}
              onDelete={setDeletePost}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="card-view">
          {posts.map((p) => (
            <PostCardMng key={p.id} post={p} onEdit={setEditPost} onDelete={setDeletePost} />
          ))}
        </div>
      )}

      {/* QuickEditModal */}
      <QuickEditModal
        post={editPost}
        onClose={() => setEditPost(null)}
        onSaved={() => showToast('Post saved', 'success')}
      />

      {/* DeleteConfirm */}
      <ConfirmDialog
        open={!!deletePost}
        title="// confirm.delete"
        message={
          deletePost
            ? `"${deletePost.content.replace(/<[^>]+>/g, '').slice(0, 80)}…"\n\nThis action cannot be undone.`
            : ''
        }
        confirmLabel="🗑 Delete"
        destructive
        pending={deleteMut.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeletePost(null)}
      />
    </div>
  );
}
