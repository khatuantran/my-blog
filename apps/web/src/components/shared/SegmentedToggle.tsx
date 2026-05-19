type Option<T extends string> = {
  value: T;
  label: string;
  icon?: string;
};

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
};

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex gap-px rounded-sm border border-b2 bg-surf p-px"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
            onClick={() => onChange(opt.value)}
            className={`rounded-sm px-2 py-1 font-mono text-mono-xs transition-colors ${
              isActive ? 'bg-elev text-cyan' : 'text-tm hover:text-ts'
            }`}
          >
            {opt.icon && <span className="mr-1">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
