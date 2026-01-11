'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TradingStrategy, BacktestResult, BacktestConfig } from '@/lib/signals/types';

interface BacktestRequest {
  symbol: string;
  presetId?: string;
  strategy?: TradingStrategy;
  config: {
    startDate: string;
    endDate: string;
    initialCapital: number;
    commission: number;
    slippage: number;
  };
}

interface BacktestResponse {
  result: BacktestResult;
  runId?: string;
}

/**
 * 백테스트 실행 훅
 */
export function useBacktest() {
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<BacktestResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (request: BacktestRequest): Promise<BacktestResponse> => {
      const res = await fetch('/api/signals/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '백테스트 실행 중 오류가 발생했습니다.');
      }

      return res.json();
    },
    onSuccess: (data) => {
      setLastResult(data.result);
      queryClient.invalidateQueries({ queryKey: ['backtestHistory'] });
      queryClient.invalidateQueries({ queryKey: ['signalPresets'] });
    },
  });

  const runBacktest = (
    symbol: string,
    strategy: TradingStrategy,
    config: Partial<BacktestConfig> = {}
  ) => {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    return mutation.mutateAsync({
      symbol,
      strategy,
      config: {
        startDate: config.startDate?.toISOString() || oneYearAgo.toISOString(),
        endDate: config.endDate?.toISOString() || now.toISOString(),
        initialCapital: config.initialCapital || 10000000,
        commission: config.commission || 0.015,
        slippage: config.slippage || 0.1,
      },
    });
  };

  const runBacktestWithPreset = (
    symbol: string,
    presetId: string,
    config: Partial<BacktestConfig> = {}
  ) => {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    return mutation.mutateAsync({
      symbol,
      presetId,
      config: {
        startDate: config.startDate?.toISOString() || oneYearAgo.toISOString(),
        endDate: config.endDate?.toISOString() || now.toISOString(),
        initialCapital: config.initialCapital || 10000000,
        commission: config.commission || 0.015,
        slippage: config.slippage || 0.1,
      },
    });
  };

  return {
    runBacktest,
    runBacktestWithPreset,
    isRunning: mutation.isPending,
    error: mutation.error,
    lastResult,
    clearResult: () => setLastResult(null),
  };
}

/**
 * 백테스트 설정 상태 관리 훅
 */
export function useBacktestConfig(initialConfig?: Partial<BacktestConfig>) {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  const [config, setConfig] = useState<BacktestConfig>({
    symbol: '',
    startDate: oneYearAgo,
    endDate: now,
    initialCapital: 10000000,
    commission: 0.015,
    slippage: 0.1,
    positionSizing: 'percent',
    positionSize: 100,
    ...initialConfig,
  });

  const updateConfig = (updates: Partial<BacktestConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    const newNow = new Date();
    const newOneYearAgo = new Date(newNow);
    newOneYearAgo.setFullYear(newNow.getFullYear() - 1);

    setConfig({
      symbol: '',
      startDate: newOneYearAgo,
      endDate: newNow,
      initialCapital: 10000000,
      commission: 0.015,
      slippage: 0.1,
      positionSizing: 'percent',
      positionSize: 100,
    });
  };

  return {
    config,
    updateConfig,
    resetConfig,
  };
}

/**
 * 백테스트 히스토리 조회 훅
 */
export function useBacktestHistory(presetId?: string) {
  return useQuery({
    queryKey: ['backtestHistory', presetId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (presetId) params.set('presetId', presetId);

      const res = await fetch(`/api/signals/backtest/history?${params}`);
      if (!res.ok) throw new Error('Failed to fetch backtest history');
      return res.json();
    },
    enabled: !!presetId,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
