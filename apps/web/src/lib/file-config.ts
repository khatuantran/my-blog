// File type config + helpers for FileAttachments.
// FileType sync với BE Prisma enum trong apps/api/prisma/schema.prisma.

export type FileType = 'PDF' | 'DOC' | 'DOCX' | 'XLS' | 'XLSX' | 'TXT' | 'CSV';

export type FileMeta = {
  label: string;
  color: string;
};

// Color palette: PDF red, DOC/DOCX blue, XLS/XLSX green, TXT muted, CSV yellow.
// Port từ design-file/myblog-components.jsx:341-349.
export const FILE_CFG: Record<FileType, FileMeta> = {
  PDF: { label: 'PDF', color: '#F7768E' },
  DOC: { label: 'DOC', color: '#7DCFFF' },
  DOCX: { label: 'DOCX', color: '#7DCFFF' },
  XLS: { label: 'XLS', color: '#9ECE6A' },
  XLSX: { label: 'XLSX', color: '#9ECE6A' },
  TXT: { label: 'TXT', color: '#A0AEC0' },
  CSV: { label: 'CSV', color: '#E0AF68' },
};

const DEFAULT_META: FileMeta = { label: 'FILE', color: '#8B96AA' };

export function getFileConfig(type: string | null | undefined): FileMeta {
  if (!type) return DEFAULT_META;
  const upper = type.toUpperCase() as FileType;
  return FILE_CFG[upper] ?? { ...DEFAULT_META, label: upper };
}

// Format bytes → "1.2 MB" / "4 KB" / "120 B"
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}
