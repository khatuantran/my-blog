import { getFileConfig, formatBytes, type FileType } from '@/lib/file-config';

export type FileItem = {
  id?: string;
  name: string;
  type: FileType | string;
  size: number;
  url: string;
};

type Props = {
  files: FileItem[];
};

// File attachment list — port từ design-file/myblog-components.jsx:339-371.
// Header `// attachments [N]` + rows: type badge + name (ellipsis) + size + download.
export function FileAttachments({ files }: Props) {
  if (!files || files.length === 0) return null;
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-mono-xs text-tm">
        <span>// attachments</span>
        <span className="text-td">[{files.length}]</span>
      </div>
      <div className="flex flex-col gap-1">
        {files.map((f, i) => {
          const { label, color } = getFileConfig(f.type);
          return (
            <div
              key={f.id ?? i}
              className="flex items-center gap-2.5 rounded-md bg-elev px-3 py-1.5 transition-colors"
              style={{
                border: `1px solid ${color}28`,
                borderLeft: `2px solid ${color}80`,
              }}
            >
              <span
                className="shrink-0 rounded-[3px] px-1.5 py-px font-mono text-[9px]"
                style={{
                  color,
                  background: `${color}18`,
                  border: `1px solid ${color}50`,
                }}
              >
                {label}
              </span>
              <span
                className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-mono"
                style={{ color: '#C9D1D9' }}
              >
                {f.name}
              </span>
              <span className="shrink-0 font-mono text-mono-xs text-tm">{formatBytes(f.size)}</span>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                download={f.name}
                aria-label={`Download ${f.name}`}
                className="shrink-0 rounded-sm px-2 py-px font-mono text-mono-xs hover:opacity-100"
                style={{
                  color,
                  background: `${color}10`,
                  border: `1px solid ${color}40`,
                }}
              >
                ↓
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
