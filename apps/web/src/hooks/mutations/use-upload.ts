import { useMutation } from '@tanstack/react-query';
import {
  signUpload,
  uploadToCloudinary,
  type ResourceType,
  type CloudinaryUploadResult,
} from '@/services/api/files';

export type UploadedAsset = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  size: number;
  name: string;
  type: string;
};

// 2-step upload: sign từ BE → POST FormData lên Cloudinary trực tiếp.
export function useUploadFile(resourceType: ResourceType) {
  return useMutation<UploadedAsset, Error, { file: File; folder?: string }>({
    mutationFn: async ({ file, folder }) => {
      const signed = await signUpload({ resourceType, folder });
      const result: CloudinaryUploadResult = await uploadToCloudinary(file, signed);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        size: result.bytes ?? file.size,
        name: result.original_filename ?? file.name,
        type: file.type || (result.format ?? ''),
      };
    },
  });
}
