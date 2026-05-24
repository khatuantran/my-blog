// Post status configuration — label + color cho PostStatus enum (FR-15, M11.7).
// Sync với Prisma enum `PostStatus` ở docs/DATA_MODEL.md (T-320 sẽ tạo migration).
// Pattern mirror mood-config.ts.

export type PostStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export type PostStatusMeta = {
  label: string;
  color: string;
};

export const POST_STATUS_CFG: Record<PostStatus, PostStatusMeta> = {
  PUBLISHED: { label: 'PUBLISHED', color: '#9ECE6A' },
  DRAFT: { label: 'DRAFT', color: '#E0AF68' },
  ARCHIVED: { label: 'ARCHIVED', color: '#566176' },
};

export const POST_STATUS_KEYS: readonly PostStatus[] = ['PUBLISHED', 'DRAFT', 'ARCHIVED'] as const;
