import { Link } from 'react-router';
import type { Post } from '@/types/api';
import { MOOD_CFG } from '@/lib/mood-config';
import { formatTimestamp } from '@/lib/format-date';

type Props = {
  post: Post;
  query?: string;
  index?: number;
};

function highlight(text: string, q: string): React.ReactNode[] {
  if (!q || q.length === 0) return [text];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-cyan/20 px-0.5 text-cyan">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function ResultCard({ post, query, index = 0 }: Props) {
  const preview = post.content.slice(0, 200);
  const idShort = post.id.slice(0, 6);
  const isAdmin = post.author.role === 'ADMIN';
  const mood = MOOD_CFG[post.mood];
  const ts = formatTimestamp(post.createdAt);
  const initial = (post.author.username?.[0] ?? '?').toUpperCase();
  return (
    <Link
      to={`/post/${post.id}`}
      data-testid={`result-card-${post.id}`}
      className="group relative block animate-fade-up overflow-hidden rounded-md border border-b2 bg-surf p-4 no-underline transition-colors hover:border-cyan/40"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      {/* Top accent line — hover reveal */}
      <span
        aria-hidden="true"
        data-testid="result-card-accent"
        className="pointer-events-none absolute left-0 right-0 top-0 h-px opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,255,229,0.3), transparent)',
        }}
      />
      {/* Post-id corner deco */}
      <span
        aria-hidden="true"
        data-testid="result-card-post-id"
        className="absolute right-3.5 top-2.5 font-mono text-[10px] text-b3"
      >
        #{idShort}
      </span>

      {/* Top row: avatar + ~/user + [ ADMIN ] + · + timestamp + mood (right) */}
      <div className="mb-2.5 flex flex-wrap items-center gap-2 pr-16">
        {/* Avatar 26×26 inline — design-file Search.html L250 */}
        <span
          aria-hidden="true"
          data-testid="result-card-avatar"
          className="inline-flex shrink-0 items-center justify-center rounded-full font-brand font-bold text-cyan"
          style={{
            width: 26,
            height: 26,
            fontSize: 12,
            border: '1.5px solid #00FFE5',
            background: 'linear-gradient(135deg,#00FFE520,#BB9AF720)',
          }}
        >
          {initial}
        </span>
        <span className="font-mono text-mono-md text-blu">~/{post.author.username}</span>
        {isAdmin && (
          <span
            data-testid="result-card-admin-badge"
            className="inline-flex items-center rounded-xs border border-ora/40 font-mono text-[10px] leading-none text-ora"
            style={{ padding: '0 4px' }}
          >
            [ ADMIN ]
          </span>
        )}
        <span className="font-mono text-mono-sm text-tm">·</span>
        <span data-testid="result-card-timestamp" className="font-mono text-mono-sm text-tm">
          {ts}
        </span>
        <span
          data-testid="result-card-mood"
          className="ml-auto inline-flex items-center gap-1 rounded-sm font-mono text-mono-sm whitespace-nowrap"
          style={{
            color: mood.color,
            background: `${mood.color}18`,
            border: `1px solid ${mood.color}50`,
            padding: '2px 8px',
          }}
        >
          <span aria-hidden="true">{mood.emoji}</span> {mood.label}
        </span>
      </div>

      {/* Content preview 15px line-clamp 2 */}
      <p className="mb-2.5 line-clamp-2 whitespace-pre-wrap text-body leading-[1.6] text-tp">
        {highlight(preview, query ?? '')}
        {post.content.length > 200 && '…'}
      </p>

      {/* Bottom row: tags + files badge + engagement stats (right) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {post.tags.map((t) => {
          const color = t.color ?? '#00FFE5';
          return (
            <span
              key={t.id}
              data-testid={`result-card-tag-${t.name}`}
              className="inline-block font-mono text-mono-sm"
              style={{
                color,
                background: `${color}15`,
                border: `1px solid ${color}40`,
                borderRadius: 3,
                padding: '1px 6px',
              }}
            >
              {highlight(t.name, query ?? '')}
            </span>
          );
        })}
        {post.files.length > 0 && (
          <span
            data-testid="result-card-files-badge"
            className="inline-flex items-center gap-1 font-mono text-mono-sm text-red"
            style={{
              background: 'rgba(247,118,142,.1)',
              border: '1px solid rgba(247,118,142,.3)',
              borderRadius: 3,
              padding: '1px 6px',
            }}
          >
            <span aria-hidden="true">📎</span>
            {post.files.length} file{post.files.length > 1 ? 's' : ''}
          </span>
        )}
        <span
          data-testid="result-card-stats"
          className="ml-auto flex items-center gap-2.5 font-mono text-mono-sm text-b3"
        >
          <span>♡ {post.counts.reactions}</span>
          <span>💬 {post.counts.comments}</span>
        </span>
      </div>
    </Link>
  );
}
