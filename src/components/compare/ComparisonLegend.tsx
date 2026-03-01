'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ComparisonData, ComparisonItem } from '@/types/comparison';
import { getComparisonColor } from '@/types/comparison';
import { formatReturn } from '@/lib/comparison/normalize';
import { cn } from '@/lib/utils';

export interface ComparisonLegendProps {
  /** 비교 데이터 */
  data: ComparisonData | null;
  /** 종목 목록 (순서 유지용) */
  items: ComparisonItem[];
  /** 종목 삭제 콜백 */
  onRemove?: (code: string) => void;
  /** 종목 표시/숨김 토글 콜백 */
  onToggleVisible?: (code: string) => void;
  /** 클래스명 */
  className?: string;
}

/**
 * 비교 차트 범례 컴포넌트
 *
 * 종목별 색상 + 현재 수익률 표시, 삭제 버튼 포함
 */
export function ComparisonLegend({
  data,
  items,
  onRemove,
  onToggleVisible,
  className,
}: ComparisonLegendProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map((item, index) => {
        const color = getComparisonColor(index);
        const itemData = data?.items[item.code];
        const returnValue = itemData?.currentReturn ?? 0;
        const isPositive = returnValue >= 0;

        return (
          <div
            key={item.code}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 transition-opacity',
              !item.visible && 'opacity-50'
            )}
          >
            {/* 표시/숨김 체크박스 */}
            {onToggleVisible && (
              <Checkbox
                checked={item.visible}
                onCheckedChange={() => onToggleVisible(item.code)}
                className="h-4 w-4"
              />
            )}

            {/* 색상 표시 */}
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />

            {/* 종목명 */}
            <span className="text-sm font-medium">{item.name}</span>

            {/* 수익률 */}
            <span
              className={cn(
                'text-sm font-semibold',
                isPositive ? 'text-red-500' : 'text-blue-500'
              )}
            >
              {formatReturn(returnValue)}
            </span>

            {/* 삭제 버튼 */}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-muted"
                onClick={() => onRemove(item.code)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ComparisonLegend;
