import { Avatar } from '@/components/shared/Avatar';
import { MoodBadge } from '@/components/shared/MoodBadge';
import { CollapsibleContent } from '@/components/post/CollapsibleContent';
import { TagPill } from '@/components/shared/TagPill';
import { ImgSlot } from '@/components/post/ImgSlot';
import { ReactionIcon } from '@/components/feed/ReactionIcon';
import { REACTION_CONFIG } from '@/lib/reaction-config';
import { getFileConfig, formatBytes } from '@/lib/file-config';
import type { Mood } from '@/lib/mood-config';
import type { TagDraft } from './TagPickerDropdown';

export type PreviewFile = { name: string; size: number };

type Props = {
  mood: Mood;
  content: string;
  tags: TagDraft[];
  imageCount: number;
  files?: PreviewFile[];
};

function fileExt(name: string): string {
  return name.includes('.') ? (name.split('.').pop() ?? '') : '';
}

// Mini PostCard preview cho CreatePostPage right pane.
// Match design-file/MyBlog Create Post.html:75-132.
export function PostPreview({ mood, content, tags, imageCount, files = [] }: Props) {
  const shown = Math.min(imageCount, 4); // grid collage tối đa 4 (design-file PostPreview L224-265)

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

      {/* Content — render full HTML (BUG-019: không cắt chuỗi HTML giữa thẻ) + collapse/expand
          khi dài (T-440 CollapsibleContent dùng chung Feed). */}
      {content ? (
        <CollapsibleContent content={content} variant="card" maxHeight={320} className="mb-3" />
      ) : (
        <div className="mb-3 font-mono text-mono italic text-td">
          // content preview will appear here...
        </div>
      )}

      {/* Image grid collage (design-file PostPreview): 1 full · 2 split · ≥3 trái full + phải
          stack (tối đa 4) · >4 overlay `+N` trên slot phải cuối. */}
      {imageCount === 1 && (
        <div className="mb-3 h-[140px] overflow-hidden rounded-[5px]">
          <ImgSlot idx={0} />
        </div>
      )}
      {imageCount === 2 && (
        <div className="mb-3 grid h-[110px] grid-cols-2 gap-[3px] overflow-hidden rounded-[5px]">
          <div className="overflow-hidden rounded">
            <ImgSlot idx={0} />
          </div>
          <div className="overflow-hidden rounded">
            <ImgSlot idx={1} />
          </div>
        </div>
      )}
      {imageCount >= 3 && (
        <div className="mb-3 grid h-[130px] grid-cols-2 gap-[3px] overflow-hidden rounded-[5px]">
          <div className="overflow-hidden rounded">
            <ImgSlot idx={0} />
          </div>
          <div className="grid gap-[3px]" style={{ gridTemplateRows: `repeat(${shown - 1},1fr)` }}>
            {Array.from({ length: shown - 1 }).map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded">
                <ImgSlot idx={i + 1} />
                {imageCount > 4 && i === shown - 2 && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-[rgba(10,14,26,0.78)] font-mono text-mono-md font-semibold text-tp"
                    data-testid="preview-image-more"
                  >
                    +{imageCount - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments — file đã upload (design-file Create Post.html "// attachments [N]"). */}
      {files.length > 0 && (
        <div className="mb-3" data-testid="preview-attachments">
          <div className="mb-1.5 font-mono text-mono-sm text-tm">
            // attachments [{files.length}]
          </div>
          <div className="flex flex-col gap-1">
            {files.map((f, i) => {
              const { label, color } = getFileConfig(fileExt(f.name) || undefined);
              return (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2.5 rounded-md bg-elev px-3 py-1.5"
                  style={{ border: `1px solid ${color}28`, borderLeft: `2px solid ${color}80` }}
                >
                  <span
                    className="shrink-0 rounded-[3px] px-1.5 py-px font-mono text-[9px]"
                    style={{ color, background: `${color}18`, border: `1px solid ${color}50` }}
                  >
                    {label}
                  </span>
                  <span
                    className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-mono"
                    style={{ color: '#C9D1D9' }}
                  >
                    {f.name}
                  </span>
                  <span className="shrink-0 font-mono text-mono-sm text-tm">
                    {formatBytes(f.size)}
                  </span>
                </div>
              );
            })}
          </div>
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
