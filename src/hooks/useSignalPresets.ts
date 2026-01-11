'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Condition, SignalPresetWithStats } from '@/lib/signals/types';

interface CreatePresetData {
  name: string;
  description?: string;
  buyRules: Condition;
  sellRules: Condition;
}

interface UpdatePresetData {
  name?: string;
  description?: string | null;
  buyRules?: Condition;
  sellRules?: Condition;
  isActive?: boolean;
}

interface PresetsResponse {
  presets: SignalPresetWithStats[];
  defaultPresets: SignalPresetWithStats[];
}

export function useSignalPresets() {
  const queryClient = useQueryClient();

  // 프리셋 목록 조회
  const presetsQuery = useQuery<PresetsResponse>({
    queryKey: ['signalPresets'],
    queryFn: async () => {
      const res = await fetch('/api/signals/presets');
      if (!res.ok) throw new Error('Failed to fetch presets');
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10분
  });

  // 프리셋 생성
  const createMutation = useMutation({
    mutationFn: async (data: CreatePresetData) => {
      const res = await fetch('/api/signals/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create preset');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalPresets'] });
    },
  });

  // 프리셋 수정
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePresetData }) => {
      const res = await fetch(`/api/signals/presets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update preset');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalPresets'] });
    },
  });

  // 프리셋 삭제
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/signals/presets/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete preset');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalPresets'] });
    },
  });

  return {
    presets: presetsQuery.data?.presets || [],
    defaultPresets: presetsQuery.data?.defaultPresets || [],
    isLoading: presetsQuery.isLoading,
    error: presetsQuery.error,
    refetch: presetsQuery.refetch,

    createPreset: createMutation.mutate,
    createPresetAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updatePreset: updateMutation.mutate,
    updatePresetAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    deletePreset: deleteMutation.mutate,
    deletePresetAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}
