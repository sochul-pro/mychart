'use client';

import { Button } from '@/components/ui/button';
import type { ComparisonChartType } from '@/types/comparison';
import { CHART_TYPE_OPTIONS } from '@/types/comparison';
import { cn } from '@/lib/utils';

export interface ComparisonChartTypeSelectorProps {
  /** 현재 선택된 차트 타입 */
  value: ComparisonChartType;
  /** 차트 타입 변경 콜백 */
  onChange: (type: ComparisonChartType) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 클래스명 */
  className?: string;
}

/**
 * 비교 차트 타입 선택 컴포넌트
 *
 * Line, Candle 버튼 그룹
 */
export function ComparisonChartTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: ComparisonChartTypeSelectorProps) {
  return (
    <div className={cn('inline-flex rounded-lg bg-muted p-1', className)}>
      {CHART_TYPE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            'h-8 px-3 text-sm font-medium transition-colors',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export default ComparisonChartTypeSelector;
