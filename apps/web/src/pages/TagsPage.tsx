import { useMemo, useState } from 'react';
import { ApiError } from '@/services/api/client';
import { useTags } from '@/hooks/queries/use-tags';
import { useCreateTag, useDeleteTag, useUpdateTag } from '@/hooks/mutations/use-tag-crud';
import { useAuth } from '@/hooks/use-auth';
import { TagCard } from '@/components/tags/TagCard';
import { TagModal } from '@/components/tags/TagModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PencilIcon, TrashIcon } from '@/components/shared/cyber-icons';
import type { CreateTagPayload, Tag, TagSort, TagWithStats } from '@/types/api';

type ViewMode = 'grid' | 'list';

// T-420 design L505-507 — Sort chips. BE values 'posts|name|recent' giữ nguyên,
// chỉ UI label đổi theo design (Most used / A→Z / Newest).
const SORT_CHIPS: { value: TagSort; label: string }[] = [
  { value: 'posts', label: 'Most used' },
  { value: 'name', label: 'A→Z' },
  { value: 'recent', label: 'Newest' },
];

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function TagsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [sort, setSort] = useState<TagSort>('posts');
  const [q, setQ] = useState('');
  const [view, setView] = useState<ViewMode>('grid');

  const { data, isLoading, isError } = useTags({ sort, q: q || undefined, limit: 100 });
  const items = useMemo(() => data?.items ?? [], [data]);

  // Modal state
  const [modal, setModal] = useState<{ variant: 'create' | 'edit'; initial?: Tag | null } | null>(
    null,
  );
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete confirm state
  const [confirmTag, setConfirmTag] = useState<TagWithStats | null>(null);
  const [forceDelete, setForceDelete] = useState(false);

  const createMut = useCreateTag();
  const updateMut = useUpdateTag();
  const deleteMut = useDeleteTag();

  // T-420 design L479-482 — Stats 4-card content (LEAST USED thay RECENTLY ADDED)
  const stats = useMemo(() => {
    const totalPosts = items.reduce((s, t) => s + t.postCount, 0);
    const sorted = [...items].sort((a, b) => b.postCount - a.postCount);
    const most = sorted[0];
    const least = sorted[sorted.length - 1];
    return {
      totalTags: items.length,
      totalPosts,
      most: most ? most.name : '—',
      least: least ? least.name : '—',
    };
  }, [items]);

  const maxCount = useMemo(() => items.reduce((m, t) => Math.max(m, t.postCount), 0), [items]);

  function openCreate() {
    setModalError(null);
    setModal({ variant: 'create' });
  }

  function handleSubmitModal(body: CreateTagPayload) {
    setModalError(null);
    const onError = (err: Error) => {
      let msg = err.message;
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_TAG' || err.status === 409) {
          msg = `Tag '${body.name}' đã tồn tại`;
        } else if (err.status === 400) {
          // BE class-validator returns message as string[] (e.g. `["color must be a hexadecimal color"]`).
          // ApiError stores it raw — coerce to readable string + show actual cause để user fix chính xác.
          const raw = err.message;
          const detail = Array.isArray(raw)
            ? raw.join(', ')
            : typeof raw === 'string'
              ? raw
              : 'check fields';
          msg = `Invalid input · ${detail}`;
        } else if (err.status === 403) {
          msg = 'Forbidden — only admin can create/edit tags';
        }
      }
      setModalError(msg);
    };
    if (modal?.variant === 'create') {
      createMut.mutate(body, { onSuccess: () => setModal(null), onError });
    } else if (modal?.variant === 'edit' && modal.initial) {
      updateMut.mutate(
        { id: modal.initial.id, body },
        { onSuccess: () => setModal(null), onError },
      );
    }
  }

  function handleConfirmDelete() {
    if (!confirmTag) return;
    deleteMut.mutate(
      { id: confirmTag.id, force: forceDelete },
      {
        onSuccess: () => {
          setConfirmTag(null);
          setForceDelete(false);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.code === 'TAG_IN_USE') {
            setForceDelete(true);
          }
        },
      },
    );
  }

  return (
    <>
      {/* T-420 design L460-472 — Fixed SubBar top 52px height 44px bg-elev */}
      <div
        data-testid="subbar"
        className="fixed left-0 right-0 top-[52px] z-[90] flex h-11 items-center gap-3 border-b border-b2 bg-elev px-6 font-mono text-[13px]"
      >
        <span className="text-ts">~/tags</span>
        <span className="text-tm">──</span>
        <span className="font-semibold text-tp">{stats.totalTags} tags</span>
        <span className="text-tm">·</span>
        <span className="text-tm">{stats.totalPosts} total posts</span>
        {isAdmin && (
          <div className="ml-auto">
            <button
              type="button"
              onClick={openCreate}
              className="rounded-[5px] border-none bg-cyan px-4 py-1.5 font-mono text-[13px] font-semibold text-[#0A0E1A] shadow-[0_0_10px_rgba(0,255,229,0.3)] hover:shadow-[0_0_16px_rgba(0,255,229,0.4)]"
            >
              + New Tag
            </button>
          </div>
        )}
      </div>

      <div className="mx-auto mt-24 max-w-[1400px] px-6 pb-10">
        {/* Stats row 4-card */}
        <div className="mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-4" data-testid="stats-row">
          {[
            { label: 'TOTAL TAGS', value: String(stats.totalTags), color: '#00FFE5' },
            { label: 'TOTAL POSTS', value: String(stats.totalPosts), color: '#BB9AF7' },
            { label: 'MOST USED', value: stats.most, color: '#9ECE6A' },
            { label: 'LEAST USED', value: stats.least, color: '#E0AF68' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[7px] border border-b2 bg-elev px-4 py-3"
              style={{ borderLeft: `3px solid ${s.color}` }}
            >
              <div
                className="mb-1.5 font-mono text-[11px] text-ts"
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

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          {/* Search ⌕ absolute icon + × clear */}
          <div className="relative min-w-[200px] max-w-[360px] flex-1">
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
              placeholder="filter tags..."
              aria-label="Search tags"
              className={`h-9 w-full rounded-md border border-b2 bg-bg pl-9 font-mono text-[14px] text-tp outline-none placeholder:text-tm focus:border-cyan focus:shadow-[0_0_10px_rgba(0,255,229,0.15)] ${q ? 'pr-8' : 'pr-3'}`}
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

          {/* Sort 3 chips */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[11px] text-tm">sort:</span>
            {SORT_CHIPS.map((s) => {
              const active = sort === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={active}
                  data-testid={`sort-${s.value}`}
                  onClick={() => setSort(s.value)}
                  className={`inline-flex h-9 items-center rounded-md border px-3.5 font-mono text-[12px] transition-colors ${
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

          {/* View toggle 30×30 simple */}
          <div className="ml-auto flex items-center gap-[3px]">
            {[
              { value: 'grid' as const, icon: '⊞', label: 'Grid view' },
              { value: 'list' as const, icon: '☰', label: 'List view' },
            ].map((v) => {
              const active = view === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  aria-label={v.label}
                  aria-pressed={active}
                  onClick={() => setView(v.value)}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-[16px] transition-colors ${
                    active
                      ? 'border-cyan/50 bg-cyan/[0.08] text-cyan'
                      : 'border-b2 bg-elev text-ts hover:text-tp'
                  }`}
                >
                  {v.icon}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count line */}
        <div className="mb-3 font-mono text-[12px] text-tm" data-testid="results-count">
          // showing {items.length} of {items.length} tags
          {q && <span className="text-ts"> · filter: &quot;{q}&quot;</span>}
        </div>

        {/* Content states */}
        {isLoading && (
          <div className="py-12 text-center font-mono text-mono-sm text-tm">⠋ loading tags...</div>
        )}
        {isError && (
          <div className="py-12 text-center font-mono text-mono-sm text-red">
            // failed to load tags
          </div>
        )}
        {data && items.length === 0 && (
          <div
            className="rounded-lg border border-b2 bg-elev py-12 text-center"
            data-testid="empty"
          >
            <div className="mb-2.5 font-mono text-[32px] text-b2">◎</div>
            <div className="font-mono text-[12px] text-tm">
              // no tags{q ? ` matching "${q}"` : ''}
            </div>
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="mt-3 rounded-[5px] border border-cyan/30 bg-cyan/[0.08] px-3.5 py-1.5 font-mono text-[12px] text-cyan hover:bg-cyan/15"
              >
                clear filter
              </button>
            )}
          </div>
        )}

        {/* Grid view */}
        {items.length > 0 && view === 'grid' && (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
            data-testid="grid-view"
          >
            {items.map((t, i) => (
              <TagCard
                key={t.id}
                tag={t}
                maxCount={maxCount}
                index={i}
                isAdmin={isAdmin}
                onEdit={(tag) => {
                  setModalError(null);
                  setModal({ variant: 'edit', initial: tag });
                }}
                onDelete={(tag) => {
                  setForceDelete(false);
                  setConfirmTag(tag);
                }}
              />
            ))}
            {/* Dashed-border "+ create new tag" placeholder (admin only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={openCreate}
                aria-label="Create new tag"
                data-testid="create-tag-placeholder"
                className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-b2 bg-transparent transition-colors hover:border-cyan/40 hover:bg-cyan/[0.03]"
              >
                <span className="text-[24px] text-b2">+</span>
                <span className="font-mono text-[12px] text-tm">create new tag</span>
              </button>
            )}
          </div>
        )}

        {/* List view — 5-col table per design L549-569 */}
        {items.length > 0 && view === 'list' && (
          <div
            className="overflow-hidden rounded-lg border border-b2 bg-elev"
            data-testid="list-view"
          >
            {/* Header */}
            <div
              className="grid gap-3 border-b border-b2 bg-bg px-4 py-2.5"
              style={{ gridTemplateColumns: '2fr 3fr 1fr 1fr 1fr' }}
            >
              {['Tag', 'Description', 'Posts', 'Created', 'Actions'].map((h) => (
                <span
                  key={h}
                  className="font-mono text-[12px] font-medium text-ts"
                  style={{ letterSpacing: '0.05em' }}
                >
                  {h}
                </span>
              ))}
            </div>
            {/* Rows */}
            {items.map((tag) => {
              const color = tag.color ?? '#00FFE5';
              return (
                <div
                  key={tag.id}
                  className="grid items-center gap-3 border-b border-b1 px-4 py-3 transition-colors last:border-b-0 hover:bg-bg/50"
                  style={{ gridTemplateColumns: '2fr 3fr 1fr 1fr 1fr' }}
                  data-testid={`tag-row-${tag.name}`}
                >
                  <span
                    className="font-mono text-[14px] font-semibold"
                    style={{ color, textShadow: `0 0 8px ${color}40` }}
                  >
                    {tag.name}
                  </span>
                  <span
                    className="truncate pr-3 text-[13px] text-tm"
                    title={tag.description ?? undefined}
                  >
                    {tag.description || <span className="italic text-td">—</span>}
                  </span>
                  <span className="font-mono text-[14px] font-semibold text-tp">
                    {tag.postCount}
                  </span>
                  <span className="font-mono text-[12px] text-tm">{formatDate(tag.createdAt)}</span>
                  {isAdmin && (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setModalError(null);
                          setModal({ variant: 'edit', initial: tag });
                        }}
                        aria-label={`Edit tag ${tag.name}`}
                        className="inline-flex items-center justify-center rounded border px-2 py-1 font-mono text-[12px] text-blu hover:bg-blu/10"
                        style={{ borderColor: 'rgba(125,207,255,0.25)' }}
                      >
                        <PencilIcon size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForceDelete(false);
                          setConfirmTag(tag);
                        }}
                        aria-label={`Delete tag ${tag.name}`}
                        className="inline-flex items-center justify-center rounded border px-2 py-1 font-mono text-[12px] text-red hover:bg-red/10"
                        style={{ borderColor: 'rgba(247,118,142,0.25)' }}
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TagModal
        open={modal !== null}
        variant={modal?.variant ?? 'create'}
        initial={modal?.initial ?? null}
        pending={createMut.isPending || updateMut.isPending}
        error={modalError}
        onSubmit={handleSubmitModal}
        onClose={() => {
          setModal(null);
          setModalError(null);
        }}
      />

      <ConfirmDialog
        open={confirmTag !== null}
        destructive
        title="// delete.tag"
        message={
          confirmTag
            ? forceDelete
              ? `Tag '${confirmTag.name}' đang được dùng bởi ${confirmTag.postCount} post(s). Force delete sẽ unlink khỏi tất cả posts.`
              : `Delete tag '${confirmTag.name}'?${
                  confirmTag.postCount > 0
                    ? ` (Tag đang được dùng bởi ${confirmTag.postCount} post(s))`
                    : ''
                }`
            : ''
        }
        confirmLabel={forceDelete ? 'Force Delete' : 'Confirm delete'}
        pending={deleteMut.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmTag(null);
          setForceDelete(false);
        }}
      />
    </>
  );
}
