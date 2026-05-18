import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from '@/components/create-post/MarkdownEditor';

describe('MarkdownEditor', () => {
  it('renders textarea + 5 toolbar buttons + char counter', () => {
    render(<MarkdownEditor value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText(/post content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bold/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/italic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/inline code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/heading/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/link/i)).toBeInTheDocument();
    expect(screen.getByText(/0 chars/)).toBeInTheDocument();
  });

  it('typing → onChange + char count update', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState('');
      return (
        <>
          <MarkdownEditor value={v} onChange={setV} />
          <div data-testid="echo">{v}</div>
        </>
      );
    }
    render(<Controlled />);
    await user.type(screen.getByLabelText(/post content/i), 'hello');
    expect(screen.getByTestId('echo')).toHaveTextContent('hello');
    expect(screen.getByText(/5 chars/)).toBeInTheDocument();
  });

  it('click Bold với selection → wrap **text**', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<MarkdownEditor value="hello world" onChange={onChange} />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    ta.setSelectionRange(6, 11); // "world"
    await user.click(screen.getByLabelText(/bold/i));
    expect(onChange).toHaveBeenCalledWith('hello **world**');
  });

  it('click Heading khi value empty → prefix `# `', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);
    await user.click(screen.getByLabelText(/heading/i));
    expect(onChange).toHaveBeenCalledWith('# ');
  });
});
