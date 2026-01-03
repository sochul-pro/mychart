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

// 섹터 핫 종목에 필요한 종목별 시세 정보를 가져오는 훅
export function useSectorHotStocksData() {
  const { data, isLoading, error } = useSectorSummaries();

  // 모든 핫 종목의 시세 정보를 가져오기 위한 심볼 목록
  const allHotSymbols = data?.summaries.flatMap(s => s.hotStocks) ?? [];
  const uniqueSymbols = [...new Set(allHotSymbols)];

  const stockQuotesQuery = useQuery({
    queryKey: ['hotStockQuotes', uniqueSymbols.join(',')],
    queryFn: async () => {
      if (uniqueSymbols.length === 0) return {};

      // 각 종목의 정보와 시세를 가져옴
      const results: Record<string, { stock: StockInfo; quote: Quote }> = {};

      const promises = uniqueSymbols.map(async (symbol) => {
        try {
          const res = await fetch(`/api/stocks/${symbol}`);
          if (res.ok) {
            const data = await res.json();
            if (data.stock && data.quote) {
              results[symbol] = { stock: data.stock, quote: data.quote };
            }
          }
        } catch {
          // 개별 종목 조회 실패 무시
        }
      });

      await Promise.all(promises);
      return results;
    },
    staleTime: 30 * 1000,
    enabled: uniqueSymbols.length > 0,
  });

  return {
    summaries: data?.summaries ?? [],
    stockQuotes: stockQuotesQuery.data ?? {},
    isLoading: isLoading || stockQuotesQuery.isLoading,
    error: error || stockQuotesQuery.error,
  };
}
