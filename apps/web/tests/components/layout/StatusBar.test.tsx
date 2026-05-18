import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '@/components/layout/StatusBar';

describe('StatusBar', () => {
  it('renders default path ~/feed + 3 online + version badge', () => {
    render(<StatusBar />);
    expect(screen.getByText('~/feed')).toBeInTheDocument();
    expect(screen.getByLabelText('3 users online')).toBeInTheDocument();
    expect(screen.getByText('[ v0.1.0 ]')).toBeInTheDocument();
  });

  it('custom path prop reflects vào DOM', () => {
    render(<StatusBar path="~/admin/dashboard" />);
    expect(screen.getByText('~/admin/dashboard')).toBeInTheDocument();
  });

  it('info section conditional — chỉ render khi prop có value', () => {
    const { rerender } = render(<StatusBar />);
    expect(screen.queryByText('● draft · unsaved')).not.toBeInTheDocument();

    rerender(<StatusBar info="● draft · unsaved" />);
    expect(screen.getByText('● draft · unsaved')).toBeInTheDocument();
  });

  it('online count custom', () => {
    render(<StatusBar online={42} />);
    expect(screen.getByLabelText('42 users online')).toBeInTheDocument();
  });

  it('build hash hiển thị từ VITE_BUILD_SHA fallback', () => {
    render(<StatusBar />);
    expect(screen.getByText(/build:/)).toBeInTheDocument();
  });
});
