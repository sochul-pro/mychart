import { useQuery } from '@tanstack/react-query';
import type {
  FearGreedData,
  VixData,
  IndexData,
  MarketSentimentResponse,
} from '@/app/api/market-sentiment/route';

export type { FearGreedData, VixData, IndexData, MarketSentimentResponse };

async function fetchMarketSentiment(): Promise<MarketSentimentResponse> {
  const res = await fetch('/api/market-sentiment');
  if (!res.ok) throw new Error('시장 심리 지표를 가져오는데 실패했습니다.');
  return res.json();
}

/**
 * 시장 심리 지표 조회 훅 (KOSPI, KOSDAQ, CNN Fear & Greed Index, VIX)
 */
export function useMarketSentiment(options: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: ['marketSentiment'],
    queryFn: fetchMarketSentiment,
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 갱신
  });

  return {
    data: query.data,
    kospi: query.data?.kospi ?? null,
    kosdaq: query.data?.kosdaq ?? null,
    fearGreed: query.data?.fearGreed ?? null,
    vix: query.data?.vix ?? null,
    updatedAt: query.data?.updatedAt ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
