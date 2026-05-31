import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileItem } from '@/components/shared/FileItem';

describe('FileItem', () => {
  it('regression: badge dùng extension của name (XLSX), KHÔNG hiện MIME thô', () => {
    render(
      <FileItem
        name="data.xlsx"
        type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        size={16275}
        onRemove={vi.fn()}
      />,
    );
    // Badge = 'XLSX' (từ extension), không phải full MIME.
    expect(screen.getByText('XLSX')).toBeInTheDocument();
    expect(screen.queryByText(/officedocument/i)).toBeNull();
    expect(screen.getByText('data.xlsx')).toBeInTheDocument();
    expect(screen.getByText('16 KB')).toBeInTheDocument();
  });

  it('badge PDF từ name .pdf dù type là application/pdf', () => {
    render(<FileItem name="report.pdf" type="application/pdf" size={2100000} onRemove={vi.fn()} />);
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });
});
