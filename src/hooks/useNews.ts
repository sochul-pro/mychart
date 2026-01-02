import { useQuery } from '@tanstack/react-query';
import type { News } from '@/types';

interface UseNewsOptions {
  symbol?: string;
  symbols?: string[];
  query?: string;
  limit?: number;
  enabled?: boolean;
}

interface NewsResponse {
  news: News[];
  total: number;
}

async function fetchNews(options: UseNewsOptions): Promise<NewsResponse> {
  const params = new URLSearchParams();

  if (options.symbol) {
    params.set('symbol', options.symbol);
  }
  if (options.symbols?.length) {
    params.set('symbols', options.symbols.join(','));
  }
  if (options.query) {
    params.set('query', options.query);
  }
  if (options.limit) {
    params.set('limit', String(options.limit));
  }

  const res = await fetch(`/api/news?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

export function useNews(options: UseNewsOptions = {}) {
  const query = useQuery({
    queryKey: ['news', options],
    queryFn: () => fetchNews(options),
    enabled: options.enabled !== false,
    staleTime: 60 * 1000, // 1분
  });

  return {
    news: query.data?.news ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
