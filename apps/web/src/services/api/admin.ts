import { apiFetch } from './client';
import type { Mood } from '@/lib/mood-config';
import type { Comment, CommentStatus } from '@/types/api';

export type AdminCommentItem = Comment & { post: { id: string; content: string } };
export type AdminCommentsResponse = {
  items: AdminCommentItem[];
  total: number;
  page: number;
  limit: number;
};

export type MetricBucket = {
  total: number;
  sparkline: number[];
  deltaToday: number;
};

export type AdminStats = {
  posts: MetricBucket;
  reactions: MetricBucket;
  comments: MetricBucket;
  views: MetricBucket;
};

export type MoodCount = {
  mood: Mood;
  count: number;
};

export type MoodsResponse = {
  items: MoodCount[];
};

export type HeatmapDay = {
  date: string;
  count: number;
};

export type HeatmapResponse = {
  days: HeatmapDay[];
};

export function getStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/admin/stats');
}

export function getMoods(): Promise<MoodsResponse> {
  return apiFetch<MoodsResponse>('/admin/moods');
}

export function getHeatmap(): Promise<HeatmapResponse> {
  return apiFetch<HeatmapResponse>('/admin/heatmap');
}

export function listAdminComments(
  params: {
    status?: CommentStatus;
    page?: number;
    limit?: number;
  } = {},
): Promise<AdminCommentsResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return apiFetch<AdminCommentsResponse>(`/admin/comments${s ? `?${s}` : ''}`);
}
