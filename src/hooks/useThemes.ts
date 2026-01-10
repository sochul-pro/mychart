import { useQuery } from '@tanstack/react-query';
import type {
  Theme,
  ThemeListResponse,
  ThemeFilter,
  ThemeSummary,
  ThemeStock,
  DEFAULT_THEME_FILTER,
} from '@/types';

interface ThemeStocksResponse {
  stocks: ThemeStock[];
  total: number;
  themeId: string;
}

interface UseThemesOptions {
  filter?: Partial<ThemeFilter>;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

async function fetchThemes(options: UseThemesOptions): Promise<ThemeListResponse> {
  const params = new URLSearchParams();

  // 페이지네이션
  params.set('page', String(options.page || 1));
  params.set('pageSize', String(options.pageSize || 20));

  // 필터
  if (options.filter?.type) {
    params.set('type', options.filter.type);
  }
  if (options.filter?.sortBy) {
    params.set('sortBy', options.filter.sortBy);
  }
  if (options.filter?.sortOrder) {
    params.set('sortOrder', options.filter.sortOrder);
  }
  if (options.filter?.search) {
    params.set('search', options.filter.search);
  }

  const res = await fetch(`/api/themes?${params.toString()}`);
  if (!res.ok) throw new Error('테마 목록을 가져오는데 실패했습니다.');
  return res.json();
}

/**
 * 테마 목록 조회 훅
 */
export function useThemes(options: UseThemesOptions = {}) {
  const query = useQuery({
    queryKey: ['themes', options],
    queryFn: () => fetchThemes(options),
    enabled: options.enabled !== false,
    staleTime: 60 * 1000, // 1분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 갱신
  });

  return {
    data: query.data,
    themes: query.data?.themes ?? [],
    summary: query.data?.summary ?? null,
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    pageSize: query.data?.pageSize ?? 20,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 단일 테마 조회 훅
 */
export function useTheme(themeId: string | null) {
  const query = useQuery({
    queryKey: ['theme', themeId],
    queryFn: async (): Promise<Theme> => {
      const res = await fetch(`/api/themes/${themeId}`);
      if (!res.ok) throw new Error('테마를 찾을 수 없습니다.');
      return res.json();
    },
    enabled: !!themeId,
    staleTime: 60 * 1000,
  });

  return {
    theme: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 테마 내 종목 조회 훅 (모멘텀 점수 기반)
 */
export function useThemeStocks(themeId: string | null, options: { top?: number; enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: ['themeStocks', themeId, options.top],
    queryFn: async (): Promise<ThemeStocksResponse> => {
      const params = new URLSearchParams();
      if (options.top) {
        params.set('top', String(options.top));
      }
      const res = await fetch(`/api/themes/${themeId}/stocks?${params.toString()}`);
      if (!res.ok) throw new Error('테마 종목을 가져오는데 실패했습니다.');
      return res.json();
    },
    enabled: !!themeId && options.enabled !== false,
    staleTime: 60 * 1000,
  });

  return {
    stocks: query.data?.stocks ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
