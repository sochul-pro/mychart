'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Star, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Theme } from '@/types';

interface ThemeCardProps {
  theme: Theme;
  isFavorite?: boolean;
  onToggleFavorite?: (themeId: string, themeName: string) => void;
  onViewDetail?: (themeId: string) => void;
}

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export const ThemeCard = memo(function ThemeCard({
  theme,
  isFavorite = false,
  onToggleFavorite,
  onViewDetail,
}: ThemeCardProps) {
  const upRatio =
    theme.stockCount > 0
      ? (theme.advanceCount / theme.stockCount) * 100
      : 0;

  const isHot = theme.changePercent >= 3;
  const isCold = theme.changePercent <= -3;

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow',
        isHot && 'bg-red-500/5',
        isCold && 'bg-blue-500/5',
        isFavorite && 'border-l-4 border-purple-500'
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <h3 className="text-lg font-bold leading-tight">{theme.name}</h3>
          <Badge variant="secondary">{theme.stockCount}종목</Badge>
        </div>
        <div className="flex gap-1">
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleFavorite(theme.id, theme.name)}
            >
              <Star
                className={cn(
                  'h-4 w-4',
                  isFavorite && 'fill-yellow-400 text-yellow-400'
                )}
              />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 등락률 */}
        <div>
          <span
            className={cn(
              'text-3xl font-bold',
              theme.changePercent > 0 && 'text-red-500',
              theme.changePercent < 0 && 'text-blue-500'
            )}
          >
            {formatPercent(theme.changePercent)}
          </span>
        </div>

        {/* 상승/보합/하락 */}
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-red-500">
              <ArrowUp className="h-3 w-3" />
              {theme.advanceCount}
            </span>
            <span className="text-muted-foreground">─ {theme.unchangedCount}</span>
            <span className="flex items-center gap-1 text-blue-500">
              <ArrowDown className="h-3 w-3" />
              {theme.declineCount}
            </span>
          </div>
          <Progress value={upRatio} className="h-2" />
        </div>

        {/* 주도주 */}
        {theme.leadingStocks.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">주도주</span>
            <div className="space-y-1">
              {theme.leadingStocks.slice(0, 3).map((stock, index) => (
                <Link
                  key={stock.symbol}
                  href={`/stocks/${stock.symbol}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-4">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {stock.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {formatPrice(stock.price)}원
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        stock.changePercent > 0 && 'text-red-500',
                        stock.changePercent < 0 && 'text-blue-500'
                      )}
                    >
                      {formatPercent(stock.changePercent)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {onViewDetail && (
        <CardFooter className="justify-center pt-0">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onViewDetail(theme.id)}
          >
            상세보기
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
});
