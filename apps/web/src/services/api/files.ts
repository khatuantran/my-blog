import { apiFetch } from './client';

export type ResourceType = 'image' | 'raw';

export type SignUploadDto = {
  folder?: string;
  publicId?: string;
  resourceType: ResourceType;
};

export type SignedUploadParams = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: ResourceType;
  publicId: string | null;
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
