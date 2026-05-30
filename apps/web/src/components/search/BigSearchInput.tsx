type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function BigSearchInput({
  value,
  onChange,
  placeholder = 'search posts, #tags, files...',
  autoFocus,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-[820px]">
      <div className="mb-1.5 font-mono text-[11px] text-cyan">❯ search</div>
      <div className="relative">
        <input
          type="search"
          data-testid="big-search-input"
          aria-label="Search query"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full rounded-lg border border-b2 bg-bg py-3 pl-4 pr-[88px] font-brand text-[18px] text-tp outline-none transition-all placeholder:italic placeholder:text-td focus:border-cyan focus:shadow-glow-cyan-md [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value ? (
          <button
            type="button"
            data-testid="big-search-clear"
            aria-label="Clear search"
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-mono text-tm hover:text-tp"
          >
            ×
          </button>
        ) : (
          <span
            data-testid="big-search-cmdk-badge"
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-sm border border-b2 bg-elev px-1.5 py-0.5 font-mono text-[10px] text-td"
          >
            ⌘K
          </span>
        )}
      </div>
    </div>
  );
}
