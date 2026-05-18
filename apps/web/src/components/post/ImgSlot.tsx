// Cyberpunk placeholder mock — striped diagonal background + ⬡ glyph + label.
// Used as fallback khi <img> onError OR khi development chưa có image.
// Port từ design-file/myblog-components.jsx:143-159.

type Props = {
  idx?: number;
};

const SLOT_CFGS = [
  { bg: '#081420', acc: '#00FFE5', lbl: 'photo.01' },
  { bg: '#160820', acc: '#BB9AF7', lbl: 'photo.02' },
  { bg: '#081A0C', acc: '#9ECE6A', lbl: 'photo.03' },
  { bg: '#1E0C08', acc: '#FF9E64', lbl: 'photo.04' },
];

export function ImgSlot({ idx = 0 }: Props) {
  const { bg, acc, lbl } = SLOT_CFGS[idx % 4];
  return (
    <div
      role="img"
      aria-label={`Placeholder ${lbl}`}
      className="flex h-full w-full flex-col items-center justify-center gap-1.5"
      style={{
        background: `repeating-linear-gradient(135deg,${bg} 0px,${bg} 7px,${acc}10 7px,${acc}10 14px)`,
      }}
    >
      <span className="text-xl opacity-30">⬡</span>
      <span className="font-mono text-[9px]" style={{ color: acc, opacity: 0.45 }}>
        {lbl}
      </span>
    </div>
  );
}
