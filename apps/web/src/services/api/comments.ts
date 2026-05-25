import { apiFetch } from './client';
import type {
  Comment,
  CommentRepliesResponse,
  CreateCommentDto,
  PaginatedComments,
} from '@/types/api';

export function listPostComments(
  postId: string,
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedComments> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return apiFetch<PaginatedComments>(
    `/posts/${encodeURIComponent(postId)}/comments${s ? `?${s}` : ''}`,
  );
}

export function createComment(postId: string, dto: CreateCommentDto): Promise<Comment> {
  return apiFetch<Comment>(`/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function listCommentReplies(
  commentId: string,
  params: { page?: number; limit?: number } = {},
): Promise<CommentRepliesResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return apiFetch<CommentRepliesResponse>(
    `/comments/${encodeURIComponent(commentId)}/replies${s ? `?${s}` : ''}`,
  );
}
