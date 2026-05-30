import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAdminPosts, useDeleteAdminPost } from '@/hooks/queries/use-admin-posts';
import { useToast } from '@/hooks/use-toast';
import { MOOD_CFG, MOOD_KEYS, type Mood } from '@/lib/mood-config';
import { PostRow } from '@/components/admin/manage-posts/PostRow';
import { PostCardMng } from '@/components/admin/manage-posts/PostCardMng';
import { QuickEditModal } from '@/components/admin/QuickEditModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { AdminPost, PostStatus } from '@/types/api';

type View = 'list' | 'card';
type Sort = 'latest' | 'oldest' | 'likes';

// T-417 design L579 — abbreviated status labels Pub/Draft/Arch
const STATUS_FILTERS: { label: string; value: '' | PostStatus; color: string }[] = [
  { label: 'All', value: '', color: '#00FFE5' },
  { label: 'Pub', value: 'PUBLISHED', color: '#9ECE6A' },
  { label: 'Draft', value: 'DRAFT', color: '#E0AF68' },
  { label: 'Arch', value: 'ARCHIVED', color: '#566176' },
];

const SORT_CHIPS: { value: Sort; label: string }[] = [
  { value: 'latest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'likes', label: 'Top' },
];

export default function ManagePostsPage() {
  const [params, setParams] = useSearchParams();
  const view = (params.get('view') as View | null) ?? 'list';
  const statusParam = (params.get('status') as PostStatus | null) ?? '';
  const moodParam = (params.get('mood') as Mood | null) ?? '';
  const sortParam = (params.get('sort') as Sort | null) ?? 'latest';

  const [q, setQ] = useState(params.get('q') ?? '');
  const [debouncedQ, setDebouncedQ] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editPost, setEditPost] = useState<AdminPost | null>(null);
  const [deletePost, setDeletePost] = useState<AdminPost | null>(null);

  const { showToast } = useToast();
  const deleteMut = useDeleteAdminPost();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(q), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  // Main filtered query
  const { data, isLoading } = useAdminPosts({
    status: statusParam || undefined,
    mood: moodParam || undefined,
    sort: sortParam,
    q: debouncedQ || undefined,
    limit: 20,
  });

  // T-417 design L499-504 — per-status counts for chip badges + Stats row.
  // 4 lightweight queries (limit=1, TanStack Query caches per status).
  const allCount = useAdminPosts({ limit: 1 });
  const pubCount = useAdminPosts({ status: 'PUBLISHED', limit: 1 });
  const draftCount = useAdminPosts({ status: 'DRAFT', limit: 1 });
  const archCount = useAdminPosts({ status: 'ARCHIVED', limit: 1 });

  const counts = useMemo(
    () => ({
      '': allCount.data?.total ?? 0,
      PUBLISHED: pubCount.data?.total ?? 0,
      DRAFT: draftCount.data?.total ?? 0,
      ARCHIVED: archCount.data?.total ?? 0,
    }),
    [allCount.data, pubCount.data, draftCount.data, archCount.data],
  );

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  function toggleView(v: View) {
    const next = new URLSearchParams(params);
    if (v === 'list') next.delete('view');
    else next.set('view', v);
    setParams(next, { replace: true });
  }

  function handleDelete() {
    if (!deletePost) return;
    deleteMut.mutate(deletePost.id, {
      onSuccess: () => {
        showToast(`Deleted post #${deletePost.id.slice(-6)}`, 'success');
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
  const totalUnfiltered = counts[''];
  const isFiltered = !!(debouncedQ || statusParam || moodParam);

  return (
    <>
      {/* T-417 design L528-548 — Fixed SubBar top 52px height 44px bg-elev */}
      <div
        data-testid="subbar"
        className="fixed left-0 right-0 top-[52px] z-[90] flex h-11 items-center gap-3 border-b border-b2 bg-elev px-6 font-mono text-[12px]"
      >
        <span className="text-tm">~/admin/posts</span>
        <span className="text-td">──</span>
        <span className="text-tp">{totalUnfiltered} total</span>
        <span className="text-td">·</span>
        <span style={{ color: '#9ECE6A' }}>{counts.PUBLISHED} published</span>
        <span className="text-td">·</span>
        <span style={{ color: '#E0AF68' }}>{counts.DRAFT} drafts</span>
        <div className="ml-auto flex gap-2">
          <Link
            to="/admin/create"
            aria-label="New Post"
            className="rounded-[5px] border-none bg-cyan px-3.5 py-1 font-mono text-[12px] font-semibold text-[#0A0E1A] shadow-[0_0_10px_rgba(0,255,229,0.3)] hover:shadow-[0_0_16px_rgba(0,255,229,0.4)]"
          >
            + New Post
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-[1400px] px-6 pb-10">
        {/* T-417 design L552-565 — Stats row 4-card */}
        <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4" data-testid="stats-row">
          {[
            { label: 'TOTAL POSTS', value: counts[''], color: '#00FFE5' },
            { label: 'PUBLISHED', value: counts.PUBLISHED, color: '#9ECE6A' },
            { label: 'DRAFTS', value: counts.DRAFT, color: '#E0AF68' },
            { label: 'ARCHIVED', value: counts.ARCHIVED, color: '#566176' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[7px] border border-b2 bg-elev px-4 py-3"
              style={{ borderLeft: `3px solid ${s.color}` }}
            >
              <div
                className="mb-1.5 font-mono text-[10px] text-tm"
                style={{ letterSpacing: '0.08em' }}
              >
                {s.label}
              </div>
              <div
                className="font-brand text-[22px] font-bold leading-none"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* T-417 design L568-606 — Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          {/* Search with ⌕ icon absolute + × clear */}
          <div className="relative min-w-[200px] max-w-[340px] flex-1">
            <span
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-tm"
            >
              ⌕
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="search by content, id, tag..."
              aria-label="Search posts"
              className={`w-full rounded-md border border-b2 bg-bg py-2 pl-8 font-mono text-[14px] text-tp outline-none placeholder:text-td focus:border-cyan ${q ? 'pr-8' : 'pr-3'}`}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent text-[14px] text-tm hover:text-tp"
              >
                ×
              </button>
            )}
          </div>

          {/* Status filter chips with count */}
          <div className="flex gap-1" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => {
              const active = statusParam === f.value;
              return (
                <button
                  key={f.value || 'all'}
                  type="button"
                  aria-pressed={active}
                  data-testid={`status-filter-${f.value || 'all'}`}
                  onClick={() => setFilter('status', f.value)}
                  className={`rounded-md border px-3 py-1 font-mono text-[11px] transition-colors ${
                    active
                      ? 'border-cyan/50 bg-cyan/[0.08] text-cyan'
                      : 'border-b2 bg-elev text-ts hover:border-b3 hover:text-tp'
                  }`}
                >
                  {f.label}{' '}
                  <span className={active ? 'text-cyan' : 'text-td'}>({counts[f.value]})</span>
                </button>
              );
            })}
          </div>

          {/* Mood filter (FE-extra — design không có nhưng giữ UX) */}
          <div className="flex items-center gap-1" role="group" aria-label="Filter by mood">
            <button
              type="button"
              aria-pressed={moodParam === ''}
              onClick={() => setFilter('mood', '')}
              className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
                moodParam === ''
                  ? 'border-cyan/50 bg-cyan/[0.08] text-cyan'
                  : 'border-b2 bg-elev text-ts'
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
                className={`rounded-md border px-1.5 py-1 transition-colors ${
                  moodParam === m ? 'border-cyan/50 bg-cyan/[0.08]' : 'border-b2 bg-elev'
                }`}
              >
                {MOOD_CFG[m].emoji}
              </button>
            ))}
          </div>

          {/* Sort chips */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[11px] text-td">sort:</span>
            {SORT_CHIPS.map((s) => {
              const active = sortParam === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={active}
                  data-testid={`sort-${s.value}`}
                  onClick={() => setFilter('sort', s.value)}
                  className={`rounded-md border px-3 py-1 font-mono text-[11px] transition-colors ${
                    active
                      ? 'border-cyan/50 bg-cyan/[0.08] text-cyan'
                      : 'border-b2 bg-elev text-ts hover:text-tp'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* View toggle 32×32 */}
          <div className="ml-auto flex gap-[3px]">
            {[
              { value: 'list' as const, icon: '☰', label: 'List view' },
              { value: 'card' as const, icon: '⊞', label: 'Card view' },
            ].map((v) => {
              const active = view === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  aria-label={v.label}
                  aria-pressed={active}
                  onClick={() => toggleView(v.value)}
                  className={`flex h-8 w-8 items-center justify-center rounded border text-[15px] transition-colors ${
                    active
                      ? 'border-cyan/50 bg-cyan/[0.08] text-cyan'
                      : 'border-b2 bg-elev text-tm hover:text-tp'
                  }`}
                >
                  {v.icon}
                </button>
              );
            })}
          </div>
        </div>

        {/* T-417 design L609-612 — Results count line */}
        <div className="mb-3 font-mono text-[11px] text-td" data-testid="results-count">
          // showing {posts.length} of {total} posts
          {isFiltered && <span className="text-tm"> · filtered</span>}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 text-center font-mono text-mono-sm text-tm" data-testid="loading">
            ⠋ loading...
          </div>
        ) : posts.length === 0 ? (
          // T-417 design L624-629 — empty state with ◎ big icon
          <div
            className="rounded-lg border border-b2 bg-elev py-12 text-center"
            data-testid="empty"
          >
            <div className="mb-2.5 font-mono text-[28px] text-b2">◎</div>
            <div className="font-mono text-[12px] text-tm">// no posts matching filters</div>
          </div>
        ) : view === 'list' ? (
          <div
            className="overflow-hidden rounded-lg border border-b2 bg-elev"
            data-testid="list-view"
            role="list"
            aria-label="Posts list"
          >
            {/* T-417 design L617-622 — Header bg-bg + 6-col fr grid (no checkbox) */}
            <div
              className="grid gap-3 border-b border-b2 bg-bg px-4 py-2.5"
              style={{ gridTemplateColumns: '3fr 1fr 1.2fr 1.4fr 1fr 1.5fr' }}
            >
              {['Post', 'Status', 'Mood', 'Tags', 'Stats', 'Actions'].map((h) => (
                <span
                  key={h}
                  className={`font-mono text-[11px] text-tm ${h === 'Actions' ? 'text-right' : ''}`}
                  style={{ letterSpacing: '0.05em' }}
                >
                  {h}
                </span>
              ))}
            </div>
            {posts.map((p) => (
              <PostRow key={p.id} post={p} onEdit={setEditPost} onDelete={setDeletePost} />
            ))}
          </div>
        ) : (
          // T-417 design L634-637 — Card view auto-fill minmax(320px, 1fr)
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
            data-testid="card-view"
          >
            {posts.map((p) => (
              <PostCardMng key={p.id} post={p} onEdit={setEditPost} onDelete={setDeletePost} />
            ))}
          </div>
        )}
      </div>

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
        confirmLabel="Confirm delete"
        destructive
        pending={deleteMut.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeletePost(null)}
      />
    </>
  );
}
