// PostCard — minimal stub cho T-060. T-061 sẽ implement đầy đủ
// (header + images + files + tags + actions + like/save mutations).

import { Link } from 'react-router';
import { MoodBadge } from '@/components/shared/MoodBadge';
import { PostContent } from '@/components/post/PostContent';
import type { Post } from '@/types/api';

type Props = {
  post: Post;
  delay?: number;
};

export function PostCard({ post, delay = 0 }: Props) {
  return (
    <article
      className="relative mb-3 overflow-hidden rounded-lg border border-b2 bg-surf p-4 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
      data-testid={`post-card-${post.id}`}
    >
      <span className="absolute right-3.5 top-2.5 font-mono text-mono-xs text-b2">
        #{post.id.slice(-6)}
      </span>
      <div className="mb-2 flex items-center justify-between">
        <Link to={`/post/${post.id}`} className="font-mono text-mono-sm text-blu hover:underline">
          ~/{post.author.username}
        </Link>
        <MoodBadge mood={post.mood} />
      </div>
      <PostContent content={post.content} />
      <div className="text-mono-xs font-mono text-td">
        ♡ {post.counts.likes} · 💬 {post.counts.comments} · 👁 {post.viewCount}
      </div>
    </article>
  );
}
