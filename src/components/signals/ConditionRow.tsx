'use client';

import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SingleCondition, SignalIndicator, ComparisonOperator } from '@/lib/signals/types';

export interface ConditionRowProps {
  condition: SingleCondition;
  onChange: (condition: SingleCondition) => void;
  onDelete: () => void;
}

const INDICATOR_OPTIONS: { value: SignalIndicator; label: string; hasParams?: boolean }[] = [
  { value: 'price', label: '종가' },
  { value: 'volume', label: '거래량' },
  { value: 'sma', label: 'SMA', hasParams: true },
  { value: 'ema', label: 'EMA', hasParams: true },
  { value: 'rsi', label: 'RSI', hasParams: true },
  { value: 'macd', label: 'MACD' },
  { value: 'macd_signal', label: 'MACD Signal' },
  { value: 'macd_histogram', label: 'MACD Histogram' },
  { value: 'stochastic_k', label: '%K' },
  { value: 'stochastic_d', label: '%D' },
  { value: 'bollinger_upper', label: '볼린저 상단' },
  { value: 'bollinger_middle', label: '볼린저 중간' },
  { value: 'bollinger_lower', label: '볼린저 하단' },
];

const OPERATOR_OPTIONS: { value: ComparisonOperator; label: string }[] = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
];

export const ConditionRow = memo(function ConditionRow({
  condition,
  onChange,
  onDelete,
}: ConditionRowProps) {
  // indicator가 ArithmeticExpression인 경우 문자열로 변환
  const indicatorValue = typeof condition.indicator === 'string'
    ? condition.indicator
    : 'price'; // ArithmeticExpression은 기본값 사용 (수식 편집기에서만 생성)

  const selectedIndicator = INDICATOR_OPTIONS.find((opt) => opt.value === indicatorValue);
  const needsParams = selectedIndicator?.hasParams;

  // ArithmeticExpression인 경우 편집 불가 표시
  const isArithmeticExpression = typeof condition.indicator !== 'string';

  const handleIndicatorChange = (indicator: SignalIndicator) => {
    const newCondition: SingleCondition = {
      ...condition,
      indicator,
    };
    // SMA, EMA, RSI 등은 기본 period 파라미터 필요
    if (['sma', 'ema', 'rsi'].includes(indicator) && !condition.params?.period) {
      newCondition.params = { period: indicator === 'rsi' ? 14 : 20 };
    }
    onChange(newCondition);
  };

  const handleOperatorChange = (operator: ComparisonOperator) => {
    onChange({ ...condition, operator });
  };

  const handleValueChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onChange({ ...condition, value: numValue });
    }
  };

  const handleParamChange = (paramName: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onChange({
        ...condition,
        params: { ...condition.params, [paramName]: numValue },
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
      {/* 지표 선택 */}
      <Select
        value={indicatorValue}
        onValueChange={handleIndicatorChange}
        disabled={isArithmeticExpression}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="지표" />
        </SelectTrigger>
        <SelectContent>
          {INDICATOR_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 파라미터 (period) */}
      {needsParams && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">(</span>
          <Input
            type="number"
            value={condition.params?.period || 20}
            onChange={(e) => handleParamChange('period', e.target.value)}
            className="h-8 w-14 px-1 text-center text-sm"
            min={1}
            max={200}
          />
          <span className="text-xs text-muted-foreground">)</span>
        </div>
      )}

      {/* 연산자 선택 */}
      <Select value={condition.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-[60px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATOR_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 값 입력 */}
      <Input
        type="number"
        value={typeof condition.value === 'number' ? condition.value : ''}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder="값"
        className="h-8 w-20 px-2 text-sm"
      />

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

export default ConditionRow;
