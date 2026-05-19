import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillChipInput } from '@/components/shared/SkillChipInput';

describe('SkillChipInput', () => {
  it('Enter → add chip với color cycle palette', () => {
    const onChange = vi.fn();
    render(<SkillChipInput value={[]} onChange={onChange} />);
    const input = screen.getByLabelText(/add skill/i);
    fireEvent.change(input, { target: { value: 'TypeScript' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith([
      { name: 'TypeScript', color: expect.stringMatching(/^#/) },
    ]);
  });

  it('comma → add chip', () => {
    const onChange = vi.fn();
    render(<SkillChipInput value={[]} onChange={onChange} />);
    const input = screen.getByLabelText(/add skill/i);
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0][0].name).toBe('React');
  });

  it('duplicate name case-insensitive → no add', () => {
    const onChange = vi.fn();
    render(
      <SkillChipInput value={[{ name: 'TypeScript', color: '#7DCFFF' }]} onChange={onChange} />,
    );
    const input = screen.getByLabelText(/add skill/i);
    fireEvent.change(input, { target: { value: 'typescript' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Remove chip → onChange với filtered list', () => {
    const onChange = vi.fn();
    render(
      <SkillChipInput
        value={[
          { name: 'TS', color: '#7DCFFF' },
          { name: 'React', color: '#00FFE5' },
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText(/remove ts/i));
    expect(onChange).toHaveBeenCalledWith([{ name: 'React', color: '#00FFE5' }]);
  });

  it('Backspace với input empty → remove last chip', () => {
    const onChange = vi.fn();
    render(<SkillChipInput value={[{ name: 'TS', color: '#7DCFFF' }]} onChange={onChange} />);
    fireEvent.keyDown(screen.getByLabelText(/add skill/i), { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('max=20 → input disabled khi reached', () => {
    const skills = Array.from({ length: 20 }, (_, i) => ({ name: `s${i}`, color: '#00FFE5' }));
    render(<SkillChipInput value={skills} onChange={vi.fn()} max={20} />);
    expect(screen.getByLabelText(/add skill/i)).toBeDisabled();
  });
});
