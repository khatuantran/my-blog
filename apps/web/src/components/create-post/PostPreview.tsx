import { Avatar } from '@/components/shared/Avatar';
import { MoodBadge } from '@/components/shared/MoodBadge';
import { PostContent } from '@/components/post/PostContent';
import { TagPill } from '@/components/shared/TagPill';
import { ImgSlot } from '@/components/post/ImgSlot';
import { ReactionIcon } from '@/components/feed/ReactionIcon';
import { REACTION_CONFIG } from '@/lib/reaction-config';
import type { Mood } from '@/lib/mood-config';
import type { TagDraft } from './TagPickerDropdown';

type Props = {
  mood: Mood;
  content: string;
  tags: TagDraft[];
  imageCount: number;
};

// Chiều cao tối đa vùng content trong preview — clamp bằng CSS thay vì cắt chuỗi (BUG-019:
// content là HTML, slice theo ký tự sẽ cắt giữa thẻ → vỡ render).
const CONTENT_PREVIEW_MAX_H = 320;

// Mini PostCard preview cho CreatePostPage right pane.
// Match design-file/MyBlog Create Post.html:75-132.
export function PostPreview({ mood, content, tags, imageCount }: Props) {
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
          <span className="font-mono text-mono-sm text-tm">just now</span>
        </div>
        <MoodBadge mood={mood} />
      </div>

      {/* Content — render full HTML, clamp chiều cao bằng CSS (BUG-019: không cắt chuỗi
          HTML giữa thẻ). */}
      {content ? (
        <div
          className="mb-3 overflow-hidden"
          style={{ maxHeight: CONTENT_PREVIEW_MAX_H }}
          data-testid="preview-content-clamp"
        >
          <PostContent content={content} variant="card" />
        </div>
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

      {/* Actions row (placeholder, mirror Feed/Detail action bar style — design-file 1:1).
          Tĩnh: React · 💬 · Share, count 0 cho post mới. */}
      <div className="flex items-center gap-0.5 border-t border-b1 pt-2 font-mono text-mono-md text-tm">
        <span className="flex items-center gap-1 px-2.5 py-1">
          <span aria-hidden className="inline-flex">
            <ReactionIcon r={REACTION_CONFIG.LIKE} size={16} />
          </span>
          <span>React</span>
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1">
          <span className="text-sm">💬</span>
          <span>0</span>
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1">
          <span>↗</span>
          <span>Share</span>
        </span>
      </div>
    </div>
  );
}
