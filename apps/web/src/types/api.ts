// API types — mirror BE DTOs trong apps/api/src.
// Sync với @prisma/client enums + DTOs trong posts/dto, comments/dto, reactions/dto, saved/dto.

import type { Mood } from '@/lib/mood-config';
import type { FileType } from '@/lib/file-config';

// Re-export enum-like types từ lib config để `@/types/api` là barrel duy nhất cho FE.
export type { Mood } from '@/lib/mood-config';

export type Role = 'ADMIN' | 'USER' | 'BANNED';

export type Skill = { name: string; color: string };

export type AdminUser = {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  avatarUrl: string | null;
  avatarPublicId?: string | null;
  title?: string | null;
  bio?: string | null;
  skills?: Skill[];
  name?: string | null;
  location?: string | null;
  bornYear?: number | null;
  github?: string | null;
  website?: string | null;
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
  username?: string; // FR-11.9: đổi handle (3-32, [a-zA-Z0-9_-], unique)
  email?: string;
  avatarUrl?: string;
  title?: string;
  bio?: string;
  skills?: Skill[];
  name?: string;
  location?: string;
  bornYear?: number;
  github?: string;
  website?: string;
};

export type SearchType = 'all' | 'posts' | 'files' | 'tags' | 'saved';

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
  name?: string | null; // FR-11.8 display name — hiển thị thay username ở feed/detail/comment
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
  reactions: number;
  comments: number;
};

export const REACTION_TYPES = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

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
  topReactions: ReactionType[];
  myReaction: ReactionType | null;
  createdAt: string;
  updatedAt: string;
  // Optional — BE có thể thêm `saved` per-viewer flag trong tương lai.
  saved?: boolean;
};

export type PaginatedPosts = {
  items: Post[];
  total: number;
  page: number;
  limit: number;
};

export type PostSort = 'latest' | 'oldest' | 'likes';

export type PostStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export type AdminPost = Post & { status: PostStatus };

export type PaginatedAdminPosts = {
  items: AdminPost[];
  total: number;
  page: number;
  limit: number;
};

export type ListAdminPostsParams = {
  status?: PostStatus;
  mood?: Mood;
  sort?: PostSort;
  q?: string;
  page?: number;
  limit?: number;
};

export type UpdateAdminPostPayload = {
  status?: PostStatus;
  mood?: Mood;
  content?: string;
  tags?: string[];
};

// FR-18: Interaction trace log (admin)
export type InteractionAction = 'COMMENT' | 'REPLY' | 'COMMENT_LIKE' | 'POST_REACTION';
export type InteractionTargetType = 'POST' | 'COMMENT';
export type InteractionActorType = 'anon' | 'user';

export type InteractionLog = {
  id: string;
  action: InteractionAction;
  targetType: InteractionTargetType;
  targetId: string;
  postId: string | null;
  actor: { id: string; username: string } | null;
  actorRole: Role | null;
  anonymousId: string | null;
  ip: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  acceptLang: string | null;
  referer: string | null;
  geoCountry: string | null;
  geoCity: string | null;
  fingerprint: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type PaginatedInteractionLogs = {
  items: InteractionLog[];
  total: number;
  page: number;
  limit: number;
};

export type ListInteractionLogsParams = {
  action?: InteractionAction;
  actorType?: InteractionActorType;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

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
  likesCount: number; // BE/openapi field = likesCount (was mistyped likeCount → undefined → NaN, BUG-016)
  liked?: boolean;
  parentId?: string | null;
  replyTo?: { username: string; isAnon: boolean } | null;
  // Top-level comment includes replies preview (max 3) + replyCount (FR-03.6)
  replies?: Comment[];
  replyCount?: number;
  createdAt: string;
};

export type PaginatedComments = {
  items: Comment[];
  total: number;
  page: number;
  limit: number;
};

export type CommentRepliesResponse = {
  items: Comment[];
  total: number;
  page: number;
  limit: number;
};

export type CreateCommentDto = {
  content: string;
  anonymousName?: string;
  parentId?: string;
};

export type TrackViewResponse = {
  viewCount: number;
  counted: boolean;
};

export type ToggleLikeResponse = {
  liked: boolean;
  count: number;
};

export type TotalReactionCounts = Record<ReactionType, number>;

export type UpsertReactionResponse = {
  type: ReactionType;
  totalCounts: TotalReactionCounts;
  topThree: ReactionType[];
};

export type ReactionCountsResponse = {
  totalCounts: TotalReactionCounts;
  topThree: ReactionType[];
  total: number;
  myReaction: ReactionType | null;
};

export type ReactionListItem = {
  actor: { id: string; username: string; avatarUrl: string | null } | null;
  type: ReactionType;
  createdAt: string;
};

export type ReactionListResponse = {
  items: ReactionListItem[];
  total: number;
  page: number;
  limit: number;
  byType: TotalReactionCounts;
};

export type ListReactionsParams = {
  type?: ReactionType;
  page?: number;
  limit?: number;
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

// Notification types (FR-14)
export type NotificationType = 'REACTION' | 'COMMENT' | 'REPLY' | 'SHARE';

export type NotificationActor = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

export type NotificationMetadata = {
  reactionType?: string;
  replyTo?: { username: string };
  /** T-403: post.content snippet (REACTION/SHARE) hoặc comment.content (COMMENT/REPLY) — strip HTML + truncate 80 chars. */
  snippet?: string;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  actor: NotificationActor | null;
  targetType: string;
  targetId: string;
  postId?: string;
  read: boolean;
  metadata?: NotificationMetadata;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
};

export type UnreadCountResponse = {
  count: number;
};

export type MarkReadResponse = {
  id: string;
  read: boolean;
};

export type MarkAllReadResponse = {
  updated: number;
};

export type BulkDeleteNotificationsResponse = {
  deleted: number;
};

export type BulkMarkReadResponse = {
  updated: number;
};

export type DeleteAllNotificationsResponse = {
  deleted: number;
};

export type ListNotificationsParams = {
  filter?: 'all' | 'unread';
  page?: number;
  limit?: number;
};
