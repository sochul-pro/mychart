'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComparisonChart,
  ComparisonLegend,
  ComparisonPeriodSelector,
  ComparisonSymbolSearch,
  ComparisonSetManager,
} from '@/components/compare';
import { useComparison } from '@/hooks/useComparison';
import { useComparisonSets } from '@/hooks/useComparisonSets';
import type { ComparePeriod, ComparisonItem, ComparisonItemType, ComparisonSet } from '@/types/comparison';
import { getComparisonColor, isIndexCode, SUPPORTED_INDICES } from '@/types/comparison';

export default function ComparePage() {
  // 상태
  const [items, setItems] = useState<ComparisonItem[]>([]);
  const [period, setPeriod] = useState<ComparePeriod>('6M');
  const [currentSetId, setCurrentSetId] = useState<string | undefined>();
  const [searchOpen, setSearchOpen] = useState(false);

  // 종목 코드 목록
  const symbols = useMemo(() => items.map((item) => item.code), [items]);

  // 비교 데이터 조회
  const {
    data: comparisonData,
    isLoading: isDataLoading,
    refetch: refetchData,
  } = useComparison({
    symbols,
    period,
    enabled: symbols.length > 0,
  });

  // 비교 세트 CRUD
  const {
    sets,
    isLoading: isSetsLoading,
    createSet,
    deleteSet,
    isCreating,
  } = useComparisonSets();

  // 데이터 로드 후 종목명 업데이트 (저장된 세트 불러올 때 코드만 있으므로)
  useEffect(() => {
    if (!comparisonData) return;

    setItems((prev) => {
      let hasChanges = false;
      const updated = prev.map((item) => {
        const dataItem = comparisonData.items[item.code];
        if (dataItem && dataItem.name && item.name !== dataItem.name) {
          hasChanges = true;
          return { ...item, name: dataItem.name };
        }
        return item;
      });
      return hasChanges ? updated : prev;
    });
  }, [comparisonData]);

  // 종목 추가
  const handleAddItem = useCallback(
    (code: string, name: string, type: ComparisonItemType) => {
      setItems((prev) => {
        // 이미 추가된 경우 무시
        if (prev.some((item) => item.code === code)) return prev;

        const newItem: ComparisonItem = {
          code,
          name,
          type,
          color: getComparisonColor(prev.length),
        };

        return [...prev, newItem];
      });
      setSearchOpen(false);
      setCurrentSetId(undefined); // 세트 선택 해제
    },
    []
  );

  // 종목 삭제
  const handleRemoveItem = useCallback((code: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.code !== code);
      // 색상 재할당
      return filtered.map((item, index) => ({
        ...item,
        color: getComparisonColor(index),
      }));
    });
    setCurrentSetId(undefined);
  }, []);

  // 기간 변경
  const handlePeriodChange = useCallback((newPeriod: ComparePeriod) => {
    setPeriod(newPeriod);
  }, []);

  // 세트 저장
  const handleCreateSet = useCallback(
    async (data: { name: string; symbols: string[]; period: ComparePeriod }) => {
      await createSet(data);
    },
    [createSet]
  );

  // 세트 불러오기
  const handleLoadSet = useCallback((set: ComparisonSet) => {
    // 종목 정보 구성
    const loadedItems: ComparisonItem[] = set.symbols.map((code, index) => {
      const isIndex = isIndexCode(code);
      const indexInfo = SUPPORTED_INDICES.find((idx) => idx.code === code);

      return {
        code,
        name: isIndex ? indexInfo?.name || code : code,
        type: isIndex ? 'index' : 'stock',
        color: getComparisonColor(index),
      };
    });

    setItems(loadedItems);
    setPeriod(set.period as ComparePeriod);
    setCurrentSetId(set.id);
  }, []);

  // 세트 삭제
  const handleDeleteSet = useCallback(
    async (id: string) => {
      await deleteSet(id);
      if (currentSetId === id) {
        setCurrentSetId(undefined);
      }
    },
    [deleteSet, currentSetId]
  );

  // 초기화
  const handleReset = useCallback(() => {
    setItems([]);
    setPeriod('6M');
    setCurrentSetId(undefined);
  }, []);

  return (
    <div className="container mx-auto space-y-6 p-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">수익률 비교</h1>
          <p className="text-sm text-muted-foreground">
            여러 종목과 지수의 수익률을 한눈에 비교하세요
          </p>
        </div>

        <ComparisonSetManager
          sets={sets}
          currentSetId={currentSetId}
          currentSymbols={symbols}
          currentPeriod={period}
          onCreateSet={handleCreateSet}
          onLoadSet={handleLoadSet}
          onDeleteSet={handleDeleteSet}
          isLoading={isSetsLoading}
          isSaving={isCreating}
        />
      </div>

      {/* 컨트롤 영역 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* 종목 추가 버튼 */}
            <div className="flex items-center gap-2">
              <Button onClick={() => setSearchOpen(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                종목/지수 추가
              </Button>

              {items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  초기화
                </Button>
              )}
            </div>

            {/* 기간 선택 */}
            <ComparisonPeriodSelector
              value={period}
              onChange={handlePeriodChange}
              disabled={isDataLoading}
            />
          </div>

          {/* 추가된 종목 목록 (범례) */}
          {items.length > 0 && (
            <div className="mt-4">
              <ComparisonLegend
                data={comparisonData ?? null}
                items={items}
                onRemove={handleRemoveItem}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 차트 영역 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">상대 수익률 차트</CardTitle>
          {symbols.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetchData()}
              disabled={isDataLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isDataLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ComparisonChart
              data={comparisonData ?? null}
              orderedCodes={symbols}
              height={400}
              className="min-h-[400px]"
            />
          )}
        </CardContent>
      </Card>

      {/* 종목 검색 다이얼로그 */}
      <ComparisonSymbolSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onAdd={handleAddItem}
        existingCodes={symbols}
        currentCount={items.length}
      />
    </div>
  );
}
