import { getFileConfig, formatBytes } from '@/lib/file-config';

type Props = {
  name: string;
  type: string;
  size: number;
  onRemove: () => void;
  uploading?: boolean;
};

export function FileItem({ name, type, size, onRemove, uploading }: Props) {
  const { label, color } = getFileConfig(type);
  return (
    <div
      className="flex items-center gap-2.5 rounded-md bg-elev px-3 py-1.5"
      style={{
        border: `1px solid ${color}28`,
        borderLeft: `2px solid ${color}80`,
      }}
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
        {name}
      </span>
      <span className="shrink-0 font-mono text-mono-xs text-tm">
        {uploading ? 'uploading…' : formatBytes(size)}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="shrink-0 rounded-sm border-none bg-transparent px-1.5 font-mono text-mono-xs text-red hover:bg-red/10"
      >
        ×
      </button>
    </div>
  );
}
