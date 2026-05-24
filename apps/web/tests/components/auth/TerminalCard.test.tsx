import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TerminalCard } from '@/components/auth/TerminalCard';

describe('TerminalCard', () => {
  it('renders path + cursor blink by default', () => {
    render(
      <MemoryRouter>
        <TerminalCard path="~/auth/login">content</TerminalCard>
      </MemoryRouter>,
    );
    expect(screen.getByText('~/auth/login')).toBeInTheDocument();
    expect(screen.getByText('_')).toBeInTheDocument();
  });

  it('hides cursor blink when cursorBlink=false', () => {
    render(
      <MemoryRouter>
        <TerminalCard path="~/auth/login" cursorBlink={false}>
          content
        </TerminalCard>
      </MemoryRouter>,
    );
    expect(screen.queryByText('_')).not.toBeInTheDocument();
  });

  it('regression BUG-003: scan stripe runs scanCardStripe 4s (NOT 6s, NOT translateY)', () => {
    const { container } = render(
      <MemoryRouter>
        <TerminalCard path="~/auth/login">content</TerminalCard>
      </MemoryRouter>,
    );
    const stripe = container.querySelector('[aria-hidden="true"]');
    expect(stripe).toBeInTheDocument();
    expect((stripe as HTMLElement).style.animation).toContain('scanCardStripe 4s');
    expect((stripe as HTMLElement).style.animation).not.toContain('6s');
  });
});
