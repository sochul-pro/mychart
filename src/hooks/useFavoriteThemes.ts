import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FavoriteTheme, FavoriteThemeListResponse } from '@/types';

/**
 * 관심 테마 목록 조회
 */
async function fetchFavoriteThemes(): Promise<FavoriteThemeListResponse> {
  const res = await fetch('/api/themes/favorites');
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('로그인이 필요합니다.');
    }
    throw new Error('관심 테마 목록을 가져오는데 실패했습니다.');
  }
  return res.json();
}

/**
 * 관심 테마 추가
 */
async function addFavoriteTheme(data: {
  themeId: string;
  themeName: string;
}): Promise<FavoriteTheme> {
  const res = await fetch('/api/themes/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '관심 테마 추가에 실패했습니다.');
  }
  return res.json();
}

/**
 * 관심 테마 삭제
 */
async function removeFavoriteTheme(id: string): Promise<void> {
  const res = await fetch(`/api/themes/favorites/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '관심 테마 삭제에 실패했습니다.');
  }
}

/**
 * 관심 테마 순서 변경
 */
async function reorderFavoriteThemes(orderedIds: string[]): Promise<void> {
  const res = await fetch('/api/themes/favorites/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '순서 변경에 실패했습니다.');
  }
}

/**
 * 관심 테마 종목 설정 변경
 */
async function updateCustomStocks(data: {
  id: string;
  customStocks: string[] | null;
}): Promise<FavoriteTheme> {
  const res = await fetch(`/api/themes/favorites/${data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customStocks: data.customStocks }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '종목 설정 변경에 실패했습니다.');
  }
  return res.json();
}

interface UseFavoriteThemesOptions {
  enabled?: boolean;
}

/**
 * 관심 테마 관리 훅
 */
export function useFavoriteThemes(options: UseFavoriteThemesOptions = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['favoriteThemes'];

  // 목록 조회
  const query = useQuery({
    queryKey,
    queryFn: fetchFavoriteThemes,
    enabled: options.enabled !== false,
    staleTime: 30 * 1000,
  });

  // 추가 뮤테이션
  const addMutation = useMutation({
    mutationFn: addFavoriteTheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 삭제 뮤테이션
  const removeMutation = useMutation({
    mutationFn: removeFavoriteTheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 순서 변경 뮤테이션
  const reorderMutation = useMutation({
    mutationFn: reorderFavoriteThemes,
    onMutate: async (orderedIds) => {
      // 낙관적 업데이트
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FavoriteThemeListResponse>(queryKey);

      if (previous) {
        const reordered = orderedIds
          .map((id, index) => {
            const item = previous.favorites.find((f) => f.id === id);
            return item ? { ...item, order: index } : null;
          })
          .filter(Boolean) as FavoriteTheme[];

        queryClient.setQueryData<FavoriteThemeListResponse>(queryKey, {
          ...previous,
          favorites: reordered,
        });
      }

      return { previous };
    },
    onError: (err, orderedIds, context) => {
      // 롤백
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 종목 설정 변경 뮤테이션
  const updateCustomStocksMutation = useMutation({
    mutationFn: updateCustomStocks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 테마가 관심 목록에 있는지 확인
  const isFavorite = (themeId: string): boolean => {
    return query.data?.favorites.some((f) => f.themeId === themeId) ?? false;
  };

  // 관심 테마 ID로 데이터 찾기
  const getFavoriteByThemeId = (themeId: string): FavoriteTheme | undefined => {
    return query.data?.favorites.find((f) => f.themeId === themeId);
  };

  return {
    // 조회 관련
    favorites: query.data?.favorites ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,

    // 뮤테이션
    addFavorite: addMutation.mutate,
    removeFavorite: removeMutation.mutate,
    reorderFavorites: reorderMutation.mutate,
    updateCustomStocks: updateCustomStocksMutation.mutate,

    // 뮤테이션 상태
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isReordering: reorderMutation.isPending,
    isUpdatingCustomStocks: updateCustomStocksMutation.isPending,

    // 유틸리티
    isFavorite,
    getFavoriteByThemeId,
  };
}
