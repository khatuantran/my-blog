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
              className={`-mb-px border-b-2 px-4 py-2 font-mono text-mono-sm transition-colors ${
                active ? 'border-cyan text-cyan' : 'border-transparent text-tm hover:text-ts'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1.5 rounded-sm bg-b2 px-1 py-0.5 font-mono text-[10px] text-tm">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
    </div>
  );
}
