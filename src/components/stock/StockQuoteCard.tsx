'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StockInfo, Quote } from '@/types';

function formatMarketCap(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}조`;
  return `${value.toLocaleString()}억`;
}

function formatTradingValue(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(0)}억`;
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만`;
  return value.toLocaleString();
}

function normalizeStockName(name: string): string {
  if (name.includes('우선주')) {
    return name.replace('우선주', '') + '(우)';
  }
  return name.replace('보통주', '');
}

interface StockQuoteCardProps {
  info: StockInfo;
  quote: Quote;
  rightContent?: React.ReactNode;
  compact?: boolean;
}

export function StockQuoteCard({ info, quote, rightContent, compact = false }: StockQuoteCardProps) {
  return (
    <Card className={compact ? 'mb-4' : 'mb-6'}>
      <CardContent className={compact ? 'pt-4 pb-4' : 'pt-6'}>
        <div className={cn(
          'grid gap-4',
          !compact && 'grid-cols-1 lg:grid-cols-[1fr_280px] gap-6'
        )}>
          {/* 왼쪽: 종목 정보 + 현재가 + 기본 시세 정보 */}
          <div>
            {/* 종목 정보 */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h2 className={cn(
                    'font-bold',
                    compact ? 'text-lg' : 'text-xl sm:text-2xl'
                  )}>
                    {normalizeStockName(info.name)}
                  </h2>
                  <Badge variant="outline" className={compact ? 'text-xs' : ''}>{info.market}</Badge>
                  {info.sector && (
                    <Badge variant="secondary" className={compact ? 'text-xs' : ''}>{info.sector}</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-0.5">{info.symbol.slice(-6)}</p>
              </div>
              {rightContent}
            </div>

            {/* 현재가 */}
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-4">
              <span className={cn(
                'font-bold',
                compact ? 'text-2xl' : 'text-3xl sm:text-4xl'
              )}>
                {quote.price.toLocaleString()}
              </span>
              <span className={cn(
                'text-muted-foreground',
                compact ? 'text-sm' : 'text-base sm:text-lg'
              )}>원</span>
              <div
                className={cn(
                  'flex items-center gap-1 font-medium',
                  compact ? 'text-sm' : 'text-base sm:text-lg',
                  quote.changePercent > 0
                    ? 'text-red-500'
                    : quote.changePercent < 0
                    ? 'text-blue-500'
                    : ''
                )}
              >
                {quote.changePercent > 0 ? (
                  <ArrowUp className={compact ? 'h-3 w-3' : 'h-4 w-4 sm:h-5 sm:w-5'} />
                ) : quote.changePercent < 0 ? (
                  <ArrowDown className={compact ? 'h-3 w-3' : 'h-4 w-4 sm:h-5 sm:w-5'} />
                ) : null}
                {quote.change > 0 ? '+' : ''}
                {quote.change.toLocaleString()} ({quote.changePercent > 0 ? '+' : ''}
                {quote.changePercent.toFixed(2)}%)
              </div>
            </div>

            {/* OHLC + 거래량 + 거래대금 */}
            <div className={cn(
              'grid gap-3',
              compact ? 'grid-cols-3 mt-3' : 'grid-cols-3 sm:grid-cols-5 mt-6'
            )}>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">시가</p>
                <p className={cn('font-medium', compact ? 'text-xs' : 'text-sm sm:text-base')}>
                  {quote.open.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">고가</p>
                <p className={cn('font-medium text-red-500', compact ? 'text-xs' : 'text-sm sm:text-base')}>
                  {quote.high.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">저가</p>
                <p className={cn('font-medium text-blue-500', compact ? 'text-xs' : 'text-sm sm:text-base')}>
                  {quote.low.toLocaleString()}
                </p>
              </div>
              {!compact && (
                <>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">거래량</p>
                    <p className="font-medium text-sm sm:text-base">
                      {quote.volume >= 1000000
                        ? `${(quote.volume / 1000000).toFixed(1)}M`
                        : `${(quote.volume / 1000).toFixed(0)}K`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">거래대금</p>
                    <p className="font-medium text-sm sm:text-base">
                      {quote.tradingValue !== undefined
                        ? formatTradingValue(quote.tradingValue)
                        : '-'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* compact 모드: 투자 정보 (가로 배치) */}
            {compact && (quote.marketCap || quote.per || quote.high52w) && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3 pt-3 border-t">
                {quote.marketCap !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">시총</p>
                    <p className="text-xs font-medium">{formatMarketCap(quote.marketCap)}</p>
                  </div>
                )}
                {quote.per !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">PER</p>
                    <p className="text-xs font-medium">{quote.per.toFixed(2)}</p>
                  </div>
                )}
                {quote.pbr !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">PBR</p>
                    <p className="text-xs font-medium">{quote.pbr.toFixed(2)}</p>
                  </div>
                )}
                {quote.foreignHoldingRate !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">외인</p>
                    <p className="text-xs font-medium">{quote.foreignHoldingRate.toFixed(2)}%</p>
                  </div>
                )}
                {(quote.high52w !== undefined || quote.low52w !== undefined) && (
                  <div>
                    <p className="text-xs text-muted-foreground">52주</p>
                    <p className="text-xs font-medium">
                      <span className="text-red-500">{quote.high52w?.toLocaleString() ?? '-'}</span>
                      {'/'}
                      <span className="text-blue-500">{quote.low52w?.toLocaleString() ?? '-'}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽: 투자 정보 (확장 정보) - 일반 모드에서만 표시 */}
          {!compact && (quote.marketCap || quote.per || quote.high52w) && (
            <div className="border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
              <p className="text-sm font-semibold text-muted-foreground mb-3">투자 정보</p>
              <div className="space-y-2">
                {quote.marketCap !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">시가총액</span>
                    <span className="text-sm font-medium">{formatMarketCap(quote.marketCap)}</span>
                  </div>
                )}
                {quote.per !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">PER</span>
                    <span className="text-sm font-medium">{quote.per.toFixed(2)}</span>
                  </div>
                )}
                {quote.pbr !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">PBR</span>
                    <span className="text-sm font-medium">{quote.pbr.toFixed(2)}</span>
                  </div>
                )}
                {quote.foreignHoldingRate !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">외국인보유</span>
                    <span className="text-sm font-medium">{quote.foreignHoldingRate.toFixed(2)}%</span>
                  </div>
                )}
                {(quote.high52w !== undefined || quote.low52w !== undefined) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">52주 고/저</span>
                    <span className="text-sm font-medium">
                      <span className="text-red-500">{quote.high52w?.toLocaleString() ?? '-'}</span>
                      {' / '}
                      <span className="text-blue-500">{quote.low52w?.toLocaleString() ?? '-'}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
