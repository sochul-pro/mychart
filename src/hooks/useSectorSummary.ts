'use client';

import { useQuery } from '@tanstack/react-query';
import type { SectorSummary, StockInfo, Quote } from '@/types';

interface SectorSummaryResponse {
  summaries: SectorSummary[];
  updatedAt: number;
}

interface SectorDetailResponse {
  sector: { code: string; name: string };
  summary: SectorSummary;
  stocks: (StockInfo & { quote?: Quote })[];
  updatedAt: number;
}

async function fetchSectorSummaries(): Promise<SectorSummaryResponse> {
  const res = await fetch('/api/sectors/summary');
  if (!res.ok) throw new Error('Failed to fetch sector summaries');
  return res.json();
}

async function fetchSectorDetail(code: string): Promise<SectorDetailResponse> {
  const res = await fetch(`/api/sectors/${code}`);
  if (!res.ok) throw new Error('Failed to fetch sector detail');
  return res.json();
}

export function useSectorSummaries() {
  return useQuery({
    queryKey: ['sectorSummaries'],
    queryFn: fetchSectorSummaries,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000, // 1분마다 갱신
  });
}

export function useSectorDetail(code: string) {
  return useQuery({
    queryKey: ['sectorDetail', code],
    queryFn: () => fetchSectorDetail(code),
    staleTime: 30 * 1000,
    enabled: !!code,
  });
}

// 섹터 핫 종목 데이터 훅 (종목명, 가격, 등락률 포함)
export function useSectorHotStocksData() {
  const { data, isLoading, error } = useSectorSummaries();

  return {
    summaries: data?.summaries ?? [],
    isLoading,
    error,
  };
}
