import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { MoodPicker } from '@/components/create-post/MoodPicker';
import { RichTextEditor, type RichTextEditorHandle } from '@/components/create-post/RichTextEditor';
import { LinkInsertModal } from '@/components/create-post/LinkInsertModal';
import { UploadZone, type UploadEntry } from '@/components/shared/UploadZone';
import { TagPickerDropdown, type TagDraft } from '@/components/create-post/TagPickerDropdown';
import { PostPreview } from '@/components/create-post/PostPreview';
import { useCreatePost } from '@/hooks/mutations/use-create-post';
import { useUpdatePost } from '@/hooks/mutations/use-update-post';
import { usePost } from '@/hooks/queries/use-posts';
import { deriveFileType } from '@/lib/file-config';
import type { Mood } from '@/lib/mood-config';

const MAX_IMAGES = 10;
const MAX_FILES = 20;

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit'); // ?edit=<postId> → edit mode (FR-02)
  const isEdit = !!editId;

  const [mood, setMood] = useState<Mood>('HAPPY');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<TagDraft[]>([]);
  const [images, setImages] = useState<UploadEntry[]>([]);
  const [files, setFiles] = useState<UploadEntry[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInitialText, setLinkInitialText] = useState('');
  const [showAi, setShowAi] = useState(false); // FR-17 AI suggest — UI shell (generate build sau)
  const editorRef = useRef<RichTextEditorHandle>(null);
  const createM = useCreatePost();
  const updateM = useUpdatePost();
  const m = isEdit ? updateM : createM;

  // Edit mode: fetch post + prefill 1 lần khi data về (ref guard tránh clobber edit của user).
  const editQuery = usePost(editId ?? undefined);
  const prefilledRef = useRef(false);
  useEffect(() => {
    const p = editQuery.data;
    if (!p || prefilledRef.current) return;
    prefilledRef.current = true;
    setMood(p.mood);
    setContent(p.content);
    setTags(p.tags.map((t) => ({ name: t.name, color: t.color ?? '#00FFE5' })));
    setImages(
      p.images.map((img) => ({
        id: img.id,
        url: img.url,
        publicId: img.publicId,
        width: img.width,
        height: img.height,
        size: 0,
        name: '',
        type: 'image',
      })),
    );
    setFiles(
      p.files.map((f) => ({
        id: f.id,
        url: f.url,
        publicId: f.publicId,
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    );
  }, [editQuery.data]);

  const trimmed = content.trim();
  const canPublish = trimmed.length > 0 && !m.isPending;

  function publish() {
    if (!canPublish) return;
    const payload = {
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
    };
    // Brief success state trước khi navigate về post detail.
    const onSuccess = (post: { id: string }) => setTimeout(() => navigate(`/post/${post.id}`), 800);
    if (isEdit && editId) {
      updateM.mutate({ id: editId, ...payload }, { onSuccess });
    } else {
      createM.mutate(payload, { onSuccess });
    }
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
    ? isEdit
      ? '✓ updated'
      : '✓ published'
    : m.isPending
      ? isEdit
        ? '⠋ updating...'
        : '⠋ publishing...'
      : isEdit
        ? '● editing'
        : savedAt
          ? '● draft · saved'
          : '● draft · unsaved';

  return (
    <>
      {/* Fixed SubBar — design L509: top:52px full-width h-44 (đồng bộ Tags/ManagePosts pattern) */}
      <div className="fixed left-0 right-0 top-[52px] z-[90] flex h-11 items-center gap-3 border-b border-b2 bg-elev px-6 font-mono text-[12px]">
        <span className="text-tm">~/admin/{isEdit ? 'edit-post' : 'create-post'}</span>
        <span className="text-td">──</span>
        <span className={m.isSuccess ? 'text-grn' : savedAt ? 'text-grn' : 'text-yel'}>
          {status}
        </span>
        {m.isError && (
          <span className="text-red">
            // {m.error?.message ?? (isEdit ? 'update failed' : 'publish failed')}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {/* btn-draft (design L42): bg-elev border-b2 padding 8/20 font 13 */}
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-md border border-b2 bg-elev px-5 py-1.5 font-mono text-[13px] text-tm transition-colors hover:border-b3 hover:text-tp"
            title="⌘S"
          >
            ⌘S Save Draft
          </button>
          {/* btn-publish (design L40): SOLID cyan + dark text + weight 600 + glow */}
          <button
            type="button"
            onClick={publish}
            disabled={!canPublish}
            className="rounded-md bg-cyan px-5 py-1.5 font-mono text-[13px] font-semibold text-[#0A0E1A] shadow-[0_0_14px_rgba(0,255,229,0.3)] transition-all hover:bg-cyan/80 hover:shadow-[0_0_22px_rgba(0,255,229,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            title="⌘↵"
          >
            ⌘↵ {isEdit ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-[1400px] px-6 pb-10">
        <div className="flex gap-6">
          {/* Editor column */}
          <div className="min-w-0 flex-1 space-y-5">
            <section>
              <div className="sb-lbl">// mood</div>
              <MoodPicker value={mood} onChange={setMood} />
            </section>

            <section>
              <div className="mb-2 flex flex-wrap items-center gap-2.5">
                <div className="sb-lbl mb-0 flex-1">// content</div>
                <button
                  type="button"
                  onClick={() => setShowAi(true)}
                  data-testid="ai-suggest-btn"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] border px-2.5 py-1 font-mono text-mono-sm transition-colors"
                  style={{
                    color: '#BB9AF7',
                    borderColor: 'rgba(187,154,247,0.4)',
                    background: 'rgba(187,154,247,0.08)',
                    boxShadow: '0 0 10px rgba(187,154,247,0.15)',
                  }}
                >
                  ✨ AI suggest
                </button>
                <div className="font-mono text-mono-sm text-td">
                  ⌘B bold · ⌘I italic · ⌘U underline · highlight selection to format
                </div>
              </div>
              <RichTextEditor
                ref={editorRef}
                value={content}
                onChange={setContent}
                onRequestLink={(selectedText) => {
                  setLinkInitialText(selectedText);
                  setShowLinkModal(true);
                }}
              />
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
                hint="❯ drag & drop or click to upload"
                subHint="PNG, JPG, WebP · max 5MB each"
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
                hint="❯ drag & drop docs, PDFs, spreadsheets..."
                subHint="PDF · DOC · DOCX · XLS · XLSX · TXT · CSV · max 20MB each"
              />
            </section>

            <section>
              <div className="sb-lbl">// tags ({tags.length} selected)</div>
              <TagPickerDropdown value={tags} onChange={setTags} />
              <div className="mt-1.5 font-mono text-mono-sm text-td">
                // select from system tags only
              </div>
            </section>
          </div>

          {/* Preview column — hidden < 900px */}
          <aside
            className="hidden w-[380px] shrink-0 [@media(min-width:900px)]:block"
            aria-label="Live preview"
          >
            <div className="sb-lbl">// live.preview</div>
            <PostPreview
              mood={mood}
              content={trimmed}
              tags={tags}
              imageCount={images.length}
              files={files.map((f) => ({ name: f.name, size: f.size }))}
            />
            <div className="mt-2 font-mono text-mono-sm text-td">// preview updates real-time</div>
          </aside>
        </div>
      </div>
      <LinkInsertModal
        open={showLinkModal}
        initialText={linkInitialText}
        onApply={(url, label) => editorRef.current?.applyLink(url, label)}
        onClose={() => setShowLinkModal(false)}
      />
      {/* FR-17 AI suggest — UI shell. Generate + BE /ai/generate defer (T-347). */}
      {showAi && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="// ai.suggest"
          data-testid="ai-suggest-modal"
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAi(false);
          }}
        >
          <div
            className="w-[480px] max-w-full rounded-lg border bg-elev p-5"
            style={{
              borderColor: 'rgba(187,154,247,0.4)',
              boxShadow: '0 0 30px rgba(187,154,247,0.15)',
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-mono-sm" style={{ color: '#BB9AF7' }}>
                ✨ ai.suggest
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowAi(false)}
                className="font-mono text-base leading-none text-td hover:text-tp"
              >
                ×
              </button>
            </div>
            <div className="rounded-md border border-b2 bg-bg px-4 py-8 text-center">
              <div className="mb-2 text-2xl opacity-40">✨</div>
              <p className="font-mono text-mono-sm text-tm">
                // AI content generation — sắp ra mắt
              </p>
              <p className="mt-1 font-mono text-mono-tiny text-td">
                FR-17 · cần BE POST /ai/generate + AI_API_KEY (build sau)
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
