import { apiFetch } from './client';
import { env } from '@/lib/env';

export type ResourceType = 'image' | 'raw';

export type SignUploadDto = {
  folder?: string;
  publicId?: string;
  resourceType: ResourceType;
};

// ADR-010: provider chọn ở BE (STORAGE_DRIVER). local → field cloud rỗng + uploadUrl.
export type SignedUploadParams = {
  provider: 'cloudinary' | 'local';
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: ResourceType;
  publicId: string | null;
  uploadUrl?: string;
};

// Shape thống nhất 1 file đã upload (cloudinary direct hoặc local BE).
export type UploadedAsset = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  size: number;
  name: string;
  type: string;
};

export type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  original_filename?: string;
};

export function signUpload(dto: SignUploadDto): Promise<SignedUploadParams> {
  return apiFetch<SignedUploadParams>('/files/sign', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Upload binary trực tiếp lên Cloudinary với signed params.
// Cloudinary endpoint: https://api.cloudinary.com/v1_1/{cloud}/{resourceType}/upload
export async function uploadToCloudinary(
  file: File,
  signed: SignedUploadParams,
): Promise<CloudinaryUploadResult> {
  const url = `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', signed.apiKey);
  fd.append('timestamp', String(signed.timestamp));
  fd.append('signature', signed.signature);
  fd.append('folder', signed.folder);
  if (signed.publicId) fd.append('public_id', signed.publicId);

  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as CloudinaryUploadResult;
}

// Local driver (ADR-010): POST multipart lên BE (signed.uploadUrl) với cookie auth.
// BE trả `{ data: UploadedAsset }` (TransformInterceptor wrap).
async function uploadToLocal(file: File, signed: SignedUploadParams): Promise<UploadedAsset> {
  const base = env.VITE_API_URL.replace(/\/$/, '');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', signed.folder);
  fd.append('resourceType', signed.resourceType);
  if (signed.publicId) fd.append('publicId', signed.publicId);

  const res = await fetch(`${base}${signed.uploadUrl ?? '/files/upload'}`, {
    method: 'POST',
    body: fd,
    credentials: 'include',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Local upload failed (${res.status}): ${txt}`);
  }
  const json = (await res.json()) as { data: UploadedAsset };
  return json.data;
}

// Provider-aware upload: chọn nhánh theo signed.provider (BE là nguồn chân lý).
export async function uploadAsset(file: File, signed: SignedUploadParams): Promise<UploadedAsset> {
  if (signed.provider === 'local') {
    return uploadToLocal(file, signed);
  }
  const r = await uploadToCloudinary(file, signed);
  return {
    url: r.secure_url,
    publicId: r.public_id,
    width: r.width,
    height: r.height,
    size: r.bytes ?? file.size,
    name: r.original_filename ?? file.name,
    type: file.type || (r.format ?? ''),
  };
}
