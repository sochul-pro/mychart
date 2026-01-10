'use client';

import { useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FavoriteThemeCard } from '@/components/themes';
import { useThemes } from '@/hooks/useThemes';
import { useFavoriteThemes } from '@/hooks/useFavoriteThemes';
import { useFavoriteThemeStore } from '@/stores/favoriteThemeStore';
import type { FavoriteTheme, Theme } from '@/types';

export default function FavoriteThemesPage() {
  const { data: session } = useSession();

  // 관심 테마 (로그인 사용자)
  const {
    favorites: serverFavorites,
    removeFavorite: removeServerFavorite,
    isLoading: isServerLoading,
  } = useFavoriteThemes({ enabled: !!session });

  // 관심 테마 (비로그인 사용자)
  const localStore = useFavoriteThemeStore();

  // 실제 사용할 데이터 선택
  const favorites = session
    ? serverFavorites
    : localStore.favorites.map((f) => ({
        ...f,
        createdAt: f.createdAt,
      }));

  const isLoading = session ? isServerLoading : false;

  // 테마 목록 조회 (모든 테마)
  const { themes: allThemes } = useThemes({ pageSize: 100 });

  // 테마 ID -> 테마 데이터 매핑
  const themeMap = useMemo(() => {
    const map = new Map<string, Theme>();
    allThemes.forEach((theme) => {
      map.set(theme.id, theme);
    });
    return map;
  }, [allThemes]);

  // 관심 테마 삭제
  const handleRemove = useCallback(
    (id: string) => {
      if (session) {
        removeServerFavorite(id);
      } else {
        localStore.removeFavorite(id);
      }
    },
    [session, removeServerFavorite, localStore]
  );

  // 요약 정보
  const summary = useMemo(() => {
    let totalStocks = 0;
    let totalChange = 0;
    let count = 0;

    favorites.forEach((f) => {
      const theme = themeMap.get(f.themeId);
      if (theme) {
        totalStocks += theme.stockCount;
        totalChange += theme.changePercent;
        count++;
      }
    });

    return {
      themeCount: favorites.length,
      stockCount: totalStocks,
      avgChange: count > 0 ? totalChange / count : 0,
    };
  }, [favorites, themeMap]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-4 space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/themes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">관심 테마</h1>
            <p className="text-sm text-muted-foreground">
              {!session && '로그인하면 서버에 저장됩니다'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/themes">
            <Plus className="h-4 w-4 mr-1" />
            테마 추가
          </Link>
        </Button>
      </div>

      {/* 요약 */}
      {favorites.length > 0 && (
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-6 text-sm">
              <span>
                내 관심 테마 <strong>{summary.themeCount}</strong>개
              </span>
              <span>
                총 종목 <strong>{summary.stockCount}</strong>개
              </span>
              <span>
                평균{' '}
                <strong
                  className={
                    summary.avgChange > 0
                      ? 'text-red-600'
                      : summary.avgChange < 0
                      ? 'text-blue-600'
                      : ''
                  }
                >
                  {summary.avgChange > 0 ? '+' : ''}
                  {summary.avgChange.toFixed(2)}%
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 관심 테마 목록 */}
      {favorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              관심 테마가 없습니다
            </p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              테마 목록에서 ★ 버튼을 눌러 추가하세요
            </p>
            <Button asChild>
              <Link href="/themes">테마 둘러보기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((favorite) => (
            <FavoriteThemeCard
              key={favorite.id}
              favorite={favorite as FavoriteTheme}
              theme={themeMap.get(favorite.themeId) || null}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
