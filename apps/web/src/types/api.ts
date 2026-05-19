// API types — mirror BE DTOs trong apps/api/src.
// Sync với @prisma/client enums + DTOs trong posts/dto, comments/dto, likes/dto, saved/dto.

import type { Mood } from '@/lib/mood-config';
import type { FileType } from '@/lib/file-config';

export type Role = 'ADMIN' | 'USER' | 'BANNED';

export type Skill = { name: string; color: string };

export type AdminUser = {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  avatarUrl: string | null;
  title?: string | null;
  bio?: string | null;
  skills?: Skill[];
  createdAt: string;
};

export type ProfileUser = AdminUser;

export type ProfileStats = {
  postsCount: number;
  likesReceived: number;
  commentsReceived: number;
  viewsTotal: number;
  streak: number;
  heatmap28d: { date: string; count: number }[];
  moodBreakdown: Record<Mood, number>;
  tagsUsed: { name: string; color: string | null; count: number }[];
};

export type UpdateUserPayload = {
  email?: string;
  avatarUrl?: string;
  title?: string;
  bio?: string;
  skills?: Skill[];
};

export type SearchType = 'all' | 'posts' | 'files' | 'tags';

export type SearchStats = {
  totalPosts: number;
  withImages: number;
  withFiles: number;
  savedCount: number;
};

export type SearchParams = {
  q?: string;
  type?: SearchType;
  mood?: Mood;
  page?: number;
  limit?: number;
};

export type PaginatedUsers = {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
};

// Search response — depends on PaginatedPosts (declared below).
export type SearchResult = {
  posts: PaginatedPosts;
  files: { id: string; name: string; postId: string; type: string }[];
  tags: { id: string; name: string; color: string | null }[];
  stats: SearchStats;
};

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

export type Tag = {
  id: string;
  name: string;
  color: string | null;
  description?: string | null;
};

export type TagWithStats = Tag & {
  postCount: number;
  sparkline7d: number[];
  createdAt: string;
};

export type TagSort = 'name' | 'posts' | 'recent';

export type ListTagsParams = {
  limit?: number;
  sort?: TagSort;
  q?: string;
};

export type ListTagsResponse = {
  items: TagWithStats[];
};

export type CreateTagPayload = {
  name: string;
  color?: string;
  description?: string;
};

export type UpdateTagPayload = Partial<CreateTagPayload>;

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

export type PostSort = 'latest' | 'oldest' | 'likes';

export type ListPostsParams = {
  page?: number;
  limit?: number;
  mood?: Mood;
  tag?: string;
  sort?: PostSort;
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

export type ActivityType = 'POST_CREATED' | 'COMMENT_CREATED' | 'LIKE_CREATED' | 'SAVE_CREATED';
export type ActivityTargetType = 'POST' | 'COMMENT';
export type ActivityDirection = 'OUTGOING' | 'INCOMING';

export type ActivityItem = {
  id: string;
  type: ActivityType;
  direction: ActivityDirection;
  actor: { id: string; username: string; avatarUrl: string | null };
  target: { type: ActivityTargetType; id: string; snippet: string | null };
  createdAt: string;
};

export type PaginatedActivity = {
  items: ActivityItem[];
  total: number;
  page: number;
  limit: number;
};

export type ListActivityParams = {
  page?: number;
  limit?: number;
};

export type ToggleSaveResponse = {
  saved: boolean;
};
