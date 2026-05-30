import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { type Area } from 'react-easy-crop';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useUploadAvatar } from '@/hooks/mutations/use-avatar';
import type { AvatarResponse } from '@/services/api/avatar';

type Props = {
  open: boolean;
  imageSrc: string | null;
  username?: string;
  onClose: () => void;
  onSuccess: (avatar: AvatarResponse) => void;
};

const OUTPUT_SIZE = 400;

// Crop image to square Blob at OUTPUT_SIZE px via canvas. react-easy-crop trả
// croppedAreaPixels (source coords) — vẽ vùng đó vào canvas square OUTPUT_SIZE
// rồi toBlob.
async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2d context unavailable');
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob returned null'))),
      'image/jpeg',
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

export function AvatarUploadModal({ open, imageSrc, username, onClose, onSuccess }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const uploadMut = useUploadAvatar(username);
  const toast = useToast();

  // Reset crop/zoom mỗi lần mở modal mới
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open]);

  // Esc close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !uploadMut.isPending) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, uploadMut.isPending]);

  const onCropComplete = useCallback((_area: Area, areaPx: Area) => {
    setCroppedAreaPixels(areaPx);
  }, []);

  async function handleUpload() {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const result = await uploadMut.mutateAsync(blob);
      onSuccess(result);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      logger.error('Avatar upload failed', err);
      toast.showToast(`upload failed — ${msg}`, 'error');
    }
  }

  if (!open || !imageSrc) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upload avatar"
      className="z-modal fixed inset-0 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploadMut.isPending) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />

      <div
        className="animate-fade-up-sm relative w-full max-w-[480px] overflow-hidden rounded-lg border border-b2 bg-elev shadow-glow-cyan-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-b2 px-5 py-3">
          <div>
            <div className="font-mono text-[12px] text-cyan">// upload.avatar</div>
            <div className="mt-0.5 font-mono text-[11px] text-td">~/settings/avatar/crop</div>
          </div>
          <button
            type="button"
            aria-label="Close upload"
            onClick={onClose}
            disabled={uploadMut.isPending}
            className="border-none bg-transparent text-[24px] leading-none text-tm hover:text-tp disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Crop area 320x320 */}
          <div
            className="relative mx-auto overflow-hidden rounded-md border border-cyan/30 bg-bg"
            style={{ width: 320, height: 320 }}
            data-testid="avatar-crop-area"
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              showGrid={false}
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom slider */}
          <div className="mt-4">
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.05em] text-tm">
              zoom: {zoom.toFixed(1)}×
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom level"
              className="w-full accent-cyan"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-b2 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={uploadMut.isPending}
            className="rounded-md border border-b2 bg-elev px-5 py-2 font-mono text-[13px] text-tm hover:text-tp disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploadMut.isPending || !croppedAreaPixels}
            data-testid="avatar-upload-submit"
            className="rounded-md border-none bg-cyan px-5 py-2 font-mono text-[13px] font-semibold text-[#0A0E1A] shadow-[0_0_14px_rgba(0,255,229,0.3)] hover:shadow-[0_0_20px_rgba(0,255,229,0.4)] disabled:opacity-50"
          >
            {uploadMut.isPending ? '⠋ uploading...' : '↑ Upload'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
