import { ImgSlot } from '@/components/post/ImgSlot';

type Props = {
  url?: string;
  idx: number;
  onRemove: () => void;
  uploading?: boolean;
};

export function ImageThumb({ url, idx, onRemove, uploading }: Props) {
  return (
    <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-md">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <ImgSlot idx={idx} />
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/70 font-mono text-mono-xs text-cyan">
          …
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-none bg-bg/80 text-[10px] leading-none text-red"
      >
        ×
      </button>
    </div>
  );
}
