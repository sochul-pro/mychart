'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SignalAlert {
  id: string;
  presetId: string;
  symbols: string[];
  isActive: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  minPrice?: number;
  maxPrice?: number;
  preset?: { name: string };
  createdAt: string;
}

interface AlertNotification {
  id: string;
  alertId: string;
  symbol: string;
  signalType: 'buy' | 'sell';
  price: number;
  message: string;
  channel: string;
  sentAt: string;
  readAt?: string;
}

interface NotificationsResponse {
  notifications: AlertNotification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

/**
 * 알림 설정 관리 훅
 */
export function useSignalAlerts() {
  const queryClient = useQueryClient();

  // 알림 설정 목록 조회
  const alertsQuery = useQuery<SignalAlert[]>({
    queryKey: ['signalAlerts'],
    queryFn: async () => {
      const res = await fetch('/api/signals/alerts');
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return res.json();
    },
  });

  // 알림 설정 생성
  const createMutation = useMutation({
    mutationFn: async (data: {
      presetId: string;
      symbols?: string[];
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      minPrice?: number;
      maxPrice?: number;
    }) => {
      const res = await fetch('/api/signals/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create alert');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalAlerts'] });
    },
  });

  // 알림 설정 수정
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        symbols: string[];
        isActive: boolean;
        emailEnabled: boolean;
        pushEnabled: boolean;
        minPrice: number | null;
        maxPrice: number | null;
      }>;
    }) => {
      const res = await fetch(`/api/signals/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update alert');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalAlerts'] });
    },
  });

  // 알림 설정 삭제
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/signals/alerts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete alert');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalAlerts'] });
    },
  });

  return {
    alerts: alertsQuery.data || [],
    isLoading: alertsQuery.isLoading,
    error: alertsQuery.error,
    refetch: alertsQuery.refetch,
    createAlert: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateAlert: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteAlert: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * 알림 목록 조회 훅
 */
export function useAlertNotifications(unreadOnly: boolean = false) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery<NotificationsResponse>({
    queryKey: ['alertNotifications', unreadOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unreadOnly) params.set('unreadOnly', 'true');
      params.set('limit', '50');

      const res = await fetch(`/api/signals/alerts/notifications?${params}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    refetchInterval: 30 * 1000, // 30초마다 폴링
  });

  // 전체 읽음 처리
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/signals/alerts/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read-all' }),
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertNotifications'] });
    },
  });

  return {
    notifications: notificationsQuery.data?.notifications || [],
    total: notificationsQuery.data?.total || 0,
    unreadCount: notificationsQuery.data?.unreadCount || 0,
    hasMore: notificationsQuery.data?.hasMore || false,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    refetch: notificationsQuery.refetch,
    markAllAsRead: markAllReadMutation.mutate,
    isMarkingRead: markAllReadMutation.isPending,
  };
}
