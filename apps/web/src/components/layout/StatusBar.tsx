type Props = {
  path?: string;
  info?: string;
  online?: number;
};

const BUILD_SHA = import.meta.env.VITE_BUILD_SHA?.slice(0, 6) || 'a1b2c3';

// Section style — same border-right pattern as design-file Feed.html:461-480.
const SECTION = 'px-3.5 text-tm border-r border-b1 h-full flex items-center whitespace-nowrap';

export function StatusBar({ path = '~/feed', info, online = 3 }: Props) {
  return (
    <div
      data-slot="statusbar"
      role="status"
      aria-label="Application status bar"
      className="fixed bottom-0 left-0 right-0 h-[28px] bg-[#070A14] border-t border-b1 flex items-center z-50 font-mono text-mono-sm overflow-hidden"
    >
      <span className={`${SECTION} text-cyan bg-cyan/[0.07]`}>{path}</span>

      {info && <span className={SECTION}>{info}</span>}

      <span className={`${SECTION} text-td`}>──────</span>

      <span className={SECTION}>build: {BUILD_SHA}</span>

      <div className="ml-auto flex h-full">
        <span
          className={`${SECTION} text-grn border-l border-b1 border-r-0`}
          aria-label={`${online} users online`}
        >
          <span className="animate-pulse-status text-[8px] mr-1.5">●</span> {online} online
        </span>
        <span className="px-3.5 text-tm border-l border-b1 h-full flex items-center">
          [ v0.1.0 ]
        </span>
      </div>
    </div>
  );
}
