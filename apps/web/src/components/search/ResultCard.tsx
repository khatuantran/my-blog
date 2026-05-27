import { Link } from 'react-router';
import type { Post } from '@/types/api';
import { MoodBadge } from '@/components/shared/MoodBadge';

type Props = {
  post: Post;
  query?: string;
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

export function ResultCard({ post, query }: Props) {
  const preview = post.content.slice(0, 240);
  const idShort = post.id.slice(0, 6);
  return (
    <Link
      to={`/post/${post.id}`}
      data-testid={`result-card-${post.id}`}
      className="group relative block overflow-hidden rounded-md border border-b2 bg-surf p-4 no-underline transition-colors hover:border-cyan/40"
    >
      {/* Top accent line — hover reveal */}
      <span
        aria-hidden="true"
        data-testid="result-card-accent"
        className="pointer-events-none absolute left-0 right-0 top-0 h-px opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(125,207,255,0.3), transparent)',
        }}
      />
      {/* Post-id corner deco */}
      <span
        aria-hidden="true"
        data-testid="result-card-post-id"
        className="absolute right-3 top-3 font-mono text-[10px] text-td"
      >
        #{idShort}
      </span>

      <div className="mb-2 flex items-center gap-2 pr-16 font-mono text-mono-sm text-tm">
        <span className="text-blu">~/{post.author.username}</span>
        <span>·</span>
        <MoodBadge mood={post.mood} />
      </div>
      <div className="line-clamp-3 whitespace-pre-wrap text-sm text-tp">
        {highlight(preview, query ?? '')}
        {post.content.length > 240 && '…'}
      </div>
    </Link>
  );
}
