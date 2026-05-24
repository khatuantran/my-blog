import { apiFetch } from './client';
import type {
  BulkDeleteNotificationsResponse,
  ListNotificationsParams,
  MarkAllReadResponse,
  MarkReadResponse,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types/api';

export function listNotifications(
  params: ListNotificationsParams = {},
): Promise<NotificationListResponse> {
  const search = new URLSearchParams();
  if (params.filter) search.set('filter', params.filter);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ''}`);
}

export function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiFetch<UnreadCountResponse>('/notifications/unread-count');
}

export function markNotificationRead(id: string, read: boolean): Promise<MarkReadResponse> {
  return apiFetch<MarkReadResponse>(`/notifications/${id}/read`, {
    method: 'PATCH',
    body: JSON.stringify({ read }),
  });
}

export function markAllNotificationsRead(): Promise<MarkAllReadResponse> {
  return apiFetch<MarkAllReadResponse>('/notifications/mark-all-read', {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

export function deleteNotification(id: string): Promise<void> {
  return apiFetch<void>(`/notifications/${id}`, { method: 'DELETE' });
}

export function bulkDeleteNotifications(ids: string[]): Promise<BulkDeleteNotificationsResponse> {
  return apiFetch<BulkDeleteNotificationsResponse>('/notifications/bulk', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
}
