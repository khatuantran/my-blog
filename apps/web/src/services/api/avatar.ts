import { apiFetch } from './client';
import { uploadToCloudinary, type SignedUploadParams } from './files';

// FR-11.7 — 3 endpoint cho User avatar upload/replace/remove self-scope.

export type AvatarResponse = {
  avatarUrl: string | null;
  avatarPublicId: string | null;
};

export function signAvatarUpload(): Promise<SignedUploadParams> {
  return apiFetch<SignedUploadParams>('/users/me/avatar/sign', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function setAvatar(url: string, publicId: string): Promise<AvatarResponse> {
  return apiFetch<AvatarResponse>('/users/me/avatar', {
    method: 'PATCH',
    body: JSON.stringify({ url, publicId }),
  });
}

export function removeAvatar(): Promise<AvatarResponse> {
  return apiFetch<AvatarResponse>('/users/me/avatar', {
    method: 'DELETE',
  });
}

// Full upload chain: sign → upload Cloudinary → save BE.
// blob: cropped image blob từ react-easy-crop canvas.toBlob.
// Filename arbitrary (Cloudinary publicId trong signed params overrides).
export async function uploadAvatarChain(blob: Blob): Promise<AvatarResponse> {
  const signed = await signAvatarUpload();
  const file = new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' });
  const cloud = await uploadToCloudinary(file, signed);
  return setAvatar(cloud.secure_url, cloud.public_id);
}
