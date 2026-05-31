import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { EmojiPicker } from './EmojiPicker';

export interface RichTextEditorHandle {
  applyLink: (url: string, label: string) => void;
}

type Props = {
  value: string; // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  /** T-369: callback invoked when 🔗 clicked; receives selected text (may be empty). */
  onRequestLink?: (selectedText: string) => void;
};

type TextColor = { color: string; label: string };
type HighlightColor = { color: string; label: string; preview: string };

// BE @MaxLength(50000) đếm toàn chuỗi HTML — cảnh báo khi gần ngưỡng (BUG-020).
const HTML_MAX = 50000;
const HTML_WARN = 45000;

// 7 text colors per design-file/MyBlog Create Post.html L416-423
const TEXT_COLORS: TextColor[] = [
  { color: '#E6EDF3', label: 'default' },
  { color: '#FF6E96', label: 'pink' },
  { color: '#00FFE5', label: 'cyan' },
  { color: '#9ECE6A', label: 'green' },
  { color: '#E0AF68', label: 'yellow' },
  { color: '#BB9AF7', label: 'purple' },
  { color: '#7DCFFF', label: 'blue' },
];

// 7 highlight colors per design-file L425-433 (`/40` transparency suffix on background)
const HIGHLIGHT_COLORS: HighlightColor[] = [
  { color: '#E0AF6840', label: 'yellow', preview: '#E0AF68' },
  { color: '#FF6E9640', label: 'pink', preview: '#FF6E96' },
  { color: '#00FFE540', label: 'cyan', preview: '#00FFE5' },
  { color: '#9ECE6A40', label: 'green', preview: '#9ECE6A' },
  { color: '#BB9AF740', label: 'purple', preview: '#BB9AF7' },
  { color: '#FF9E6440', label: 'orange', preview: '#FF9E64' },
  { color: '#7DCFFF40', label: 'blue', preview: '#7DCFFF' },
];

// RichTextEditor (T-368/T-369/T-397; T-435 engine → TipTap) — rich-text editor per design-file v2 spec.
// ADR-009: dùng TipTap (ProseMirror) thay `document.execCommand` (deprecated) → markup HTML semantic
// gọn (`<p>/<strong>/<mark>/<h1>`…), không phình inline-style → fix BUG-019/020/021.
// Renders 11-button toolbar + 2 inline color popovers + emoji picker + keyboard shortcuts.
// Output: HTML string (admin-only content creation — no sanitization needed yet).
export const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(function RichTextEditor(
  {
    value,
    onChange,
    placeholder = 'Start writing... (highlight text and use toolbar to format)',
    minHeight = 220,
    onRequestLink,
  },
  ref,
) {
  const [showColor, setShowColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        // StarterKit v3 bundles Link — chỉ tắt auto open/autolink, mở link qua toolbar/⌘K.
        link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: null, target: null } },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Post content rich-text editor',
        'data-testid': 'rte-editor',
        // box styling — min-height + scroll nội bộ (BUG-021: bỏ resize-y nở vô hạn).
        // Prose descendant styling (h1/h2/ul/mark margins) ở globals.css.
        class:
          'w-full rounded-md border border-b2 bg-bg p-3 font-sans text-body text-tp outline-none overflow-y-auto focus:border-cyan focus:shadow-glow-cyan-sm',
        style: `min-height:${minHeight}px`,
      },
      handleKeyDown(_view, event) {
        // ⌘K / Ctrl+K → mở link modal (TipTap không bind sẵn). ⌘B/I/U built-in.
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          handleLinkClick();
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor: e }) {
      onChange(e.getHTML());
    },
  });

  // Reactive editor state (active marks + char counts) — useEditor v3 KHÔNG re-render mỗi
  // transaction, nên subscribe qua useEditorState để toolbar active + counter cập nhật.
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            isBold: e.isActive('bold'),
            isItalic: e.isActive('italic'),
            isUnderline: e.isActive('underline'),
            isStrike: e.isActive('strike'),
            isH1: e.isActive('heading', { level: 1 }),
            isH2: e.isActive('heading', { level: 2 }),
            isBullet: e.isActive('bulletList'),
            isOrdered: e.isActive('orderedList'),
            isLink: e.isActive('link'),
          }
        : null,
  });

  // External value sync: KHÔNG setContent mỗi tick value (sẽ clobber cursor) — user-typed
  // flow đi qua onUpdate. Chỉ đồng bộ 2 trường hợp external: (1) parent clear (value rỗng)
  // → clearContent; (2) prefill khi editor đang rỗng nhưng value có nội dung (edit mode load
  // async, value đổi từ '' → HTML sau khi fetch xong).
  useEffect(() => {
    if (!editor) return;
    const isBlank = value === '' || value === '<p></p>';
    if (isBlank && !editor.isEmpty) {
      editor.commands.clearContent();
    } else if (!isBlank && editor.isEmpty) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  function handleLinkClick() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (onRequestLink) {
      onRequestLink(selectedText);
    } else {
      // Fallback standalone use (T-369 wires LinkInsertModal via onRequestLink).
      const url = window.prompt('Enter URL', 'https://');
      if (!url) return;
      applyLink(url, selectedText);
    }
  }

  const applyLink = useCallback(
    (url: string, label: string) => {
      if (!editor) return;
      const { empty } = editor.state.selection;
      if (!empty) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: label || url,
            marks: [{ type: 'link', attrs: { href: url } }],
          })
          .run();
      }
    },
    [editor],
  );

  useImperativeHandle(ref, () => ({ applyLink }), [applyLink]);

  function applyTextColor(color: string) {
    editor?.chain().focus().setColor(color).run();
  }

  function applyHighlight(color: string) {
    editor?.chain().focus().toggleHighlight({ color }).run();
  }

  function insertEmoji(emoji: string) {
    // GIỮ picker mở khi chèn (design-file L638: chỉ × đóng) — multi-insert.
    editor?.chain().focus().insertContent(emoji).run();
  }

  // Counts đọc trực tiếp từ editor (useEditorState lo re-render khi gõ; tránh snapshot
  // stale cho initial content). textLen = text thực (BUG-020: KHÔNG đếm markup HTML).
  const textLen = editor?.getText().length ?? 0;
  const htmlLen = editor?.getHTML().length ?? 0;
  const nearLimit = htmlLen >= HTML_WARN;

  return (
    <div>
      <div
        role="toolbar"
        aria-label="Rich text formatting"
        data-testid="rte-toolbar"
        className="mb-1.5 flex items-center gap-1 overflow-x-auto rounded-md border border-b2 bg-bg px-2 py-1.5 [scrollbar-width:none]"
      >
        <ToolbarBtn
          label="B"
          title="Bold (⌘B)"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          weight="700"
          active={s?.isBold}
        />
        <ToolbarBtn
          label="I"
          title="Italic (⌘I)"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          italic
          active={s?.isItalic}
        />
        <ToolbarBtn
          label="U"
          title="Underline (⌘U)"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          underline
          active={s?.isUnderline}
        />
        <ToolbarBtn
          label="S"
          title="Strikethrough"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          strike
          active={s?.isStrike}
        />
        <ToolbarBtn
          label="🖍"
          title="Highlight background"
          onClick={() => {
            setShowHighlight((v) => !v);
            setShowColor(false);
            setShowEmoji(false);
          }}
          fontSize="14px"
          active={showHighlight}
          aria-expanded={showHighlight}
          data-testid="rte-btn-highlight"
        />
        <ToolbarBtn
          label="H1"
          title="Heading 1"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          active={s?.isH1}
        />
        <ToolbarBtn
          label="H2"
          title="Heading 2"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={s?.isH2}
        />
        <ToolbarBtn
          label="•"
          title="Bullet list"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={s?.isBullet}
        />
        <ToolbarBtn
          label="1."
          title="Numbered list"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={s?.isOrdered}
        />
        <ToolbarBtn
          label="🔗"
          title="Link (⌘K)"
          onClick={handleLinkClick}
          fontSize="13px"
          active={s?.isLink}
          data-testid="rte-btn-link"
        />
        <ToolbarBtn
          label="✕"
          title="Clear formatting"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
        />
        <ToolbarBtn
          label={
            <>
              A<span style={{ color: '#FF6E96' }}>▾</span>
            </>
          }
          title="Text color"
          onClick={() => {
            setShowColor((v) => !v);
            setShowHighlight(false);
            setShowEmoji(false);
          }}
          active={showColor}
          aria-expanded={showColor}
          data-testid="rte-btn-textcolor"
        />
        <div className="mx-0.5 h-[18px] w-px shrink-0 bg-b2" aria-hidden />
        <ToolbarBtn
          label="🙂"
          title="Insert emoji"
          onClick={() => {
            setShowEmoji((v) => !v);
            setShowColor(false);
            setShowHighlight(false);
          }}
          fontSize="15px"
          active={showEmoji}
          aria-expanded={showEmoji}
          data-testid="rte-btn-emoji"
        />
      </div>

      {/* Text color picker — connected drawer (design L609-623): label + swatches + × close. */}
      {showColor && (
        <div
          data-testid="rte-popover-textcolor"
          className="-mt-1.5 mb-1.5 flex items-center gap-2.5 rounded-b-md border border-t-0 bg-elev px-3 py-2"
          style={{ borderColor: 'rgba(0,255,229,0.25)' }}
        >
          <span className="shrink-0 font-mono text-mono-sm text-tm">text.color:</span>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.label}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyTextColor(c.color)}
                aria-label={`Text color ${c.label}`}
                data-testid={`rte-textcolor-${c.label}`}
                title={c.label}
                className="h-6 w-6 rounded border border-b2 transition-transform hover:scale-110"
                style={{ background: c.color }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowColor(false)}
            title="Close"
            aria-label="Close text color"
            className="shrink-0 font-mono text-base leading-none text-tm hover:text-tp"
          >
            ×
          </button>
        </div>
      )}

      {/* Highlight picker — connected drawer (design L587-607): label + A-preview swatches + clear + × close. */}
      {showHighlight && (
        <div
          data-testid="rte-popover-highlight"
          className="-mt-1.5 mb-1.5 flex items-center gap-2.5 rounded-b-md border border-t-0 bg-elev px-3 py-2"
          style={{ borderColor: 'rgba(224,175,104,0.25)' }}
        >
          <span className="shrink-0 font-mono text-mono-sm text-tm">highlight:</span>
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.label}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyHighlight(c.color)}
                aria-label={`Highlight ${c.label}`}
                data-testid={`rte-highlight-${c.label}`}
                title={c.label}
                className="flex h-6 w-[26px] items-center justify-center rounded font-mono text-mono-sm font-semibold transition-transform hover:scale-110"
                style={{
                  background: c.color,
                  border: `1px solid ${c.preview}80`,
                  color: c.preview,
                }}
              >
                A
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor?.chain().focus().unsetHighlight().run()}
              title="Remove highlight"
              data-testid="rte-highlight-clear"
              className="inline-flex h-6 items-center gap-1 rounded border border-b2 px-2.5 font-mono text-[10px] text-red hover:bg-red/10"
            >
              ✕ clear
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowHighlight(false)}
            title="Close"
            aria-label="Close highlight"
            className="shrink-0 font-mono text-base leading-none text-tm hover:text-tp"
          >
            ×
          </button>
        </div>
      )}

      <EmojiPicker open={showEmoji} onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />

      <EditorContent editor={editor} />

      <div className="mt-1.5 flex items-center gap-2 font-mono text-mono-sm text-tm">
        <span>// rich-text · {textLen} chars</span>
        {nearLimit && (
          <span className="text-yel" data-testid="rte-near-limit">
            ⚠ {htmlLen}/{HTML_MAX} html chars
          </span>
        )}
      </div>
    </div>
  );
});

type ToolbarBtnProps = {
  label: React.ReactNode;
  title: string;
  onClick: () => void;
  weight?: string;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  active?: boolean;
  fontSize?: string;
  'aria-expanded'?: boolean;
  'data-testid'?: string;
};

// Fixed 32×30 uniform buttons per design-file `.toolbar-btn` (width 32 / height 30 / 13px /
// inline-flex center) — KHÔNG dùng padding-based sizing (gây chiều cao lệch nhau). `active`
// = popover đang mở hoặc mark đang active (cyan tint).
function ToolbarBtn({
  label,
  title,
  onClick,
  weight,
  italic,
  underline,
  strike,
  active,
  fontSize,
  ...rest
}: ToolbarBtnProps) {
  const style: React.CSSProperties = {};
  if (weight) style.fontWeight = weight;
  if (fontSize) style.fontSize = fontSize;
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // Prevent focus loss before click → keeps selection.
      onClick={onClick}
      style={style}
      className={`inline-flex h-[30px] min-w-[32px] shrink-0 items-center justify-center rounded border px-1.5 font-mono text-[13px] transition-colors ${
        active
          ? 'border-cyan/40 bg-cyan/10 text-cyan'
          : 'border-b2 bg-transparent text-tm hover:border-b3 hover:text-tp'
      } ${italic ? 'italic' : ''} ${underline ? 'underline' : ''} ${strike ? 'line-through' : ''}`}
      {...rest}
    >
      {label}
    </button>
  );
}
