import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoodBadge } from '@/components/shared/MoodBadge';

describe('MoodBadge', () => {
  it('renders emoji + label cho HAPPY', () => {
    render(<MoodBadge mood="HAPPY" />);
    expect(screen.getByText(/😊 happy/)).toBeInTheDocument();
  });

  it('renders ANGRY với red color theme', () => {
    render(<MoodBadge mood="ANGRY" />);
    expect(screen.getByText(/😠 angry/)).toBeInTheDocument();
  });

  it('renders đủ 7 mood variants', () => {
    const moods = ['HAPPY', 'EXCITED', 'THOUGHTFUL', 'CALM', 'SAD', 'GRATEFUL', 'ANGRY'] as const;
    for (const m of moods) {
      const { unmount } = render(<MoodBadge mood={m} />);
      expect(screen.getByText(new RegExp(m.toLowerCase()))).toBeInTheDocument();
      unmount();
    }
  });
});
