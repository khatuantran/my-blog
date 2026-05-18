import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileAttachments, type FileItem } from '@/components/post/FileAttachments';
import { formatBytes, getFileConfig } from '@/lib/file-config';

describe('formatBytes', () => {
  it('< 1KB → bytes', () => {
    expect(formatBytes(512)).toBe('512 B');
  });
  it('KB range', () => {
    expect(formatBytes(4096)).toBe('4 KB');
    expect(formatBytes(102400)).toBe('100 KB');
  });
  it('MB range với 1 decimal khi < 10', () => {
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
    expect(formatBytes(15 * 1024 * 1024)).toBe('15 MB');
  });
});

describe('getFileConfig', () => {
  it('returns PDF config với red color', () => {
    expect(getFileConfig('PDF').color).toBe('#F7768E');
  });
  it('lowercase fallback case-insensitive', () => {
    expect(getFileConfig('docx').label).toBe('DOCX');
  });
  it('unknown type → FILE label + muted color', () => {
    expect(getFileConfig('xyz').label).toBe('XYZ');
  });
  it('null → default FILE', () => {
    expect(getFileConfig(null).label).toBe('FILE');
  });
});

describe('FileAttachments', () => {
  it('returns null khi không có files', () => {
    const { container } = render(<FileAttachments files={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 2 files với badges + size + download link', () => {
    const files: FileItem[] = [
      {
        id: 'f1',
        name: 'doc.pdf',
        type: 'PDF',
        size: 1.2 * 1024 * 1024,
        url: 'https://cdn/doc.pdf',
      },
      { id: 'f2', name: 'notes.txt', type: 'TXT', size: 4096, url: 'https://cdn/notes.txt' },
    ];
    render(<FileAttachments files={files} />);
    expect(screen.getByText('// attachments')).toBeInTheDocument();
    expect(screen.getByText('[2]')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('TXT')).toBeInTheDocument();
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.2 MB')).toBeInTheDocument();
    expect(screen.getByText('4 KB')).toBeInTheDocument();

    const downloadLink = screen.getByLabelText('Download doc.pdf');
    expect(downloadLink).toHaveAttribute('href', 'https://cdn/doc.pdf');
    expect(downloadLink).toHaveAttribute('target', '_blank');
  });
});
