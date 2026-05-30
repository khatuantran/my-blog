import type { ReactNode } from 'react';

type Props = {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  'aria-label'?: string;
};

export function FilterChip({ active = false, onClick, children, ...rest }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      aria-label={rest['aria-label']}
      onClick={onClick}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-3 py-1 font-mono text-mono transition-colors ${
        active
          ? 'border-cyan/50 bg-cyan/[0.08] text-cyan shadow-glow-cyan-sm'
          : 'border-b2 bg-surf text-tm hover:border-b3 hover:text-ts'
      }`}
    >
      {children}
    </button>
  );
}
