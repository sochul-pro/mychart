'use client';

import { memo } from 'react';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ThemeSummary } from '@/types';

interface ThemeSummaryCardsProps {
  summary: ThemeSummary | null;
  isLoading?: boolean;
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export const ThemeSummaryCards = memo(function ThemeSummaryCards({
  summary,
  isLoading,
}: ThemeSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    {
      title: '핫 테마',
      icon: Flame,
      theme: summary.hotTheme,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-500/5',
    },
    {
      title: '급등 테마',
      icon: TrendingUp,
      theme: summary.topGainer,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500/5',
    },
    {
      title: '급락 테마',
      icon: TrendingDown,
      theme: summary.topLoser,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={cn(card.bgColor)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={cn('h-5 w-5', card.iconColor)} />
              <span className="text-sm font-medium text-muted-foreground">
                {card.title}
              </span>
            </div>
            {card.theme ? (
              <div>
                <h3 className="text-lg font-bold truncate">{card.theme.name}</h3>
                <span
                  className={cn(
                    'text-2xl font-bold',
                    card.theme.changePercent > 0 && 'text-red-500',
                    card.theme.changePercent < 0 && 'text-blue-500'
                  )}
                >
                  {formatPercent(card.theme.changePercent)}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">데이터 없음</p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* 요약 정보 */}
      <div className="md:col-span-3 flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span>전체 {summary.totalThemes}개 테마</span>
        <span className="text-red-500">상승 {summary.advanceThemes}</span>
        <span className="text-blue-500">하락 {summary.declineThemes}</span>
      </div>
    </div>
  );
});
