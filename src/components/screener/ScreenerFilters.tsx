'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { ScreenerFilter } from '@/types';

interface ScreenerFiltersProps {
  filter: ScreenerFilter;
  onFilterChange: (filter: ScreenerFilter) => void;
  sortBy: 'score' | 'change_percent' | 'volume_ratio';
  onSortChange: (sortBy: 'score' | 'change_percent' | 'volume_ratio') => void;
}

export function ScreenerFilters({
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
}: ScreenerFiltersProps) {
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

      {/* 빠른 필터 */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">빠른 필터</Label>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filter.onlyNewHigh ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() =>
              onFilterChange({ ...filter, onlyNewHigh: !filter.onlyNewHigh })
            }
          >
            신고가
          </Badge>
          <Badge
            variant={filter.minVolumeRatio === 2 ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() =>
              onFilterChange({
                ...filter,
                minVolumeRatio: filter.minVolumeRatio === 2 ? undefined : 2,
              })
            }
          >
            거래량 2배+
          </Badge>
          <Badge
            variant={filter.minChangePercent === 3 ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() =>
              onFilterChange({
                ...filter,
                minChangePercent: filter.minChangePercent === 3 ? undefined : 3,
              })
            }
          >
            상승률 3%+
          </Badge>
          <Badge
            variant={filter.minChangePercent === 5 ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() =>
              onFilterChange({
                ...filter,
                minChangePercent: filter.minChangePercent === 5 ? undefined : 5,
              })
            }
          >
            상승률 5%+
          </Badge>
        </div>
      </div>

      {/* 정렬 */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">정렬</Label>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'score' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortChange('score')}
          >
            종합 점수
          </Button>
          <Button
            variant={sortBy === 'change_percent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortChange('change_percent')}
          >
            등락률
          </Button>
          <Button
            variant={sortBy === 'volume_ratio' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortChange('volume_ratio')}
          >
            거래량
          </Button>
        </div>
      </div>

      {/* 필터 초기화 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onFilterChange({
            market: 'all',
            onlyNewHigh: false,
            minVolumeRatio: undefined,
            minChangePercent: undefined,
            maxChangePercent: undefined,
          })
        }
      >
        필터 초기화
      </Button>
    </div>
  );
}
