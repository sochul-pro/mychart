'use client';

import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScreenerTable, ScreenerFilters } from '@/components/screener';
import { useScreener } from '@/hooks/useScreener';
import { useScreenerSettings } from '@/hooks/useScreenerSettings';

export default function ScreenerPage() {
  const {
    weights,
    filter,
    minRankingCount,
    selectedRankings,
    isLoaded,
    lastSaved,
    updateWeights,
    updateFilter,
    updateMinRankingCount,
    updateSelectedRankings,
    resetToDefault,
  } = useScreenerSettings();

  const { results, total, isLoading, refetch } = useScreener({
    filter,
    weights,
    minRankingCount,
    selectedRankings,
    limit: 50,
    enabled: isLoaded, // 설정 로드 후 데이터 조회
  });

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">주도주 스크리너</h1>
          <p className="text-muted-foreground text-sm mt-1">
            5가지 순위(등락률, 회전율, 거래대금, 외인/기관, 조회상위)의 교집합으로 주도주를 발굴합니다
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">필터</CardTitle>
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                저장됨
              </span>
            )}
          </CardHeader>
          <CardContent>
            <ScreenerFilters
              filter={filter}
              onFilterChange={updateFilter}
              weights={weights}
              onWeightsChange={updateWeights}
              minRankingCount={minRankingCount}
              onMinRankingCountChange={updateMinRankingCount}
              selectedRankings={selectedRankings}
              onSelectedRankingsChange={updateSelectedRankings}
              onReset={resetToDefault}
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
