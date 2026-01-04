import { useQuery } from '@tanstack/react-query';
import type { ScreenerFilter, RankingWeights, LeaderStock, SelectedRankings } from '@/types';
import { DEFAULT_RANKING_WEIGHTS, DEFAULT_SELECTED_RANKINGS } from '@/types/screener';

// 스크리너 응답 타입
interface LeaderScreenerResponse {
  results: LeaderStock[];
  total: number;
  filter: ScreenerFilter;
  weights: RankingWeights;
  updatedAt: number;
  message?: string;
}

interface UseScreenerOptions {
  filter?: ScreenerFilter;
  weights?: RankingWeights;
  selectedRankings?: SelectedRankings;
  minRankingCount?: number;
  minScore?: number;
  limit?: number;
  enabled?: boolean;
}

async function fetchScreener(options: UseScreenerOptions): Promise<LeaderScreenerResponse> {
  const params = new URLSearchParams();

  // 필터 파라미터
  if (options.filter?.market) {
    params.set('market', options.filter.market);
  }

  // 가중치 파라미터
  const weights = options.weights || DEFAULT_RANKING_WEIGHTS;
  params.set('changeWeight', String(weights.changeWeight));
  params.set('turnoverWeight', String(weights.turnoverWeight));
  params.set('amountWeight', String(weights.amountWeight));
  params.set('foreignWeight', String(weights.foreignWeight));
  params.set('popularityWeight', String(weights.popularityWeight));

  // 선택된 순위 조건 파라미터
  const selectedRankings = options.selectedRankings || DEFAULT_SELECTED_RANKINGS;
  params.set('selectedRankings', JSON.stringify(selectedRankings));

  // 추가 필터
  if (options.minRankingCount) {
    params.set('minRankingCount', String(options.minRankingCount));
  }
  if (options.minScore) {
    params.set('minScore', String(options.minScore));
  }
  if (options.limit) {
    params.set('limit', String(options.limit));
  }

  const res = await fetch(`/api/screener?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch screener data');
  return res.json();
}

export function useScreener(options: UseScreenerOptions = {}) {
  const query = useQuery({
    queryKey: ['screener', options],
    queryFn: () => fetchScreener(options),
    enabled: options.enabled !== false,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000, // 1분마다 자동 갱신
  });

  return {
    data: query.data,
    results: query.data?.results ?? [],
    total: query.data?.total ?? 0,
    weights: query.data?.weights ?? DEFAULT_RANKING_WEIGHTS,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
