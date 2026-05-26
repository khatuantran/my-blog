import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

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

// RichTextEditor (T-368/T-369) — contentEditable rich-text editor per design-file v2 spec.
// Renders 11-button toolbar + 2 inline color popovers + keyboard shortcuts.
// Exposes RichTextEditorHandle.applyLink for LinkInsertModal integration (T-369).
// Output: HTML string (admin-only content creation — no sanitization needed yet).
export const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(function RichTextEditor(
  { value, onChange, placeholder = '~$ start writing...', minHeight = 280, onRequestLink },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const [showColor, setShowColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  // Sync DOM from external value: on first mount AND on subsequent external clears
  // (e.g., form reset). User-typed changes flow via onInput → onChange → parent state,
  // so re-setting innerHTML on every value tick would clobber the cursor — guard with
  // an explicit mount flag + clear detection.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!editorRef.current) return;
    if (!mountedRef.current) {
      editorRef.current.innerHTML = value;
      mountedRef.current = true;
      return;
    }
    if (value === '' && editorRef.current.innerHTML !== '') {
      editorRef.current.innerHTML = '';
    }
  }, [value]);

  // Range API patterns — exposed for internal use + programmatic insert hooks.
  function exec(cmd: string, val?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML ?? '');
  }

  function insertHTML(html: string) {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    onChange(editorRef.current?.innerHTML ?? '');
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const r = savedSelectionRef.current;
    if (!r) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
  }

  function handleLinkClick() {
    saveSelection();
    if (onRequestLink) {
      const sel = window.getSelection();
      onRequestLink(sel?.toString() ?? '');
    } else {
      // Fallback for standalone use (T-369 wires LinkInsertModal via onRequestLink).
      const url = window.prompt('Enter URL', 'https://');
      if (!url) return;
      restoreSelection();
      const sel = window.getSelection();
      const hasSel = sel && sel.toString().length > 0;
      if (hasSel) {
        exec('createLink', url);
      } else {
        insertHTML(`<a href="${url}">${url}</a>`);
      }
    }
  }

  function applyTextColor(color: string) {
    restoreSelection();
    exec('foreColor', color);
    setShowColor(false);
  }

  function applyHighlight(color: string) {
    restoreSelection();
    exec('hiliteColor', color);
    setShowHighlight(false);
  }

  // Stable-ref pattern: keep latest handlers in a ref so the keydown listener installs
  // once (no churn on every render) yet always calls fresh closures.
  const handlersRef = useRef({
    exec,
    handleLinkClick,
    applyLink: (_url: string, _label: string) => {},
  });
  handlersRef.current = {
    exec,
    handleLinkClick,
    applyLink(url: string, label: string) {
      restoreSelection();
      const sel = window.getSelection();
      const hasSel = sel && sel.toString().length > 0;
      if (hasSel) {
        exec('createLink', url);
      } else {
        insertHTML(`<a href="${url}">${label || url}</a>`);
      }
    },
  };

  // Expose applyLink for LinkInsertModal (T-369) — deps [] is intentional; the actual
  // implementation always delegates to handlersRef.current which is always fresh.
  useImperativeHandle(
    ref,
    () => ({
      applyLink: (url: string, label: string) => handlersRef.current.applyLink(url, label),
    }),
    [],
  );

  // Keyboard shortcuts — only fire when editor has focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const editor = editorRef.current;
      if (!editor) return;
      const focused = document.activeElement === editor || editor.contains(document.activeElement);
      if (!focused) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'b') {
        e.preventDefault();
        handlersRef.current.exec('bold');
      } else if (k === 'i') {
        e.preventDefault();
        handlersRef.current.exec('italic');
      } else if (k === 'u') {
        e.preventDefault();
        handlersRef.current.exec('underline');
      } else if (k === 'k') {
        e.preventDefault();
        handlersRef.current.handleLinkClick();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div>
      <div
        role="toolbar"
        aria-label="Rich text formatting"
        data-testid="rte-toolbar"
        className="mb-2 flex flex-wrap items-center gap-1"
      >
        <ToolbarBtn label="B" title="Bold (⌘B)" onClick={() => exec('bold')} weight="700" />
        <ToolbarBtn label="I" title="Italic (⌘I)" onClick={() => exec('italic')} italic />
        <ToolbarBtn label="U" title="Underline (⌘U)" onClick={() => exec('underline')} underline />
        <ToolbarBtn label="S" title="Strikethrough" onClick={() => exec('strikeThrough')} strike />
        <ToolbarBtn
          label="A"
          title="Text color"
          onClick={() => {
            saveSelection();
            setShowColor((v) => !v);
            setShowHighlight(false);
          }}
          mono
          aria-expanded={showColor}
          data-testid="rte-btn-textcolor"
        />
        <ToolbarBtn
          label="🖍"
          title="Highlight background"
          onClick={() => {
            saveSelection();
            setShowHighlight((v) => !v);
            setShowColor(false);
          }}
          fontSize="14px"
          aria-expanded={showHighlight}
          data-testid="rte-btn-highlight"
        />
        <ToolbarBtn label="H1" title="Heading 1" onClick={() => exec('formatBlock', 'h1')} mono />
        <ToolbarBtn label="H2" title="Heading 2" onClick={() => exec('formatBlock', 'h2')} mono />
        <ToolbarBtn
          label="•"
          title="Bullet list"
          onClick={() => exec('insertUnorderedList')}
          mono
        />
        <ToolbarBtn
          label="1."
          title="Numbered list"
          onClick={() => exec('insertOrderedList')}
          mono
        />
        <ToolbarBtn
          label="🔗"
          title="Link (⌘K)"
          onClick={handleLinkClick}
          fontSize="13px"
          data-testid="rte-btn-link"
        />
        <ToolbarBtn label="✕" title="Clear formatting" onClick={() => exec('removeFormat')} mono />
      </div>

      {showColor && (
        <div
          data-testid="rte-popover-textcolor"
          className="mb-2 flex flex-wrap gap-1 rounded-md border border-b2 bg-elev p-2"
        >
          {TEXT_COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => applyTextColor(c.color)}
              aria-label={`Text color ${c.label}`}
              data-testid={`rte-textcolor-${c.label}`}
              className="h-6 w-6 rounded-sm border border-b2 transition-transform hover:scale-110"
              style={{ background: c.color }}
            />
          ))}
        </div>
      )}

      {showHighlight && (
        <div
          data-testid="rte-popover-highlight"
          className="mb-2 flex flex-wrap gap-1 rounded-md border border-b2 bg-elev p-2"
        >
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => applyHighlight(c.color)}
              aria-label={`Highlight ${c.label}`}
              data-testid={`rte-highlight-${c.label}`}
              className="h-6 w-6 rounded-sm border border-b2 transition-transform hover:scale-110"
              style={{ background: c.color }}
            />
          ))}
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Post content rich-text editor"
        data-testid="rte-editor"
        data-placeholder={placeholder}
        onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
        style={{ minHeight }}
        className="w-full resize-y rounded-md border border-b2 bg-bg p-3 font-sans text-body text-tp outline-none focus:border-cyan focus:shadow-glow-cyan-sm"
      />
      <div className="mt-1.5 font-mono text-mono-sm text-tm">
        // rich-text · {(editorRef.current?.textContent ?? '').length} chars
      </div>
    </div>
  );
});

type ToolbarBtnProps = {
  label: string;
  title: string;
  onClick: () => void;
  weight?: string;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  mono?: boolean;
  fontSize?: string;
  'aria-expanded'?: boolean;
  'data-testid'?: string;
};

function ToolbarBtn({
  label,
  title,
  onClick,
  weight,
  italic,
  underline,
  strike,
  mono,
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
      className={`rounded-sm border border-b2 bg-elev px-2 py-1 text-tm transition-colors hover:border-b3 hover:text-tp ${
        mono ? 'font-mono text-mono-sm' : 'text-mono-md'
      } ${italic ? 'italic' : ''} ${underline ? 'underline' : ''} ${strike ? 'line-through' : ''}`}
      {...rest}
    >
      {label}
    </button>
  );
}
