import { useMemo, useState } from 'react';
import { ApiError } from '@/services/api/client';
import { useTags } from '@/hooks/queries/use-tags';
import { useCreateTag, useDeleteTag, useUpdateTag } from '@/hooks/mutations/use-tag-crud';
import { useAuth } from '@/hooks/use-auth';
import { TagCard } from '@/components/tags/TagCard';
import { TagModal } from '@/components/tags/TagModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SegmentedToggle } from '@/components/shared/SegmentedToggle';
import type { CreateTagPayload, Tag, TagSort, TagWithStats } from '@/types/api';

type ViewMode = 'grid' | 'list';

const SORT_OPTIONS: { value: TagSort; label: string }[] = [
  { value: 'posts', label: 'Posts' },
  { value: 'name', label: 'Name' },
  { value: 'recent', label: 'Recent' },
];

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', year: 'numeric' });
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

  const stats = useMemo(() => {
    const tagged = items.reduce((acc, t) => acc + t.postCount, 0);
    const most = [...items].sort((a, b) => b.postCount - a.postCount)[0];
    const recent = [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
    return {
      total: items.length,
      tagged,
      most: most ? most.name : '—',
      recent: recent ? formatMonth(recent.createdAt) : '—',
    };
  }, [items]);

  const maxCount = useMemo(() => items.reduce((m, t) => Math.max(m, t.postCount), 0), [items]);

  function handleSubmitModal(body: CreateTagPayload) {
    setModalError(null);
    const onError = (err: Error) => {
      let msg = err.message;
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_TAG' || err.status === 409) {
          msg = `Tag '${body.name}' đã tồn tại`;
        } else if (err.status === 400) {
          msg = 'Invalid input · check fields';
        }
      }
      setModalError(msg);
    };
    if (modal?.variant === 'create') {
      createMut.mutate(body, {
        onSuccess: () => setModal(null),
        onError,
      });
    } else if (modal?.variant === 'edit' && modal.initial) {
      updateMut.mutate(
        { id: modal.initial.id, body },
        {
          onSuccess: () => setModal(null),
          onError,
        },
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
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-4 font-mono text-mono-sm text-tm">// tags.all</div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBox label="TOTAL TAGS" value={String(stats.total)} color="cyan" />
        <StatBox label="TAGGED POSTS" value={String(stats.tagged)} color="pur" />
        <StatBox label="MOST USED" value={stats.most} color="red" />
        <StatBox label="RECENTLY ADDED" value={stats.recent} color="yel" />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label="Search tags"
          placeholder="❯ search tags..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-xs rounded-sm border border-b2 bg-bg px-3 py-1.5 font-mono text-mono-sm text-tp outline-none placeholder:text-td focus:border-cyan focus:shadow-glow-cyan-sm md:flex-1"
        />
        <SortDropdown sort={sort} onChange={setSort} />
        <SegmentedToggle<ViewMode>
          value={view}
          options={[
            { value: 'grid', label: 'Grid', icon: '▦' },
            { value: 'list', label: 'List', icon: '☰' },
          ]}
          onChange={setView}
          ariaLabel="View mode"
        />
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setModal({ variant: 'create' });
            }}
            className="ml-auto rounded-sm border border-cyan/50 bg-cyan/10 px-3 py-1.5 font-mono text-mono-sm text-cyan hover:bg-cyan/20"
          >
            + New Tag
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="py-12 text-center font-mono text-mono text-tm">⠋ loading tags...</div>
      )}
      {isError && (
        <div className="py-12 text-center font-mono text-mono text-red">// failed to load tags</div>
      )}
      {data && items.length === 0 && (
        <div className="py-16 text-center font-mono">
          <div className="mb-3 text-5xl opacity-30">#</div>
          <div className="text-tm">// no tags{q ? ` matching "${q}"` : ''}</div>
        </div>
      )}

      {items.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        </div>
      )}

      {items.length > 0 && view === 'list' && (
        <div className="flex flex-col gap-1.5">
          {items.map((t) => (
            <TagCard
              key={t.id}
              tag={t}
              maxCount={maxCount}
              variant="list"
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
        </div>
      )}

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
        confirmLabel={forceDelete ? 'Force Delete' : 'Delete'}
        pending={deleteMut.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmTag(null);
          setForceDelete(false);
        }}
      />
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className={`rounded-md border border-b2 bg-surf p-3 text-${color}`}
      style={{ borderLeft: `3px solid var(--${color})` }}
    >
      <div className="font-mono text-mono-sm uppercase tracking-wider text-tm">{label}</div>
      <div className="mt-1 font-brand text-display text-tp">{value}</div>
    </div>
  );
}

function SortDropdown({ sort, onChange }: { sort: TagSort; onChange: (s: TagSort) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Sort tags"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="rounded-sm border border-b2 bg-elev px-3 py-1.5 font-mono text-mono-sm text-tm hover:text-tp"
      >
        sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label} ▾
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-10 mt-1 min-w-[120px] rounded-sm border border-b2 bg-elev py-1 shadow-lg"
        >
          {SORT_OPTIONS.map((opt) => (
            <li key={opt.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={sort === opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-1.5 text-left font-mono text-mono-sm hover:bg-cyan/10 ${
                  sort === opt.value ? 'text-cyan' : 'text-ts'
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
