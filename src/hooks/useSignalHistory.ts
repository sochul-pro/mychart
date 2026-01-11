'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SignalHistoryItem {
  id: string;
  presetId: string;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  signalAt: string;
  reason?: string;
  indicators?: Record<string, number>;
  exitPrice?: number;
  exitAt?: string;
  returnPct?: number;
  holdingDays?: number;
  preset?: { name: string };
}

interface SignalHistoryResponse {
  history: SignalHistoryItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface HistoryFilters {
  symbol?: string;
  presetId?: string;
  type?: 'buy' | 'sell';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * 신호 히스토리 조회 훅
 */
export function useSignalHistory(filters: HistoryFilters = {}) {
  const queryClient = useQueryClient();

  const query = useQuery<SignalHistoryResponse>({
    queryKey: ['signalHistory', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.symbol) params.set('symbol', filters.symbol);
      if (filters.presetId) params.set('presetId', filters.presetId);
      if (filters.type) params.set('type', filters.type);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.limit) params.set('limit', String(filters.limit));
      if (filters.offset) params.set('offset', String(filters.offset));

      const res = await fetch(`/api/signals/history?${params}`);
      if (!res.ok) throw new Error('Failed to fetch signal history');
      return res.json();
    },
    staleTime: 60 * 1000, // 1분
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      presetId: string;
      symbol: string;
      type: 'buy' | 'sell';
      price: number;
      signalAt: string;
      reason?: string;
      indicators?: Record<string, number>;
    }) => {
      const res = await fetch('/api/signals/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create signal history');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalHistory'] });
    },
  });

  return {
    history: query.data?.history || [],
    total: query.data?.total || 0,
    hasMore: query.data?.hasMore || false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createHistory: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
