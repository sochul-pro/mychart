'use client';

import Link from 'next/link';
import { TrendingUp, Star, Newspaper, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NewsFeed } from '@/components/news';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useScreener } from '@/hooks/useScreener';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { groups, isLoading: watchlistLoading } = useWatchlist();
  const { results: topStocks, isLoading: screenerLoading } = useScreener({
    limit: 5,
  });

  // 관심종목에서 모든 종목 코드 추출
  const watchlistSymbols = groups.flatMap((g) => g.items.map((i) => i.symbol));

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">대시보드</h1>

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
            {watchlistLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : groups.length === 0 ? (
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
              <div className="space-y-2">
                {groups.slice(0, 3).map((group) => (
                  <div key={group.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{group.name}</span>
                      <Badge variant="secondary">{group.items.length}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.items.slice(0, 3).map((item) => (
                        <Link key={item.id} href={`/stocks/${item.symbol}`}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                            {item.name}
                          </Badge>
                        </Link>
                      ))}
                      {group.items.length > 3 && (
                        <Badge variant="outline">+{group.items.length - 3}</Badge>
                      )}
                    </div>
                  </div>
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
