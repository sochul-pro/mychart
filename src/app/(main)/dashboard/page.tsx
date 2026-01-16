'use client';

import Link from 'next/link';
import { TrendingUp, Star, Newspaper, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsFeed } from '@/components/news';
import { MarketSentimentWidget } from '@/components/dashboard';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useScreener } from '@/hooks/useScreener';
import { useQueries } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export default function DashboardPage() {
  const { groups, isLoading: watchlistLoading } = useWatchlist();
  const { results: topStocks, isLoading: screenerLoading } = useScreener({
    limit: 5,
  });

  // 관심종목에서 모든 종목 추출 (최대 5개)
  const watchlistItems = groups
    .flatMap((g) => g.items.map((i) => ({ symbol: i.symbol, name: i.name })))
    .slice(0, 5);
  const watchlistSymbols = watchlistItems.map((i) => i.symbol);

  // 관심종목 시세 조회
  const stockQueries = useQueries({
    queries: watchlistItems.map((item) => ({
      queryKey: ['stock', 'data', item.symbol],
      queryFn: async () => {
        const res = await fetch(`/api/stocks/${item.symbol}`);
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      },
      enabled: !watchlistLoading && watchlistItems.length > 0,
      staleTime: 30 * 1000,
    })),
  });

  const watchlistStocks: WatchlistStock[] = watchlistItems
    .map((item, index) => {
      const query = stockQueries[index];
      if (!query?.data?.quote) return null;
      return {
        symbol: item.symbol,
        name: item.name,
        price: query.data.quote.price,
        changePercent: query.data.quote.changePercent,
      };
    })
    .filter((s): s is WatchlistStock => s !== null);

  const watchlistQuotesLoading = stockQueries.some((q) => q.isLoading);

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">대시보드</h1>

      {/* 시장 심리 지표 */}
      <div className="mb-4 sm:mb-6">
        <MarketSentimentWidget />
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 관심종목 요약 */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              관심종목
            </CardTitle>
            <Link href="/watchlist">
              <Button variant="ghost" size="sm">
                더보기
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {watchlistLoading || watchlistQuotesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-2">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : watchlistItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  관심종목이 없습니다.
                </p>
                <Link href="/watchlist">
                  <Button variant="outline" size="sm">
                    관심종목 추가하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {watchlistStocks.map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/stocks/${stock.symbol}`}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{stock.name}</p>
                      <p className="text-xs text-muted-foreground">{stock.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {stock.price.toLocaleString()}원
                      </p>
                      <p
                        className={cn(
                          'flex items-center justify-end gap-0.5 text-xs',
                          stock.changePercent > 0
                            ? 'text-red-500'
                            : stock.changePercent < 0
                            ? 'text-blue-500'
                            : 'text-muted-foreground'
                        )}
                      >
                        {stock.changePercent > 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : stock.changePercent < 0 ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : null}
                        {stock.changePercent > 0 ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 오늘의 주도주 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              오늘의 주도주
            </CardTitle>
            <Link href="/screener">
              <Button variant="ghost" size="sm">
                더보기
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {screenerLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {topStocks.map((result, index) => (
                  <Link
                    key={result.symbol}
                    href={`/stocks/${result.symbol}`}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-4">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{result.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.symbol}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1 text-sm',
                        result.changePercent > 0
                          ? 'text-red-500'
                          : result.changePercent < 0
                          ? 'text-blue-500'
                          : ''
                      )}
                    >
                      {result.changePercent > 0 ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : result.changePercent < 0 ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : null}
                      {result.changePercent > 0 ? '+' : ''}
                      {result.changePercent.toFixed(2)}%
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최신 뉴스 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              최신 뉴스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NewsFeed
              symbols={watchlistSymbols.length > 0 ? watchlistSymbols.slice(0, 5) : undefined}
              limit={5}
              title=""
              height="300px"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
