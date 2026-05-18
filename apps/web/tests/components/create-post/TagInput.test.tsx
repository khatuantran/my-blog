import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput, type TagDraft } from '@/components/create-post/TagInput';

function Wrapper({ initial = [] }: { initial?: TagDraft[] }) {
  const [v, setV] = useState<TagDraft[]>(initial);
  return (
    <>
      <TagInput value={v} onChange={setV} />
      <div data-testid="count">{v.length}</div>
      <div data-testid="names">{v.map((t) => t.name).join(',')}</div>
    </>
  );
}

describe('TagInput', () => {
  it('Enter adds tag với # prefix render', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.type(screen.getByLabelText(/tag input/i), 'code{Enter}');
    expect(screen.getByText('#code')).toBeInTheDocument();
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('comma adds tag', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.type(screen.getByLabelText(/tag input/i), 'dev,');
    expect(screen.getByTestId('names')).toHaveTextContent('dev');
  });

  it('space adds tag', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.type(screen.getByLabelText(/tag input/i), 'ai ');
    expect(screen.getByTestId('names')).toHaveTextContent('ai');
  });

  it('dedup: cùng tên không add lần 2', async () => {
    const user = userEvent.setup();
    render(<Wrapper initial={[{ name: 'code', color: '#00FFE5' }]} />);
    await user.type(screen.getByLabelText(/tag input/i), 'code{Enter}');
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('strip # prefix khi user gõ #code{Enter}', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.type(screen.getByLabelText(/tag input/i), '#NodeJs{Enter}');
    expect(screen.getByTestId('names')).toHaveTextContent('nodejs');
    expect(screen.getByText('#nodejs')).toBeInTheDocument();
  });

  it('× button remove tag', async () => {
    const user = userEvent.setup();
    render(<Wrapper initial={[{ name: 'rm', color: '#00FFE5' }]} />);
    await user.click(screen.getByRole('button', { name: /remove tag #rm/i }));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
