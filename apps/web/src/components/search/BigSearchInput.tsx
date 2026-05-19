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
    <div className="relative mx-auto w-full max-w-[720px]">
      <span
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-cyan"
      >
        ❯
      </span>
      <input
        type="search"
        aria-label="Search query"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-b2 bg-bg py-3 pl-12 pr-12 font-mono text-base text-tp outline-none transition-all placeholder:italic placeholder:text-td focus:border-cyan focus:shadow-glow-cyan-md"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-mono text-tm hover:text-tp"
        >
          ×
        </button>
      )}
    </div>
  );
}
