import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IndicatorConfig } from '@/components/chart/indicators/types';
import type { TimeFrame, ChartSettings } from '@/types';

interface ProfileResponse {
  name: string | null;
  email: string;
}

async function fetchProfile(): Promise<ProfileResponse | null> {
  const res = await fetch('/api/user/profile');
  if (!res.ok) {
    if (res.status === 401) return null;
    throw new Error('Failed to fetch profile');
  }
  return res.json();
}

async function updateProfile(data: { name?: string }): Promise<ProfileResponse> {
  const res = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to update profile');
  }
  return res.json();
}

async function fetchChartSettings(): Promise<ChartSettings> {
  const res = await fetch('/api/chart-settings');
  if (!res.ok) {
    if (res.status === 401) {
      return getDefaultChartSettings();
    }
    throw new Error('Failed to fetch chart settings');
  }
  return res.json();
}

async function updateChartSettings(settings: Partial<ChartSettings>): Promise<ChartSettings> {
  const res = await fetch('/api/chart-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    throw new Error('Failed to update chart settings');
  }
  return res.json();
}

function getDefaultChartSettings(): ChartSettings {
  return {
    defaultInterval: 'D',
    indicators: [
      { type: 'sma', period: 5, color: '#2196F3', enabled: false },
      { type: 'sma', period: 10, color: '#FF9800', enabled: false },
      { type: 'sma', period: 20, color: '#4CAF50', enabled: true },
      { type: 'sma', period: 50, color: '#E91E63', enabled: true },
      { type: 'sma', period: 120, color: '#9C27B0', enabled: false },
      { type: 'bollinger', period: 20, stdDev: 2, color: '#9C27B0', enabled: false },
      { type: 'rsi', period: 14, overbought: 70, oversold: 30, color: '#E91E63', enabled: false },
      { type: 'macd', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, color: '#00BCD4', enabled: false },
      { type: 'stochastic', kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20, color: '#4CAF50', enabled: false },
    ],
    theme: 'dark',
  };
}

export function useUserSettings() {
  const queryClient = useQueryClient();

  // 프로필 쿼리
  const profileQuery = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
  });

  // 차트 설정 쿼리
  const chartSettingsQuery = useQuery({
    queryKey: ['chartSettings'],
    queryFn: fetchChartSettings,
    staleTime: 1000 * 60 * 5,
  });

  // 프로필 업데이트 뮤테이션
  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['userProfile'], data);
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });

  // 차트 설정 업데이트 뮤테이션
  const chartSettingsMutation = useMutation({
    mutationFn: updateChartSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['chartSettings'], data);
    },
    onError: (error) => {
      console.error('Failed to update chart settings:', error);
    },
  });

  // 통합 저장 함수
  const saveAllSettings = async (settings: {
    name?: string;
    defaultInterval?: TimeFrame;
    theme?: 'light' | 'dark';
    indicators?: IndicatorConfig[];
  }) => {
    const promises: Promise<unknown>[] = [];

    // 프로필 업데이트 (이름이 변경된 경우)
    if (settings.name !== undefined) {
      promises.push(profileMutation.mutateAsync({ name: settings.name }));
    }

    // 차트 설정 업데이트
    const chartUpdates: Partial<ChartSettings> = {};
    if (settings.defaultInterval !== undefined) {
      chartUpdates.defaultInterval = settings.defaultInterval;
    }
    if (settings.theme !== undefined) {
      chartUpdates.theme = settings.theme;
    }
    if (settings.indicators !== undefined) {
      chartUpdates.indicators = settings.indicators;
    }

    if (Object.keys(chartUpdates).length > 0) {
      promises.push(chartSettingsMutation.mutateAsync(chartUpdates));
    }

    await Promise.all(promises);
  };

  return {
    profile: profileQuery.data,
    chartSettings: chartSettingsQuery.data || getDefaultChartSettings(),
    isLoading: profileQuery.isLoading || chartSettingsQuery.isLoading,
    isSaving: profileMutation.isPending || chartSettingsMutation.isPending,
    saveError: profileMutation.error || chartSettingsMutation.error,
    saveAllSettings,
    updateProfile: profileMutation.mutate,
    updateChartSettings: chartSettingsMutation.mutate,
  };
}
