'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Star, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ThemeSummaryCards,
  ThemeFilters,
  ThemeGrid,
  ThemeDetailModal,
} from '@/components/themes';
import { useThemes } from '@/hooks/useThemes';
import { useFavoriteThemes } from '@/hooks/useFavoriteThemes';
import { useFavoriteThemeStore } from '@/stores/favoriteThemeStore';
import type { ThemeFilter } from '@/types';
import { DEFAULT_THEME_FILTER } from '@/types';

export default function ThemesPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<Partial<ThemeFilter>>(DEFAULT_THEME_FILTER);
  const [page, setPage] = useState(1);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 테마 목록 조회
  const { themes, summary, total, isLoading, isFetching, refetch } = useThemes({
    filter,
    page,
    pageSize: 20,
  });

  // 관심 테마 (로그인 사용자)
  const {
    favorites: serverFavorites,
    addFavorite: addServerFavorite,
    removeFavorite: removeServerFavorite,
    getFavoriteByThemeId,
  } = useFavoriteThemes({ enabled: !!session });

  // 관심 테마 (비로그인 사용자)
  const localStore = useFavoriteThemeStore();

  // 관심 테마 ID Set
  const favoriteThemeIds = useMemo(() => {
    if (session) {
      return new Set(serverFavorites.map((f) => f.themeId));
    }
    return new Set(localStore.favorites.map((f) => f.themeId));
  }, [session, serverFavorites, localStore.favorites]);

  // 관심 테마 토글
  const handleToggleFavorite = useCallback(
    (themeId: string, themeName: string) => {
      if (session) {
        const favorite = getFavoriteByThemeId(themeId);
        if (favorite) {
          removeServerFavorite(favorite.id);
        } else {
          addServerFavorite({ themeId, themeName });
        }
      } else {
        if (localStore.isFavorite(themeId)) {
          localStore.removeByThemeId(themeId);
        } else {
          localStore.addFavorite(themeId, themeName);
        }
      }
    },
    [session, getFavoriteByThemeId, removeServerFavorite, addServerFavorite, localStore]
  );

  // 필터 변경
  const handleFilterChange = useCallback((newFilter: Partial<ThemeFilter>) => {
    setFilter(newFilter);
    setPage(1); // 필터 변경 시 첫 페이지로
  }, []);

  // 필터 초기화
  const handleReset = useCallback(() => {
    setFilter(DEFAULT_THEME_FILTER);
    setPage(1);
  }, []);

  // 테마 상세 보기
  const handleViewDetail = useCallback((themeId: string) => {
    setSelectedThemeId(themeId);
    setIsModalOpen(true);
  }, []);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">오늘의 테마</h1>
          <p className="text-sm text-muted-foreground">
            네이버 금융 테마 데이터 기준
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`}
            />
            새로고침
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/themes/favorites">
              <Star className="h-4 w-4 mr-1" />
              관심 테마
              {favoriteThemeIds.size > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
                  {favoriteThemeIds.size}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <ThemeSummaryCards summary={summary} isLoading={isLoading} />

      {/* 필터 */}
      <ThemeFilters
        filter={filter}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* 테마 그리드 */}
      <ThemeGrid
        themes={themes}
        isLoading={isLoading}
        favoriteThemeIds={favoriteThemeIds}
        onToggleFavorite={handleToggleFavorite}
        onViewDetail={handleViewDetail}
      />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
          </Button>
        </div>
      )}

      {/* 테마 상세 모달 */}
      <ThemeDetailModal
        themeId={selectedThemeId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        isFavorite={selectedThemeId ? favoriteThemeIds.has(selectedThemeId) : false}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
