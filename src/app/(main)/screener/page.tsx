'use client';

import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScreenerTable, ScreenerFilters } from '@/components/screener';
import { useScreener } from '@/hooks/useScreener';
import type { ScreenerFilter, RankingWeights } from '@/types';
import { DEFAULT_RANKING_WEIGHTS } from '@/types/screener';

export default function ScreenerPage() {
  const [filter, setFilter] = useState<ScreenerFilter>({
    market: 'all',
  });
  const [weights, setWeights] = useState<RankingWeights>(DEFAULT_RANKING_WEIGHTS);
  const [minRankingCount, setMinRankingCount] = useState(0);

  const { results, total, isLoading, refetch } = useScreener({
    filter,
    weights,
    minRankingCount,
    limit: 50,
  });

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">주도주 스크리너</h1>
          <p className="text-muted-foreground text-sm mt-1">
            4가지 순위(등락률, 회전율, 거래대금, 외인/기관)의 교집합으로 주도주를 발굴합니다
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          새로고침
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[280px_1fr]">
        {/* 필터 사이드바 */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">필터</CardTitle>
          </CardHeader>
          <CardContent>
            <ScreenerFilters
              filter={filter}
              onFilterChange={setFilter}
              weights={weights}
              onWeightsChange={setWeights}
              minRankingCount={minRankingCount}
              onMinRankingCountChange={setMinRankingCount}
            />
          </CardContent>
        </Card>

        {/* 결과 테이블 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              결과 {!isLoading && <span className="text-muted-foreground">({total})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScreenerTable results={results} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
