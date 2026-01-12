import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IndicatorConfig } from '@/components/chart/indicators/types';
import type { TimeFrame } from '@/types';

interface ChartSettings {
  defaultInterval: TimeFrame;
  indicators: IndicatorConfig[];
  signalStrategies: string[]; // 선택된 전략 ID 목록
  theme: 'light' | 'dark';
}

async function fetchChartSettings(): Promise<ChartSettings> {
  const res = await fetch('/api/chart-settings');
  if (!res.ok) {
    if (res.status === 401) {
      // 로그인하지 않은 경우 기본값 반환
      return getDefaultSettings();
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

function getDefaultSettings(): ChartSettings {
  return {
    defaultInterval: 'D',
    indicators: [
      { type: 'sma', period: 5, color: '#2196F3', enabled: false },
      { type: 'sma', period: 10, color: '#FF9800', enabled: false },
      { type: 'sma', period: 20, color: '#4CAF50', enabled: true },
      { type: 'sma', period: 60, color: '#E91E63', enabled: true },
      { type: 'sma', period: 120, color: '#9C27B0', enabled: false },
      { type: 'bollinger', period: 20, stdDev: 2, color: '#9C27B0', enabled: false },
      { type: 'rsi', period: 14, overbought: 70, oversold: 30, color: '#E91E63', enabled: false },
      { type: 'macd', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, color: '#00BCD4', enabled: false },
      { type: 'stochastic', kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20, color: '#4CAF50', enabled: false },
    ],
    signalStrategies: [],
    theme: 'light',
  };
}

export function useChartSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['chartSettings'],
    queryFn: fetchChartSettings,
    staleTime: 1000 * 60 * 5, // 5분간 캐시
  });

  const mutation = useMutation({
    mutationFn: updateChartSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['chartSettings'], data);
    },
  });

  const updateIndicators = (indicators: IndicatorConfig[]) => {
    mutation.mutate({ indicators });
  };

  const updateSignalStrategies = (signalStrategies: string[]) => {
    mutation.mutate({ signalStrategies });
  };

  const updateDefaultInterval = (defaultInterval: TimeFrame) => {
    mutation.mutate({ defaultInterval });
  };

  const updateTheme = (theme: 'light' | 'dark') => {
    mutation.mutate({ theme });
  };

  return {
    settings: settings || getDefaultSettings(),
    isLoading,
    isSaving: mutation.isPending,
    updateIndicators,
    updateSignalStrategies,
    updateDefaultInterval,
    updateTheme,
  };
}
