import { apiFetch } from './client';
import type { Mood } from '@/lib/mood-config';

export type MetricBucket = {
  total: number;
  sparkline: number[];
  deltaToday: number;
};

export type AdminStats = {
  posts: MetricBucket;
  likes: MetricBucket;
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
