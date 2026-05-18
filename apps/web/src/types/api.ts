// API types — mirror BE DTOs trong apps/api/src.
// Sync với @prisma/client enums + DTOs trong posts/dto, comments/dto, likes/dto, saved/dto.

import type { Mood } from '@/lib/mood-config';
import type { FileType } from '@/lib/file-config';

export type Role = 'ADMIN' | 'USER';

export type CommentStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export type PostAuthor = {
  id: string;
  username: string;
  role: Role;
  avatarUrl: string | null;
};

export type PostTag = {
  id: string;
  name: string;
  color: string | null;
};

export type PostImage = {
  id: string;
  url: string;
  publicId: string;
  width: number;
  height: number;
  order: number;
};

export type PostFile = {
  id: string;
  name: string;
  type: FileType;
  size: number;
  url: string;
  publicId: string;
};

export type PostCounts = {
  likes: number;
  comments: number;
};

export type Post = {
  id: string;
  content: string;
  mood: Mood;
  viewCount: number;
  author: PostAuthor;
  tags: PostTag[];
  images: PostImage[];
  files: PostFile[];
  counts: PostCounts;
  createdAt: string;
  updatedAt: string;
  // Optional — BE có thể thêm `liked` / `saved` per-viewer flags trong tương lai.
  liked?: boolean;
  saved?: boolean;
};

export type PaginatedPosts = {
  items: Post[];
  total: number;
  page: number;
  limit: number;
};

export type ListPostsParams = {
  page?: number;
  limit?: number;
  mood?: Mood;
  tag?: string;
};

export type Comment = {
  id: string;
  postId: string;
  content: string;
  status: CommentStatus;
  author: PostAuthor | null;
  anonymousName: string | null;
  likeCount: number;
  liked?: boolean;
  createdAt: string;
};

export type PaginatedComments = {
  items: Comment[];
  total: number;
  page: number;
  limit: number;
};

export type CreateCommentDto = {
  content: string;
  anonymousName?: string;
};

export type TrackViewResponse = {
  viewCount: number;
  counted: boolean;
};

export type ToggleLikeResponse = {
  liked: boolean;
  count: number;
};

export type ToggleSaveResponse = {
  saved: boolean;
};
