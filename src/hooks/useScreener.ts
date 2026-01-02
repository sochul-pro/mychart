import { useQuery } from '@tanstack/react-query';
import type { ScreenerResponse, ScreenerFilter } from '@/types';

interface UseScreenerOptions {
  filter?: ScreenerFilter;
  sortBy?: 'score' | 'change_percent' | 'volume_ratio';
  limit?: number;
  enabled?: boolean;
}

async function fetchScreener(options: UseScreenerOptions): Promise<ScreenerResponse> {
  const params = new URLSearchParams();

  if (options.filter?.market) {
    params.set('market', options.filter.market);
  }
  if (options.filter?.sector) {
    params.set('sector', options.filter.sector);
  }
  if (options.filter?.minVolumeRatio !== undefined) {
    params.set('minVolumeRatio', String(options.filter.minVolumeRatio));
  }
  if (options.filter?.minChangePercent !== undefined) {
    params.set('minChangePercent', String(options.filter.minChangePercent));
  }
  if (options.filter?.maxChangePercent !== undefined) {
    params.set('maxChangePercent', String(options.filter.maxChangePercent));
  }
  if (options.filter?.onlyNewHigh) {
    params.set('onlyNewHigh', 'true');
  }
  if (options.sortBy) {
    params.set('sortBy', options.sortBy);
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
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
