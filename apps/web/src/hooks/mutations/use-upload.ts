import { useMutation } from '@tanstack/react-query';
import {
  signUpload,
  uploadAsset,
  type ResourceType,
  type UploadedAsset,
} from '@/services/api/files';

export type { UploadedAsset } from '@/services/api/files';

// 2-step upload (ADR-010 provider-aware): sign từ BE → upload theo provider
// (cloudinary direct | local BE multipart). Trả UploadedAsset thống nhất.
export function useUploadFile(resourceType: ResourceType) {
  return useMutation<UploadedAsset, Error, { file: File; folder?: string }>({
    mutationFn: async ({ file, folder }) => {
      const signed = await signUpload({ resourceType, folder });
      return uploadAsset(file, signed);
    },
  });
}
