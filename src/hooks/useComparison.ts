import { useQuery } from '@tanstack/react-query';
import type { ComparePeriod, ComparisonData } from '@/types/comparison';

interface UseComparisonOptions {
  symbols: string[];
  period?: ComparePeriod;
  enabled?: boolean;
}

/**
 * 비교 데이터 조회 API 호출
 */
async function fetchComparisonData(
  symbols: string[],
  period: ComparePeriod
): Promise<ComparisonData> {
  const symbolsParam = symbols.join(',');
  const res = await fetch(`/api/compare/data?symbols=${symbolsParam}&period=${period}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || '비교 데이터를 불러오는데 실패했습니다.');
  }

  return res.json();
}

/**
 * 비교 데이터 조회 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useComparison({
 *   symbols: ['005930', '000660', 'KOSPI'],
 *   period: '6M',
 * });
 * ```
 */
export function useComparison(options: UseComparisonOptions) {
  const { symbols, period = '6M', enabled = true } = options;

  return useQuery({
    queryKey: ['comparison', 'data', [...symbols].sort().join(','), period],
    queryFn: () => fetchComparisonData(symbols, period),
    enabled: enabled && symbols.length > 0,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });
}

/**
 * 개별 지수 OHLCV 조회
 */
async function fetchIndexOHLCV(
  code: string,
  period: ComparePeriod
): Promise<{ code: string; name: string; data: unknown[] }> {
  const res = await fetch(`/api/indices/${code}/ohlcv?period=${period}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || '지수 데이터를 불러오는데 실패했습니다.');
  }

  return res.json();
}

/**
 * 지수 OHLCV 조회 훅
 */
export function useIndexOHLCV(options: { code: string; period?: ComparePeriod; enabled?: boolean }) {
  const { code, period = '6M', enabled = true } = options;

  return useQuery({
    queryKey: ['index', 'ohlcv', code, period],
    queryFn: () => fetchIndexOHLCV(code, period),
    enabled: enabled && !!code,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 지수 목록 조회 훅
 */
export function useIndices() {
  return useQuery({
    queryKey: ['indices', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/indices');
      if (!res.ok) {
        throw new Error('지수 목록을 불러오는데 실패했습니다.');
      }
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // 1시간 캐시 (목록은 자주 바뀌지 않음)
  });
}
