import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useSearch } from '@/hooks/queries/use-search';
import { BigSearchInput } from '@/components/search/BigSearchInput';
import { ResultCard } from '@/components/search/ResultCard';
import { FilterChip } from '@/components/shared/FilterChip';
import { TagPill } from '@/components/shared/TagPill';
import { MOOD_CFG, MOOD_KEYS } from '@/lib/mood-config';
import type { Mood } from '@/lib/mood-config';
import type { SearchType } from '@/types/api';

const TYPE_OPTIONS: { value: SearchType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'posts', label: 'Posts' },
  { value: 'files', label: 'Files' },
  { value: 'tags', label: 'Tags' },
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

  const { data, isLoading, isError, error } = useSearch({
    q: urlQ || undefined,
    type: urlType,
    mood: urlMood,
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

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-6">
      {/* Hero */}
      <section className="mb-6">
        <BigSearchInput value={input} onChange={setInput} autoFocus />
        <div className="mx-auto mt-4 flex max-w-[720px] flex-wrap items-center gap-2">
          <span className="font-mono text-mono-xs text-td">type:</span>
          {TYPE_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              active={urlType === opt.value}
              onClick={() => setType(opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
          <span className="ml-3 font-mono text-mono-xs text-td">mood:</span>
          {MOOD_KEYS.slice(0, 5).map((m) => (
            <FilterChip
              key={m}
              active={urlMood === m}
              onClick={() => setMood(urlMood === m ? null : m)}
              aria-label={`Mood ${MOOD_CFG[m].label}`}
            >
              {MOOD_CFG[m].emoji}
            </FilterChip>
          ))}
        </div>
      </section>

      {/* Layout */}
      <div className="flex gap-5">
        <main className="min-w-0 flex-1">
          {isLoading && (
            <div className="py-12 text-center font-mono text-mono-xs text-tm">⠋ searching...</div>
          )}
          {isThrottled && (
            <div className="rounded-md border border-yel/40 bg-yel/[0.08] p-3 font-mono text-mono-xs text-yel">
              // too many searches · please retry shortly
            </div>
          )}
          {isError && !isThrottled && (
            <div className="rounded-md border border-red/40 bg-red/[0.08] p-3 font-mono text-mono-xs text-red">
              // search failed · try again
            </div>
          )}
          {data &&
            urlQ &&
            data.posts.items.length === 0 &&
            data.tags.length === 0 &&
            data.files.length === 0 && (
              <div className="py-16 text-center font-mono">
                <div className="mb-3 text-5xl opacity-30">⌕</div>
                <div className="text-tm">// no results for "{urlQ}" — try different keywords</div>
              </div>
            )}

          {/* Posts results */}
          {data && data.posts.items.length > 0 && (
            <section className="mb-4">
              <div className="mb-2 font-mono text-mono-xs text-tm">
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
              <div className="mb-2 font-mono text-mono-xs text-tm">// tags</div>
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
              <div className="mb-2 font-mono text-mono-xs text-tm">// files</div>
              <div className="space-y-1">
                {data.files.map((f) => (
                  <Link
                    key={f.id}
                    to={`/post/${f.postId}`}
                    className="flex items-center gap-2 rounded-sm border border-b2 bg-surf px-3 py-1.5 font-mono text-mono-xs text-tp no-underline hover:border-cyan/40"
                  >
                    <span className="rounded-sm border border-b2 bg-elev px-1.5 py-0.5 text-mono-xs text-tm">
                      {f.type}
                    </span>
                    {f.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="hidden w-[280px] shrink-0 space-y-3 lg:block" aria-label="Search sidebar">
          <StatBox label="Total posts" value={data?.stats.totalPosts ?? 0} color="cyan" />
          <StatBox label="With images" value={data?.stats.withImages ?? 0} color="pur" />
          <StatBox label="With files" value={data?.stats.withFiles ?? 0} color="red" />
          <StatBox label="Saved" value={data?.stats.savedCount ?? 0} color="yel" />
        </aside>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-md border border-b2 bg-surf p-2.5"
      style={{ borderLeft: `3px solid var(--${color})` }}
    >
      <div className="font-mono text-mono-xs uppercase tracking-wider text-tm">{label}</div>
      <div className={`mt-0.5 font-brand text-xl font-bold text-${color}`}>{value}</div>
    </div>
  );
}
