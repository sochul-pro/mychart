'use client';

import { memo } from 'react';
import { ThemeCard } from './ThemeCard';
import type { Theme } from '@/types';

interface ThemeGridProps {
  themes: Theme[];
  isLoading?: boolean;
  favoriteThemeIds?: Set<string>;
  onToggleFavorite?: (themeId: string, themeName: string) => void;
  onViewDetail?: (themeId: string) => void;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-80 bg-muted animate-pulse rounded-lg"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-muted-foreground">
        테마가 없습니다
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        다른 필터를 선택해보세요
      </p>
    </div>
  );
}

export const ThemeGrid = memo(function ThemeGrid({
  themes,
  isLoading,
  favoriteThemeIds = new Set(),
  onToggleFavorite,
  onViewDetail,
}: ThemeGridProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (themes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="theme-grid"
    >
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isFavorite={favoriteThemeIds.has(theme.id)}
          onToggleFavorite={onToggleFavorite}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
});
