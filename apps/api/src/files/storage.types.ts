// Storage driver abstraction (ADR-010) — Cloudinary (prod, signed direct upload) vs
// Local volume (dev, upload qua BE + serve tĩnh). DB publicId provider-agnostic.

export type StorageResourceType = 'image' | 'raw';
export type StorageProvider = 'cloudinary' | 'local';

// Trả về cho FE từ POST /files/sign. cloudinary: dùng signature upload thẳng Cloudinary.
// local: field cloud rỗng + uploadUrl → FE POST multipart lên BE.
export interface SignedUploadParams {
  provider: StorageProvider;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: StorageResourceType;
  publicId: string | null;
  /** Chỉ local: endpoint multipart để FE upload (vd '/files/upload'). */
  uploadUrl?: string;
}

export interface StorageAsset {
  publicId: string;
  resourceType: StorageResourceType;
}

// Kết quả 1 file đã lưu (local saveUpload). Khớp shape UploadedAsset của FE.
export interface UploadedAsset {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  size: number;
  name: string;
  type: string;
}

export interface SaveUploadInput {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  size: number;
  folder: string;
  publicId?: string;
  resourceType: StorageResourceType;
}

export interface StorageDriver {
  readonly provider: StorageProvider;
  signUpload(opts: {
    folder?: string;
    publicId?: string;
    resourceType: StorageResourceType;
  }): SignedUploadParams;
  destroyMany(assets: StorageAsset[]): Promise<void>;
  /** Lưu file (local). Cloudinary driver không hỗ trợ (dùng direct upload). */
  saveUpload(input: SaveUploadInput): Promise<UploadedAsset>;
}
