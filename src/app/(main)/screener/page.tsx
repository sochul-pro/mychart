'use client';

import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScreenerTable, ScreenerFilters } from '@/components/screener';
import { SectorHotStocks } from '@/components/sectors';
import { useScreener } from '@/hooks/useScreener';
import { useSectorHotStocksData } from '@/hooks/useSectorSummary';
import type { ScreenerFilter } from '@/types';

export default function ScreenerPage() {
  const [filter, setFilter] = useState<ScreenerFilter>({
    market: 'all',
  });
  const [sortBy, setSortBy] = useState<'score' | 'change_percent' | 'volume_ratio'>('score');

  const { results, total, isLoading, refetch } = useScreener({
    filter,
    sortBy,
    limit: 50,
  });

  const {
    summaries: sectorSummaries,
    isLoading: isSectorLoading,
  } = useSectorHotStocksData();

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">주도주 스크리너</h1>
          <p className="text-muted-foreground text-sm mt-1">
            모멘텀 기반으로 주도주를 발굴합니다
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          새로고침
        </Button>
      </div>

      {/* 섹터별 핫 종목 */}
      <div className="mb-6">
        <SectorHotStocks
          summaries={sectorSummaries}
          isLoading={isSectorLoading}
          maxSectors={6}
        />
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
              sortBy={sortBy}
              onSortChange={setSortBy}
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
