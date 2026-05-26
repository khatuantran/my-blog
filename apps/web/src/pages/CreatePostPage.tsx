import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { MoodPicker } from '@/components/create-post/MoodPicker';
import { MarkdownEditor } from '@/components/create-post/MarkdownEditor';
import { UploadZone, type UploadEntry } from '@/components/shared/UploadZone';
import { TagInput, type TagDraft } from '@/components/create-post/TagInput';
import { PostPreview } from '@/components/create-post/PostPreview';
import { useCreatePost } from '@/hooks/mutations/use-create-post';
import { deriveFileType } from '@/lib/file-config';
import type { Mood } from '@/lib/mood-config';

const MAX_IMAGES = 10;
const MAX_FILES = 20;

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [mood, setMood] = useState<Mood>('HAPPY');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<TagDraft[]>([]);
  const [images, setImages] = useState<UploadEntry[]>([]);
  const [files, setFiles] = useState<UploadEntry[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const m = useCreatePost();

  const trimmed = content.trim();
  const canPublish = trimmed.length > 0 && !m.isPending;

  function publish() {
    if (!canPublish) return;
    m.mutate(
      {
        content: trimmed,
        mood,
        tags: tags.map((t) => t.name),
        images: images.map((img, order) => ({
          url: img.url,
          publicId: img.publicId,
          width: img.width ?? 1,
          height: img.height ?? 1,
          order,
        })),
        files: files.map((f) => ({
          name: f.name,
          type: deriveFileType(f.name),
          size: f.size,
          url: f.url,
          publicId: f.publicId,
        })),
      },
      {
        onSuccess: (post) => {
          // Brief success state trước khi navigate
          setTimeout(() => navigate(`/post/${post.id}`), 800);
        },
      },
    );
  }

  function saveDraft() {
    // Local only — defer BE draft endpoint M14+
    setSavedAt(Date.now());
  }

  // Refs hold latest handler closures — keydown listener installed once (avoid
  // ESLint exhaustive-deps churn vì publish/saveDraft rebuild each render).
  const publishRef = useRef(publish);
  const saveDraftRef = useRef(saveDraft);
  publishRef.current = publish;
  saveDraftRef.current = saveDraft;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveDraftRef.current();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        publishRef.current();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const status = m.isSuccess
    ? '✓ published'
    : m.isPending
      ? '⠋ publishing...'
      : savedAt
        ? '● draft · saved'
        : '● draft · unsaved';

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-4">
      {/* Sub-toolbar */}
      <div className="mb-4 flex items-center gap-3 rounded-md border border-b1 bg-surf px-4 py-2 font-mono text-mono-sm">
        <span className="text-tm">~/admin/create-post</span>
        <span className="text-td">──</span>
        <span className={m.isSuccess ? 'text-grn' : savedAt ? 'text-grn' : 'text-yel'}>
          {status}
        </span>
        {m.isError && <span className="text-red">// {m.error?.message ?? 'publish failed'}</span>}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-sm border border-b2 bg-elev px-3 py-1 font-mono text-mono-sm text-tm hover:text-tp"
            title="⌘S"
          >
            ⌘S Save
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={!canPublish}
            className="rounded-sm border border-cyan/50 bg-cyan/10 px-3 py-1 font-mono text-mono-sm text-cyan transition-all hover:bg-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
            title="⌘↵"
          >
            ⌘↵ Publish
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Editor column */}
        <div className="min-w-0 flex-1 space-y-5">
          <section>
            <div className="sb-lbl">// mood</div>
            <MoodPicker value={mood} onChange={setMood} />
          </section>

          <section>
            <div className="sb-lbl">// content</div>
            <MarkdownEditor value={content} onChange={setContent} />
          </section>

          <section>
            <div className="sb-lbl">
              // images ({images.length}/{MAX_IMAGES})
            </div>
            <UploadZone
              resourceType="image"
              accept="image/png,image/jpeg,image/webp"
              maxCount={MAX_IMAGES}
              folder="myblog/posts"
              variant="image"
              value={images}
              onChange={setImages}
            />
          </section>

          <section>
            <div className="sb-lbl">
              // files ({files.length}/{MAX_FILES})
            </div>
            <UploadZone
              resourceType="raw"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              maxCount={MAX_FILES}
              folder="myblog/files"
              variant="file"
              value={files}
              onChange={setFiles}
            />
          </section>

          <section>
            <div className="sb-lbl">// tags</div>
            <TagInput value={tags} onChange={setTags} />
          </section>
        </div>

        {/* Preview column — hidden < 900px */}
        <aside
          className="hidden w-[380px] shrink-0 [@media(min-width:900px)]:block"
          aria-label="Live preview"
        >
          <div className="sb-lbl">// live.preview</div>
          <PostPreview mood={mood} content={trimmed} tags={tags} imageCount={images.length} />
          <div className="mt-2 font-mono text-mono-sm text-td">// preview updates real-time</div>
        </aside>
      </div>
    </div>
  );
}
