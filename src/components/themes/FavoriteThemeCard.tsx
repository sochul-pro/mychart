'use client';

import { memo } from 'react';
import Link from 'next/link';
import { GripVertical, X, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SparklineChart } from './SparklineChart';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useThemes';
import type { Theme, FavoriteTheme, SparklineData } from '@/types';

interface FavoriteThemeCardProps {
  favorite: FavoriteTheme;
  theme: Theme | null;
  sparklineData?: SparklineData[];
  onRemove: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export const FavoriteThemeCard = memo(function FavoriteThemeCard({
  favorite,
  theme,
  sparklineData = [],
  onRemove,
  isDragging = false,
  dragHandleProps,
}: FavoriteThemeCardProps) {
  // 테마 정보가 없거나 주도주가 없으면 실시간 조회
  const needsDetail = !theme || theme.leadingStocks.length === 0;
  const { theme: detailedTheme, isLoading: isLoadingDetail } = useTheme(
    needsDetail ? favorite.themeId : null
  );

  // 실제 사용할 테마 데이터 (상세 조회 결과 우선)
  const displayTheme = detailedTheme || theme;

  // 테마 정보가 없을 때 로딩 상태
  if (!displayTheme) {
    return (
      <Card className={isLoadingDetail ? "animate-pulse" : ""}>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <div {...dragHandleProps}>
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="font-bold">{favorite.themeName}</div>
            {isLoadingDetail ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                로딩 중...
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">테마 정보를 불러올 수 없습니다</div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(favorite.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        {isLoadingDetail && (
          <CardContent>
            <div className="h-32 bg-muted rounded" />
          </CardContent>
        )}
      </Card>
    );
  }

  const upRatio =
    displayTheme.stockCount > 0
      ? (displayTheme.advanceCount / displayTheme.stockCount) * 100
      : 0;

  // 스파크라인 데이터를 주도주별로 매핑
  const sparklineMap = new Map(
    sparklineData.map((s) => [s.symbol, s])
  );

  return (
    <Card
      className={cn(
        'transition-shadow',
        isDragging && 'shadow-lg ring-2 ring-primary',
        'border-l-4 border-purple-500'
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        {/* 드래그 핸들 */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing"
          role="button"
          tabIndex={0}
          aria-label="순서 변경"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* 테마 정보 */}
        <div className="flex-1">
          <h3 className="text-lg font-bold">{displayTheme.name}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{displayTheme.stockCount}종목</Badge>
            <span
              className={cn(
                'text-lg font-bold',
                displayTheme.changePercent > 0 && 'text-red-600',
                displayTheme.changePercent < 0 && 'text-blue-600'
              )}
            >
              {formatPercent(displayTheme.changePercent)}
            </span>
          </div>
        </div>

        {/* 삭제 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(favorite.id)}
          aria-label={`${displayTheme.name} 관심 해제`}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 상승/보합/하락 */}
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-red-600">
              <ArrowUp className="h-3 w-3" aria-hidden="true" />
              <span aria-label={`상승 ${displayTheme.advanceCount}개`}>{displayTheme.advanceCount}</span>
            </span>
            <span className="text-muted-foreground">─ {displayTheme.unchangedCount}</span>
            <span className="flex items-center gap-1 text-blue-600">
              <ArrowDown className="h-3 w-3" aria-hidden="true" />
              <span aria-label={`하락 ${displayTheme.declineCount}개`}>{displayTheme.declineCount}</span>
            </span>
          </div>
          <Progress value={upRatio} className="h-2" aria-label={`상승 종목 비율 ${Math.round(upRatio)}%`} />
        </div>

        {/* 주도주 + 스파크라인 */}
        <div className="space-y-2 border-t pt-3">
          {displayTheme.leadingStocks.slice(0, 3).map((stock) => {
            const sparkline = sparklineMap.get(stock.symbol);
            const prices = sparkline?.prices || generateMockSparkline(stock.changePercent);

            return (
              <Link
                key={stock.symbol}
                href={`/stocks/${stock.symbol}`}
                className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* 종목 정보 */}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{stock.name}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono">{formatPrice(stock.price)}원</span>
                    <span
                      className={cn(
                        'font-medium',
                        stock.changePercent > 0 && 'text-red-600',
                        stock.changePercent < 0 && 'text-blue-600'
                      )}
                    >
                      {formatPercent(stock.changePercent)}
                    </span>
                  </div>
                </div>

                {/* 스파크라인 */}
                <SparklineChart data={prices} width={60} height={24} />
              </Link>
            );
          })}

          {isLoadingDetail && displayTheme.leadingStocks.length === 0 && (
            <div className="flex items-center justify-center py-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              주도주 로딩 중...
            </div>
          )}

          {!isLoadingDetail && displayTheme.leadingStocks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-3">
              주도주 정보가 없습니다
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * 임시 스파크라인 데이터 생성 (20일)
 */
function generateMockSparkline(changePercent: number): number[] {
  const prices: number[] = [];
  let basePrice = 100;

  for (let i = 0; i < 20; i++) {
    // 랜덤 변동 + 전체 추세 반영
    const dailyChange = (Math.random() - 0.5) * 3 + changePercent / 20;
    basePrice = basePrice * (1 + dailyChange / 100);
    prices.push(basePrice);
  }

  return prices;
}
