'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import type { ScreenerFilter, RankingWeights } from '@/types';
import { DEFAULT_RANKING_WEIGHTS } from '@/types/screener';

interface ScreenerFiltersProps {
  filter: ScreenerFilter;
  onFilterChange: (filter: ScreenerFilter) => void;
  weights: RankingWeights;
  onWeightsChange: (weights: RankingWeights) => void;
  minRankingCount: number;
  onMinRankingCountChange: (count: number) => void;
}

export function ScreenerFilters({
  filter,
  onFilterChange,
  weights,
  onWeightsChange,
  minRankingCount,
  onMinRankingCountChange,
}: ScreenerFiltersProps) {
  const [showWeights, setShowWeights] = useState(false);

  const handleWeightChange = (key: keyof RankingWeights, value: number) => {
    onWeightsChange({ ...weights, [key]: value });
  };

  const resetWeights = () => {
    onWeightsChange(DEFAULT_RANKING_WEIGHTS);
  };

  const totalWeight =
    weights.changeWeight +
    weights.turnoverWeight +
    weights.amountWeight +
    weights.foreignWeight;

  return (
    <div className="space-y-4">
      {/* 마켓 필터 */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">마켓</Label>
        <div className="flex gap-2">
          {(['all', 'KOSPI', 'KOSDAQ'] as const).map((market) => (
            <Button
              key={market}
              variant={filter.market === market ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ ...filter, market })}
            >
              {market === 'all' ? '전체' : market}
            </Button>
          ))}
        </div>
      </div>

      {/* 순위 필터 */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">순위 조건</Label>
        <div className="flex flex-wrap gap-2">
          {[0, 2, 3, 4].map((count) => (
            <Badge
              key={count}
              variant={minRankingCount === count ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onMinRankingCountChange(count)}
            >
              {count === 0 ? '전체' : `${count}개 이상`}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          여러 순위에 동시 등장한 종목 필터링
        </p>
      </div>

      {/* 가중치 설정 */}
      <div className="space-y-2">
        <button
          className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setShowWeights(!showWeights)}
        >
          <span>가중치 설정</span>
          {showWeights ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showWeights && (
          <div className="space-y-4 p-3 bg-muted/50 rounded-lg">
            {/* 등락률 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>등락률</span>
                <span className="font-medium">{weights.changeWeight}</span>
              </div>
              <Slider
                value={[weights.changeWeight]}
                onValueChange={([v]) => handleWeightChange('changeWeight', v)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            {/* 회전율 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>거래회전율</span>
                <span className="font-medium">{weights.turnoverWeight}</span>
              </div>
              <Slider
                value={[weights.turnoverWeight]}
                onValueChange={([v]) => handleWeightChange('turnoverWeight', v)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            {/* 거래대금 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>거래대금</span>
                <span className="font-medium">{weights.amountWeight}</span>
              </div>
              <Slider
                value={[weights.amountWeight]}
                onValueChange={([v]) => handleWeightChange('amountWeight', v)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            {/* 외인/기관 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>외인/기관</span>
                <span className="font-medium">{weights.foreignWeight}</span>
              </div>
              <Slider
                value={[weights.foreignWeight]}
                onValueChange={([v]) => handleWeightChange('foreignWeight', v)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            {/* 합계 표시 */}
            <div className="flex justify-between pt-2 border-t text-sm">
              <span>합계</span>
              <span
                className={`font-medium ${totalWeight !== 100 ? 'text-yellow-600' : 'text-green-600'}`}
              >
                {totalWeight}
              </span>
            </div>

            {/* 초기화 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={resetWeights}
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              기본값으로 초기화
            </Button>
          </div>
        )}
      </div>

      {/* 전체 필터 초기화 */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => {
          onFilterChange({ market: 'all' });
          onWeightsChange(DEFAULT_RANKING_WEIGHTS);
          onMinRankingCountChange(0);
        }}
      >
        전체 초기화
      </Button>
    </div>
  );
}
