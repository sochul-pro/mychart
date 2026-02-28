'use client';

import { Button } from '@/components/ui/button';
import type { ComparePeriod } from '@/types/comparison';
import { PERIOD_OPTIONS } from '@/types/comparison';
import { cn } from '@/lib/utils';

export interface ComparisonPeriodSelectorProps {
  /** 현재 선택된 기간 */
  value: ComparePeriod;
  /** 기간 변경 콜백 */
  onChange: (period: ComparePeriod) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 클래스명 */
  className?: string;
}

/**
 * 비교 기간 선택 컴포넌트
 *
 * 1M, 3M, 6M, 1Y, 2Y 버튼 그룹
 */
export function ComparisonPeriodSelector({
  value,
  onChange,
  disabled = false,
  className,
}: ComparisonPeriodSelectorProps) {
  return (
    <div className={cn('inline-flex rounded-lg bg-muted p-1', className)}>
      {PERIOD_OPTIONS.map((option) => (
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
          {option.value}
        </Button>
      ))}
    </div>
  );
}

export default ComparisonPeriodSelector;
