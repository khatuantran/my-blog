import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@/hooks/queries/use-search';
import { useTags } from '@/hooks/queries/use-tags';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { listPosts } from '@/services/api/posts';
import { qk } from '@/lib/query-keys';
import { BigSearchInput } from '@/components/search/BigSearchInput';
import { ResultCard } from '@/components/search/ResultCard';
import { FilterChip } from '@/components/shared/FilterChip';
import { TagPill } from '@/components/shared/TagPill';
import { MOOD_CFG, MOOD_KEYS } from '@/lib/mood-config';
import type { Mood } from '@/lib/mood-config';
import type { SearchType } from '@/types/api';

const TYPE_CHIPS: { value: SearchType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'saved', label: 'Saved' },
  { value: 'files', label: 'Files' },
];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const urlQ = params.get('q') ?? '';
  const urlType = (params.get('type') as SearchType | null) ?? 'all';
  const urlMood = (params.get('mood') as Mood | null) ?? undefined;
  const [input, setInput] = useState(urlQ);

  // Debounce input → URL update 250ms
  useEffect(() => {
    if (input === urlQ) return;
    const id = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (input) next.set('q', input);
      else next.delete('q');
      setParams(next, { replace: true });
    }, 250);
    return () => window.clearTimeout(id);
  }, [input, urlQ, params, setParams]);

  // SEO noindex on mount
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const isEmpty = urlQ === '' && urlType === 'all' && !urlMood;
  const isFiltering = !isEmpty;

  const { data, isLoading, isError, error } = useSearch({
    q: urlQ || undefined,
    type: urlType,
    mood: urlMood,
  });

  const { items: recent, add: addRecent, clear: clearRecent } = useRecentSearches();
  useEffect(() => {
    if (urlQ && data && (data.posts.total > 0 || data.tags.length > 0 || data.files.length > 0)) {
      addRecent(urlQ);
    }
  }, [urlQ, data, addRecent]);

  // Empty-state data (only fetch khi isEmpty)
  const { data: tagsData } = useTags({});
  const { data: browsePostsData } = useQuery({
    queryKey: qk.posts.list({ limit: 10 }),
    queryFn: () => listPosts({ limit: 10 }),
    enabled: isEmpty,
  });

  const isThrottled = isError && (error as { status?: number } | null)?.status === 429;

  function setType(t: SearchType) {
    const next = new URLSearchParams(params);
    if (t === 'all') next.delete('type');
    else next.set('type', t);
    setParams(next, { replace: true });
  }
  function setMood(m: Mood | null) {
    const next = new URLSearchParams(params);
    if (m) next.set('mood', m);
    else next.delete('mood');
    setParams(next, { replace: true });
  }
  function resetFilters() {
    const next = new URLSearchParams(params);
    next.delete('type');
    next.delete('mood');
    setParams(next, { replace: true });
  }
  function clearQuery() {
    setInput('');
    const next = new URLSearchParams(params);
    next.delete('q');
    setParams(next, { replace: true });
  }
  function setQueryFromRecent(q: string) {
    setInput(q);
    const next = new URLSearchParams(params);
    next.set('q', q);
    setParams(next, { replace: true });
  }

  const hasFilterActive = urlType !== 'all' || !!urlMood;
  const hasResults =
    !!data && (data.posts.items.length > 0 || data.tags.length > 0 || data.files.length > 0);
  const showNoResults = isFiltering && !isLoading && !isError && data && !hasResults;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-6">
      {/* Hero */}
      <section className="mb-6">
        <BigSearchInput value={input} onChange={setInput} autoFocus />

        {/* Filter row */}
        <div
          data-testid="search-filter-row"
          className="mx-auto mt-4 flex max-w-[720px] flex-wrap items-center gap-2"
        >
          {TYPE_CHIPS.map((opt) => (
            <FilterChip
              key={opt.value}
              active={urlType === opt.value}
              onClick={() => setType(opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-b2" />
          {MOOD_KEYS.map((m) => {
            const cfg = MOOD_CFG[m];
            const active = urlMood === m;
            return (
              <button
                key={m}
                type="button"
                data-testid={`mood-btn-${m}`}
                onClick={() => setMood(active ? null : m)}
                aria-label={`Mood ${cfg.label}`}
                aria-pressed={active}
                className="flex h-7 w-[30px] items-center justify-center rounded-sm border transition-all"
                style={
                  active
                    ? {
                        borderColor: cfg.color,
                        background: `${cfg.color}1A`,
                        boxShadow: `0 0 8px ${cfg.color}66`,
                      }
                    : { borderColor: 'var(--b2)', background: 'var(--surf)' }
                }
              >
                <span className="text-[15px] leading-none">{cfg.emoji}</span>
              </button>
            );
          })}
          {hasFilterActive && (
            <button
              type="button"
              data-testid="search-reset-filters"
              onClick={resetFilters}
              className="ml-1 font-mono text-mono-sm text-red hover:text-red/70"
              aria-label="Reset filters"
            >
              × reset
            </button>
          )}
        </div>
      </section>

      {/* Empty state (q='' + no filter) — 3 sections */}
      {isEmpty && (
        <div data-testid="search-empty-state" className="space-y-6">
          {/* recent.searches */}
          <section data-testid="empty-recent-searches">
            <div className="mb-2 flex items-center justify-between font-mono text-mono-sm text-tm">
              <span>// recent.searches</span>
              {recent.length > 0 && (
                <button
                  type="button"
                  data-testid="empty-recent-clear"
                  onClick={clearRecent}
                  className="text-td hover:text-red"
                  aria-label="Clear recent searches"
                >
                  clear
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="font-mono text-mono-sm italic text-td">// no recent searches</div>
            ) : (
              <ul className="space-y-1">
                {recent.slice(0, 5).map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => setQueryFromRecent(q)}
                      className="block w-full truncate text-left font-mono text-mono-sm text-ts hover:text-cyan"
                    >
                      <span className="text-td">• </span>
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* browse.tags */}
          <section data-testid="empty-browse-tags">
            <div className="mb-2 font-mono text-mono-sm text-tm">// browse.tags</div>
            {tagsData && tagsData.items.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tagsData.items.map((t) => (
                  <Link
                    key={t.id}
                    to={`/?tag=${encodeURIComponent(t.name.replace(/^#/, ''))}`}
                    className="no-underline"
                  >
                    <TagPill name={t.name} color={t.color} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="font-mono text-mono-sm italic text-td">// no tags yet</div>
            )}
          </section>

          {/* all.posts preview */}
          <section data-testid="empty-all-posts">
            <div className="mb-2 font-mono text-mono-sm text-tm">
              // all.posts {browsePostsData?.total ?? 0} total
            </div>
            {browsePostsData && browsePostsData.items.length > 0 ? (
              <div className="space-y-2">
                {browsePostsData.items.map((p) => (
                  <ResultCard key={p.id} post={p} />
                ))}
              </div>
            ) : (
              <div className="font-mono text-mono-sm italic text-td">// no posts yet</div>
            )}
          </section>
        </div>
      )}

      {/* Results / loading / error state */}
      {!isEmpty && (
        <div className="flex gap-5">
          <main className="min-w-0 flex-1">
            {isLoading && (
              <div className="py-12 text-center font-mono text-mono-sm text-tm">⠋ searching...</div>
            )}
            {isThrottled && (
              <div className="rounded-md border border-yel/40 bg-yel/[0.08] p-3 font-mono text-mono-sm text-yel">
                // too many searches · please retry shortly
              </div>
            )}
            {isError && !isThrottled && (
              <div className="rounded-md border border-red/40 bg-red/[0.08] p-3 font-mono text-mono-sm text-red">
                // search failed · try again
              </div>
            )}

            {/* No-results state */}
            {showNoResults && (
              <div data-testid="search-no-results" className="py-12 text-center font-mono">
                <div className="mb-3 text-[32px] text-td opacity-60">◎</div>
                <div className="mb-1 text-sm text-ts">
                  // no results for &quot;{urlQ || `[${urlType}]`}&quot;
                </div>
                <div className="mb-4 text-mono-sm text-td">
                  $ grep -r &quot;{urlQ || urlType}&quot; ./posts --no-results
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    data-testid="no-results-clear"
                    onClick={clearQuery}
                    className="font-mono text-mono-sm text-cyan hover:text-tp"
                  >
                    ← clear search
                  </button>
                  {recent.slice(0, 3).map((q) => (
                    <button
                      key={q}
                      type="button"
                      data-testid={`no-results-try-${q}`}
                      onClick={() => setQueryFromRecent(q)}
                      className="font-mono text-mono-sm text-td hover:text-cyan"
                    >
                      try &quot;{q}&quot;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Posts results */}
            {data && data.posts.items.length > 0 && (
              <section className="mb-4">
                <div className="mb-2 font-mono text-mono-sm text-tm">
                  // results · {data.posts.total} match{data.posts.total === 1 ? '' : 'es'}
                </div>
                <div className="space-y-2">
                  {data.posts.items.map((p) => (
                    <ResultCard key={p.id} post={p} query={urlQ} />
                  ))}
                </div>
              </section>
            )}

            {/* Tags results */}
            {data && data.tags.length > 0 && (
              <section className="mb-4">
                <div className="mb-2 font-mono text-mono-sm text-tm">// tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {data.tags.map((t) => (
                    <Link
                      key={t.id}
                      to={`/?tag=${encodeURIComponent(t.name.replace(/^#/, ''))}`}
                      className="no-underline"
                    >
                      <TagPill name={t.name} color={t.color} />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Files results */}
            {data && data.files.length > 0 && (
              <section className="mb-4">
                <div className="mb-2 font-mono text-mono-sm text-tm">// files</div>
                <div className="space-y-1">
                  {data.files.map((f) => (
                    <Link
                      key={f.id}
                      to={`/post/${f.postId}`}
                      className="flex items-center gap-2 rounded-sm border border-b2 bg-surf px-3 py-1.5 font-mono text-mono-sm text-tp no-underline hover:border-cyan/40"
                    >
                      <span className="rounded-sm border border-b2 bg-elev px-1.5 py-0.5 text-mono-sm text-tm">
                        {f.type}
                      </span>
                      {f.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside
            className="hidden w-[280px] shrink-0 space-y-3 lg:block"
            aria-label="Search sidebar"
          >
            <StatBox label="Total posts" value={data?.stats.totalPosts ?? 0} color="cyan" />
            <StatBox label="With images" value={data?.stats.withImages ?? 0} color="pur" />
            <StatBox label="With files" value={data?.stats.withFiles ?? 0} color="red" />
            <StatBox label="Saved" value={data?.stats.savedCount ?? 0} color="yel" />
          </aside>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-md border border-b2 bg-surf p-2.5"
      style={{ borderLeft: `3px solid var(--${color})` }}
    >
      <div className="font-mono text-mono-sm uppercase tracking-wider text-tm">{label}</div>
      <div className={`mt-0.5 font-brand text-display text-${color}`}>{value}</div>
    </div>
  );
}
