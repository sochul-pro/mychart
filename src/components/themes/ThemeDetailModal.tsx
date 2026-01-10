'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Star, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useThemes';
import type { Theme } from '@/types';

interface ThemeDetailModalProps {
  themeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (themeId: string, themeName: string) => void;
}

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export const ThemeDetailModal = memo(function ThemeDetailModal({
  themeId,
  open,
  onOpenChange,
  isFavorite = false,
  onToggleFavorite,
}: ThemeDetailModalProps) {
  const { theme, isLoading } = useTheme(open ? themeId : null);

  const upRatio =
    theme && theme.stockCount > 0
      ? (theme.advanceCount / theme.stockCount) * 100
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-4 w-full" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ) : theme ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">{theme.name}</DialogTitle>
                  <Badge variant="secondary" className="mt-1">
                    {theme.stockCount}종목
                  </Badge>
                </div>
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleFavorite(theme.id, theme.name)}
                  >
                    <Star
                      className={cn(
                        'h-5 w-5',
                        isFavorite && 'fill-yellow-400 text-yellow-400'
                      )}
                    />
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* 등락률 */}
              <div>
                <span
                  className={cn(
                    'text-4xl font-bold',
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
                    <ArrowUp className="h-4 w-4" />
                    상승 {theme.advanceCount}
                  </span>
                  <span className="text-muted-foreground">
                    보합 {theme.unchangedCount}
                  </span>
                  <span className="flex items-center gap-1 text-blue-500">
                    <ArrowDown className="h-4 w-4" />
                    하락 {theme.declineCount}
                  </span>
                </div>
                <Progress value={upRatio} className="h-2" />
              </div>

              {/* 주도주 목록 */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  주도주 TOP 5
                </h4>
                {theme.leadingStocks.length > 0 ? (
                  <div className="space-y-1">
                    {theme.leadingStocks.slice(0, 5).map((stock, index) => (
                      <Link
                        key={stock.symbol}
                        href={`/stocks/${stock.symbol}`}
                        onClick={() => onOpenChange(false)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-5">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-medium">{stock.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {stock.symbol}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {formatPrice(stock.price)}원
                          </div>
                          <div
                            className={cn(
                              'text-sm font-medium',
                              stock.changePercent > 0 && 'text-red-500',
                              stock.changePercent < 0 && 'text-blue-500'
                            )}
                          >
                            {formatPercent(stock.changePercent)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    주도주 정보를 불러오는 중...
                  </p>
                )}
              </div>

              {/* 네이버 금융 링크 */}
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a
                    href={`https://finance.naver.com/sise/sise_group_detail.naver?type=theme&no=${theme.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    네이버 금융에서 보기
                  </a>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            테마를 찾을 수 없습니다.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
