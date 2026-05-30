import { useRef, useState } from 'react';
import { useUploadFile, type UploadedAsset } from '@/hooks/mutations/use-upload';
import type { ResourceType } from '@/services/api/files';
import { ImageThumb } from './ImageThumb';
import { FileItem } from './FileItem';

export type UploadEntry = UploadedAsset & { id: string };

type Props = {
  resourceType: ResourceType;
  accept: string;
  maxCount: number;
  folder?: string;
  variant: 'image' | 'file';
  value: UploadEntry[];
  onChange: (next: UploadEntry[]) => void;
  /** Optional override for the drop-zone hint line (default: `❯ drag & drop or click — N slots left`). */
  hint?: string;
  /** Optional second muted line under the hint (e.g. accepted file types — design-file 2-line dropzone). */
  subHint?: string;
  /** Optional max file size in MB. Files exceeding this are silently skipped (T-363). */
  maxSizeMB?: number;
};

// Pending item tracking — file đang upload + temp local URL.
type Pending = { id: string; name: string; type: string; size: number; previewUrl?: string };

export function UploadZone({
  resourceType,
  accept,
  maxCount,
  folder,
  variant,
  value,
  onChange,
  hint,
  subHint,
  maxSizeMB,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const upload = useUploadFile(resourceType);
  const remaining = Math.max(0, maxCount - value.length - pending.length);
  const full = remaining === 0;

  async function handleFiles(list: FileList | File[]) {
    const sizeLimitBytes = maxSizeMB ? maxSizeMB * 1024 * 1024 : Infinity;
    const files = Array.from(list)
      .filter((f) => f.size <= sizeLimitBytes)
      .slice(0, remaining);
    for (const file of files) {
      const id = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const previewUrl = variant === 'image' ? URL.createObjectURL(file) : undefined;
      setPending((p) => [
        ...p,
        { id, name: file.name, type: file.type, size: file.size, previewUrl },
      ]);
      try {
        const asset = await upload.mutateAsync({ file, folder });
        onChange([...value, { ...asset, id }]);
      } catch {
        // silent — pending remove khi finally
      } finally {
        setPending((p) => p.filter((x) => x.id !== id));
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    }
  }

  function onClick() {
    if (!full) inputRef.current?.click();
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }
  function onDragLeave() {
    setDragOver(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${variant} (${value.length + pending.length}/${maxCount})`}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-lg border-2 border-dashed px-5 py-7 text-center font-mono text-mono-sm transition-colors ${
          full
            ? 'cursor-not-allowed border-b2 text-td opacity-60'
            : `cursor-pointer ${dragOver ? 'border-cyan bg-cyan/5 text-cyan' : 'animate-dashed-pulse border-b2 text-tm hover:border-b3 hover:text-tp'}`
        }`}
      >
        {full ? (
          <>
            // max reached ({maxCount}/{maxCount})
          </>
        ) : (
          <>
            <div className={subHint ? 'text-[14px]' : undefined}>
              {hint ?? <>❯ drag &amp; drop or click — {remaining} slots left</>}
            </div>
            {subHint ? <div className="mt-1 text-mono-sm text-td">{subHint}</div> : null}
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {(value.length > 0 || pending.length > 0) && (
        <div
          className={variant === 'image' ? 'mt-2 flex flex-wrap gap-2' : 'mt-2 flex flex-col gap-1'}
        >
          {pending.map((p, i) =>
            variant === 'image' ? (
              <ImageThumb
                key={p.id}
                idx={value.length + i}
                url={p.previewUrl}
                uploading
                onRemove={() => {}}
              />
            ) : (
              <FileItem
                key={p.id}
                name={p.name}
                type={p.type}
                size={p.size}
                uploading
                onRemove={() => {}}
              />
            ),
          )}
          {value.map((asset, i) =>
            variant === 'image' ? (
              <ImageThumb
                key={asset.id}
                idx={i}
                url={asset.url}
                onRemove={() => onChange(value.filter((x) => x.id !== asset.id))}
              />
            ) : (
              <FileItem
                key={asset.id}
                name={asset.name}
                type={asset.type}
                size={asset.size}
                onRemove={() => onChange(value.filter((x) => x.id !== asset.id))}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
