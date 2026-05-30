type Tab<T extends string> = {
  value: T;
  label: string;
  hidden?: boolean;
  count?: number;
};

type Props<T extends string> = {
  value: T;
  tabs: Tab<T>[];
  onChange: (value: T) => void;
};

export function TabButtons<T extends string>({ value, tabs, onChange }: Props<T>) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-b2">
      {tabs
        .filter((t) => !t.hidden)
        .map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(t.value)}
              className={`-mb-[2px] border-b-[3px] px-4 py-3 font-mono text-mono-lg transition-all ${
                active ? 'border-cyan text-cyan' : 'border-transparent text-tm hover:text-ts'
              }`}
              style={active ? { boxShadow: '0 3px 10px rgba(0,255,229,0.4)' } : undefined}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`ml-2 rounded-sm border px-1.5 py-0.5 font-mono text-[11px] ${
                    active ? 'border-cyan/40 bg-cyan/[0.08] text-cyan' : 'border-b2 bg-b1 text-tm'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
    </div>
  );
}
