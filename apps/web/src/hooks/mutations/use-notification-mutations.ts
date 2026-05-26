import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  bulkMarkNotificationsRead,
  deleteAllNotifications,
} from '@/services/api/notifications';
import { qk } from '@/lib/query-keys';

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => markNotificationRead(id, read),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
  });
}

export function useBulkMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkMarkNotificationsRead(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
  });
}

export function useDeleteAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications.all });
    },
  });
}
