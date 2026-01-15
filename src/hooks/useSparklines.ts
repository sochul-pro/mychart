import { useQueries } from '@tanstack/react-query';
import type { OHLCV, TimeFrame } from '@/types';

interface OHLCVResponse {
  symbol: string;
  timeFrame: TimeFrame;
  data: OHLCV[];
  provider: string;
}

/** 스파크라인용 간소화된 OHLCV */
export interface MiniOHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface SparklineResult {
  symbol: string;
  prices: number[];
  ohlcv: MiniOHLCV[];
  isLoading: boolean;
  error: Error | null;
}

async function fetchOHLCV(symbol: string, limit: number): Promise<OHLCV[]> {
  const res = await fetch(`/api/stocks/${symbol}/ohlcv?timeFrame=D&limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch OHLCV for ${symbol}`);
  }
  const data: OHLCVResponse = await res.json();
  return data.data;
}

/**
 * 여러 종목의 스파크라인 데이터를 가져오는 훅
 * @param symbols 종목 코드 배열
 * @param days 가져올 일수 (기본 20일)
 */
export function useSparklines(symbols: string[], days: number = 20) {
  const results = useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ['sparkline', symbol, days],
      queryFn: () => fetchOHLCV(symbol, days),
      enabled: !!symbol,
      staleTime: 5 * 60 * 1000, // 5분간 캐시
      gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
    })),
  });

  // symbol -> prices/ohlcv 매핑 생성
  const sparklineMap = new Map<string, number[]>();
  const ohlcvMap = new Map<string, MiniOHLCV[]>();
  const isLoading = results.some((r) => r.isLoading);

  symbols.forEach((symbol, index) => {
    const result = results[index];
    if (result.data && result.data.length > 0) {
      // 시간순 정렬 (오래된 것 -> 최신)
      const sorted = result.data
        .slice()
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      // 종가만 추출
      const prices = sorted.map((d) => d.close);
      sparklineMap.set(symbol, prices);

      // OHLCV 전체 (미니 캔들용)
      const ohlcv = sorted.map((d) => ({
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      ohlcvMap.set(symbol, ohlcv);
    }
  });

  return {
    sparklineMap,
    ohlcvMap,
    isLoading,
    results: symbols.map((symbol, index): SparklineResult => ({
      symbol,
      prices: sparklineMap.get(symbol) || [],
      ohlcv: ohlcvMap.get(symbol) || [],
      isLoading: results[index].isLoading,
      error: results[index].error as Error | null,
    })),
  };
}
