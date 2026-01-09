'use client';

import { memo } from 'react';
import { Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CrossoverCondition, SignalIndicator } from '@/lib/signals/types';

export interface CrossoverConditionRowProps {
  condition: CrossoverCondition;
  onChange: (condition: CrossoverCondition) => void;
  onDelete: () => void;
}

const INDICATOR_OPTIONS: { value: SignalIndicator; label: string; hasParams?: boolean }[] = [
  { value: 'price', label: '종가' },
  { value: 'sma', label: 'SMA', hasParams: true },
  { value: 'ema', label: 'EMA', hasParams: true },
  { value: 'macd', label: 'MACD' },
  { value: 'macd_signal', label: 'MACD Signal' },
  { value: 'stochastic_k', label: '%K' },
  { value: 'stochastic_d', label: '%D' },
  { value: 'bollinger_upper', label: '볼린저 상단' },
  { value: 'bollinger_middle', label: '볼린저 중간' },
  { value: 'bollinger_lower', label: '볼린저 하단' },
];

export const CrossoverConditionRow = memo(function CrossoverConditionRow({
  condition,
  onChange,
  onDelete,
}: CrossoverConditionRowProps) {
  const indicator1Option = INDICATOR_OPTIONS.find((opt) => opt.value === condition.indicator1);
  const indicator2Option = INDICATOR_OPTIONS.find((opt) => opt.value === condition.indicator2);

  const handleIndicator1Change = (indicator: SignalIndicator) => {
    const newCondition: CrossoverCondition = {
      ...condition,
      indicator1: indicator,
    };
    if (['sma', 'ema'].includes(indicator) && !condition.params1?.period) {
      newCondition.params1 = { period: 5 };
    }
    onChange(newCondition);
  };

  const handleIndicator2Change = (indicator: SignalIndicator) => {
    const newCondition: CrossoverCondition = {
      ...condition,
      indicator2: indicator,
    };
    if (['sma', 'ema'].includes(indicator) && !condition.params2?.period) {
      newCondition.params2 = { period: 20 };
    }
    onChange(newCondition);
  };

  const handleDirectionChange = (direction: 'up' | 'down') => {
    onChange({ ...condition, direction });
  };

  const handleParam1Change = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onChange({
        ...condition,
        params1: { ...condition.params1, period: numValue },
      });
    }
  };

  const handleParam2Change = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onChange({
        ...condition,
        params2: { ...condition.params2, period: numValue },
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
      {/* 지표1 선택 */}
      <Select value={condition.indicator1} onValueChange={handleIndicator1Change}>
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="지표1" />
        </SelectTrigger>
        <SelectContent>
          {INDICATOR_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 지표1 파라미터 */}
      {indicator1Option?.hasParams && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">(</span>
          <Input
            type="number"
            value={condition.params1?.period || 5}
            onChange={(e) => handleParam1Change(e.target.value)}
            className="h-8 w-12 px-1 text-center text-sm"
            min={1}
            max={200}
          />
          <span className="text-xs text-muted-foreground">)</span>
        </div>
      )}

      {/* 방향 선택 */}
      <div className="flex items-center gap-1">
        <Button
          variant={condition.direction === 'up' ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => handleDirectionChange('up')}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Button>
        <Button
          variant={condition.direction === 'down' ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2"
          onClick={() => handleDirectionChange('down')}
        >
          <ArrowDownRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 지표2 선택 */}
      <Select value={condition.indicator2} onValueChange={handleIndicator2Change}>
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="지표2" />
        </SelectTrigger>
        <SelectContent>
          {INDICATOR_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 지표2 파라미터 */}
      {indicator2Option?.hasParams && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">(</span>
          <Input
            type="number"
            value={condition.params2?.period || 20}
            onChange={(e) => handleParam2Change(e.target.value)}
            className="h-8 w-12 px-1 text-center text-sm"
            min={1}
            max={200}
          />
          <span className="text-xs text-muted-foreground">)</span>
        </div>
      )}

      {/* 삭제 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

export default CrossoverConditionRow;
