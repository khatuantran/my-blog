import { Avatar } from '@/components/shared/Avatar';
import { MoodBadge } from '@/components/shared/MoodBadge';
import { PostContent } from '@/components/post/PostContent';
import { TagPill } from '@/components/shared/TagPill';
import { ImgSlot } from '@/components/post/ImgSlot';
import type { Mood } from '@/lib/mood-config';
import type { TagDraft } from './TagInput';

type Props = {
  mood: Mood;
  content: string;
  tags: TagDraft[];
  imageCount: number;
};

const CONTENT_PREVIEW_LIMIT = 300;

// Mini PostCard preview cho CreatePostPage right pane.
// Match design-file/MyBlog Create Post.html:75-132.
export function PostPreview({ mood, content, tags, imageCount }: Props) {
  const truncated = content.length > CONTENT_PREVIEW_LIMIT;
  const display = truncated ? content.slice(0, CONTENT_PREVIEW_LIMIT) : content;
  const visibleImages = Math.min(imageCount, 3);

  return (
    <div
      className="rounded-lg bg-surf p-4"
      style={{
        border: '1px solid rgba(0,255,229,.2)',
        boxShadow: '0 0 20px rgba(0,255,229,.05)',
      }}
      data-testid="post-preview"
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-2.5">
        <Avatar username="admin" size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-mono-sm font-semibold text-blu">~/admin</span>
            <span
              className="inline-flex items-center rounded-sm border border-ora/50 bg-ora/[0.06] font-mono text-mono-sm leading-none text-ora"
              style={{ padding: '1px 6px' }}
            >
              [ ADMIN ]
            </span>
          </div>
          <span className="font-mono text-mono-xs text-tm">just now</span>
        </div>
        <MoodBadge mood={mood} />
      </div>

      {/* Content */}
      {content ? (
        <>
          <PostContent content={display} variant="card" />
          {truncated && <div className="-mt-2 mb-3 font-mono text-mono-xs text-tm">...</div>}
        </>
      ) : (
        <div className="mb-3 font-mono text-mono italic text-td">
          // content preview will appear here...
        </div>
      )}

      {/* Image grid mini */}
      {imageCount > 0 && (
        <div
          className="mb-3 grid h-20 gap-[3px] overflow-hidden rounded-sm"
          style={{ gridTemplateColumns: `repeat(${visibleImages},1fr)` }}
        >
          {Array.from({ length: visibleImages }).map((_, i) => (
            <ImgSlot key={i} idx={i} />
          ))}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <TagPill key={t.name} name={t.name} color={t.color} />
          ))}
        </div>
      )}

      {/* Actions row (disabled placeholders) */}
      <div className="flex gap-0.5 border-t border-b1 pt-2 font-mono text-mono-sm text-td">
        {['♡ 0', '💬 0', '🏷', '↗'].map((a) => (
          <span key={a} className="px-2 py-1">
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}
