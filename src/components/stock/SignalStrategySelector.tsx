'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useSignalPresets } from '@/hooks/useSignalPresets';
import type { SignalPresetWithStats } from '@/lib/signals/types';

/** 선택된 전략과 스타일 정보 */
export interface SelectedStrategy {
  id: string;
  name: string;
  color: string;
  buyShape: MarkerShape;
  sellShape: MarkerShape;
  buyRules: SignalPresetWithStats['buyRules'];
  sellRules: SignalPresetWithStats['sellRules'];
}

interface SignalStrategySelectorProps {
  selectedStrategies: SelectedStrategy[];
  onSelectionChange: (strategies: SelectedStrategy[]) => void;
  className?: string;
}

/** 마커 모양 타입 */
export type MarkerShape = 'arrowUp' | 'arrowDown' | 'circle' | 'square';

/** 전략별 색상 및 모양 팔레트 */
const STRATEGY_STYLES = [
  { buy: '#22c55e', sell: '#ef4444', buyShape: 'arrowUp' as MarkerShape, sellShape: 'arrowDown' as MarkerShape }, // 화살표
  { buy: '#3b82f6', sell: '#f97316', buyShape: 'circle' as MarkerShape, sellShape: 'circle' as MarkerShape },     // 원
  { buy: '#8b5cf6', sell: '#ec4899', buyShape: 'square' as MarkerShape, sellShape: 'square' as MarkerShape },     // 사각형
  { buy: '#14b8a6', sell: '#f59e0b', buyShape: 'arrowUp' as MarkerShape, sellShape: 'arrowDown' as MarkerShape }, // 화살표
  { buy: '#06b6d4', sell: '#dc2626', buyShape: 'circle' as MarkerShape, sellShape: 'circle' as MarkerShape },     // 원
];

/** 하위 호환성을 위한 색상 배열 */
const STRATEGY_COLORS = STRATEGY_STYLES;

export function SignalStrategySelector({
  selectedStrategies,
  onSelectionChange,
  className,
}: SignalStrategySelectorProps) {
  const [open, setOpen] = useState(false);
  const { presets, defaultPresets, isLoading } = useSignalPresets();

  // 모든 전략 목록 (기본 + 사용자)
  const allStrategies = useMemo(() => {
    return [...defaultPresets, ...presets];
  }, [defaultPresets, presets]);

  // 선택된 전략 ID Set
  const selectedIds = useMemo(
    () => new Set(selectedStrategies.map((s) => s.id)),
    [selectedStrategies]
  );

  // 전략 선택/해제 토글
  const handleToggle = (strategy: SignalPresetWithStats) => {
    if (selectedIds.has(strategy.id)) {
      // 해제
      onSelectionChange(selectedStrategies.filter((s) => s.id !== strategy.id));
    } else {
      // 선택 (최대 5개까지)
      if (selectedStrategies.length >= 5) return;

      // 스타일 할당 (사용되지 않은 스타일 중 첫 번째)
      const usedStyleIndices = new Set(
        selectedStrategies.map((s) => STRATEGY_STYLES.findIndex((c) => c.buy === s.color))
      );
      const styleIndex = STRATEGY_STYLES.findIndex((_, i) => !usedStyleIndices.has(i));
      const style = STRATEGY_STYLES[styleIndex >= 0 ? styleIndex : 0];

      onSelectionChange([
        ...selectedStrategies,
        {
          id: strategy.id,
          name: strategy.name,
          color: style.buy,
          buyShape: style.buyShape,
          sellShape: style.sellShape,
          buyRules: strategy.buyRules,
          sellRules: strategy.sellRules,
        },
      ]);
    }
  };

  // 전략의 색상 가져오기
  const getStrategyColor = (strategyId: string) => {
    const strategy = selectedStrategies.find((s) => s.id === strategyId);
    return strategy?.color || STRATEGY_COLORS[0].buy;
  };

  // 표시 텍스트
  const displayText = useMemo(() => {
    if (selectedStrategies.length === 0) return '선택안함';
    if (selectedStrategies.length === 1) return selectedStrategies[0].name;
    return `${selectedStrategies.length}개 선택됨`;
  }, [selectedStrategies]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2 min-w-[140px] justify-between', className)}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline truncate max-w-[100px]">{displayText}</span>
          </div>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-2 border-b">
          <p className="text-sm font-medium">매매신호 전략</p>
          <p className="text-xs text-muted-foreground">최대 5개까지 선택 가능</p>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {/* 기본 전략 */}
          {defaultPresets.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground mb-2">기본 전략</p>
              {defaultPresets.map((strategy) => (
                <StrategyItem
                  key={strategy.id}
                  strategy={strategy}
                  isSelected={selectedIds.has(strategy.id)}
                  color={getStrategyColor(strategy.id)}
                  onToggle={() => handleToggle(strategy)}
                  disabled={!selectedIds.has(strategy.id) && selectedStrategies.length >= 5}
                />
              ))}
            </div>
          )}

          {/* 내 전략 */}
          {presets.length > 0 && (
            <div className="p-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">내 전략</p>
              {presets.map((strategy) => (
                <StrategyItem
                  key={strategy.id}
                  strategy={strategy}
                  isSelected={selectedIds.has(strategy.id)}
                  color={getStrategyColor(strategy.id)}
                  onToggle={() => handleToggle(strategy)}
                  disabled={!selectedIds.has(strategy.id) && selectedStrategies.length >= 5}
                />
              ))}
            </div>
          )}

          {/* 전략이 없을 때 */}
          {allStrategies.length === 0 && !isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              사용 가능한 전략이 없습니다
            </div>
          )}
        </div>

        {/* 선택된 전략 범례 */}
        {selectedStrategies.length > 0 && (
          <div className="p-2 border-t bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">범례</p>
            <div className="flex flex-wrap gap-2">
              {selectedStrategies.map((strategy) => {
                const styleSet = STRATEGY_STYLES.find((c) => c.buy === strategy.color) || STRATEGY_STYLES[0];
                return (
                  <div key={strategy.id} className="flex items-center gap-1 text-xs">
                    <ShapeIcon shape={strategy.buyShape} color={styleSet.buy} />
                    <ShapeIcon shape={strategy.sellShape} color={styleSet.sell} />
                    <span className="truncate max-w-[80px]">{strategy.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** 모양 아이콘 컴포넌트 */
function ShapeIcon({ shape, color }: { shape: MarkerShape; color: string }) {
  switch (shape) {
    case 'circle':
      return (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      );
    case 'square':
      return (
        <span
          className="w-2 h-2 shrink-0"
          style={{ backgroundColor: color }}
        />
      );
    case 'arrowUp':
      return (
        <span
          className="shrink-0 text-[8px] leading-none"
          style={{ color }}
        >
          ▲
        </span>
      );
    case 'arrowDown':
      return (
        <span
          className="shrink-0 text-[8px] leading-none"
          style={{ color }}
        >
          ▼
        </span>
      );
    default:
      return (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      );
  }
}

/** 개별 전략 아이템 */
interface StrategyItemProps {
  strategy: SignalPresetWithStats;
  isSelected: boolean;
  color: string;
  onToggle: () => void;
  disabled: boolean;
}

function StrategyItem({ strategy, isSelected, color, onToggle, disabled }: StrategyItemProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
        isSelected ? 'bg-primary/10' : 'hover:bg-muted',
        disabled && !isSelected && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        disabled={disabled && !isSelected}
      />
      {isSelected && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-sm truncate">{strategy.name}</span>
    </label>
  );
}

/** 전략 스타일 팔레트 내보내기 (차트에서 사용) */
export { STRATEGY_COLORS, STRATEGY_STYLES };
