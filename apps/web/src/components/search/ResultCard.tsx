import { Link } from 'react-router';
import type { Post } from '@/types/api';
import { MoodBadge } from '@/components/shared/MoodBadge';

type Props = {
  post: Post;
  query?: string;
};

function highlight(text: string, q: string): React.ReactNode[] {
  if (!q || q.length === 0) return [text];
  // Escape regex special chars in query
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-cyan/30 px-0.5 text-cyan">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function ResultCard({ post, query }: Props) {
  const preview = post.content.slice(0, 240);
  return (
    <Link
      to={`/post/${post.id}`}
      data-testid={`result-card-${post.id}`}
      className="block rounded-md border border-b2 bg-surf p-4 no-underline transition-colors hover:border-cyan/40"
    >
      <div className="mb-2 flex items-center gap-2 font-mono text-mono-xs text-tm">
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
