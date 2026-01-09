'use client';

import { useState, useCallback } from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { TradingStrategy, PresetStrategyId, Condition } from '@/lib/signals/types';
import { getPresetStrategies, getPresetStrategy } from '@/lib/signals/presets';
import { ConditionBuilder } from './ConditionBuilder';

export interface StrategySelectorProps {
  /** 현재 선택된 전략 */
  selectedStrategy: TradingStrategy | null;
  /** 전략 선택 시 콜백 */
  onStrategySelect: (strategy: TradingStrategy | null) => void;
  /** 클래스명 */
  className?: string;
}

// 기본 조건
const DEFAULT_BUY_CONDITION: Condition = {
  type: 'single',
  indicator: 'rsi',
  operator: 'lt',
  value: 30,
  params: { period: 14 },
};

const DEFAULT_SELL_CONDITION: Condition = {
  type: 'single',
  indicator: 'rsi',
  operator: 'gt',
  value: 70,
  params: { period: 14 },
};

/**
 * 매매 전략 선택 컴포넌트
 */
export function StrategySelector({
  selectedStrategy,
  onStrategySelect,
  className = '',
}: StrategySelectorProps) {
  const [showPresets, setShowPresets] = useState(true);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [buyCondition, setBuyCondition] = useState<Condition>(DEFAULT_BUY_CONDITION);
  const [sellCondition, setSellCondition] = useState<Condition>(DEFAULT_SELL_CONDITION);

  const presets = getPresetStrategies();

  const handlePresetSelect = (id: string) => {
    if (selectedStrategy?.id === id) {
      onStrategySelect(null);
    } else {
      const strategy = getPresetStrategy(id as PresetStrategyId);
      if (strategy) {
        onStrategySelect(strategy);
      }
    }
  };

  const handleCreateCustomStrategy = useCallback(() => {
    if (!customName.trim()) return;

    const customStrategy: TradingStrategy = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      description: '사용자 정의 전략',
      buyCondition,
      sellCondition,
    };

    onStrategySelect(customStrategy);
    setIsCustomDialogOpen(false);
    setCustomName('');
    setBuyCondition(DEFAULT_BUY_CONDITION);
    setSellCondition(DEFAULT_SELL_CONDITION);
  }, [customName, buyCondition, sellCondition, onStrategySelect]);

  const handleEditStrategy = useCallback(() => {
    if (selectedStrategy) {
      setCustomName(selectedStrategy.name);
      setBuyCondition(selectedStrategy.buyCondition);
      setSellCondition(selectedStrategy.sellCondition);
      setIsCustomDialogOpen(true);
    }
  }, [selectedStrategy]);

  const isCustomStrategy = selectedStrategy?.id.startsWith('custom_');

  return (
    <div className={`rounded-lg border bg-card p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">매매 신호</h3>
        <div className="flex items-center gap-2">
          {/* 커스텀 전략 만들기 버튼 */}
          <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" />
                커스텀
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>커스텀 전략 만들기</DialogTitle>
                <DialogDescription>
                  매수/매도 조건을 직접 설정하여 나만의 전략을 만드세요.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* 전략 이름 */}
                <div className="space-y-2">
                  <Label htmlFor="strategy-name">전략 이름</Label>
                  <Input
                    id="strategy-name"
                    placeholder="예: RSI 과매도 매수"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>

                {/* 매수 조건 */}
                <div className="rounded-lg border bg-green-50/50 p-4 dark:bg-green-950/20">
                  <ConditionBuilder
                    label="매수 조건"
                    condition={buyCondition}
                    onConditionChange={setBuyCondition}
                  />
                </div>

                {/* 매도 조건 */}
                <div className="rounded-lg border bg-red-50/50 p-4 dark:bg-red-950/20">
                  <ConditionBuilder
                    label="매도 조건"
                    condition={sellCondition}
                    onConditionChange={setSellCondition}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCustomDialogOpen(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={handleCreateCustomStrategy}
                  disabled={!customName.trim()}
                >
                  전략 저장
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <button
            onClick={() => setShowPresets(!showPresets)}
            className="text-xs text-primary hover:underline"
            data-testid="toggle-presets"
          >
            {showPresets ? '접기' : '펼치기'}
          </button>
        </div>
      </div>

      {showPresets && (
        <div className="space-y-2" data-testid="preset-list">
          {presets.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => handlePresetSelect(strategy.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selectedStrategy?.id === strategy.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
              data-testid={`strategy-${strategy.id}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{strategy.name}</span>
                {selectedStrategy?.id === strategy.id && (
                  <span className="text-xs text-primary">적용됨</span>
                )}
              </div>
              {strategy.description && (
                <p className="mt-1 text-xs text-muted-foreground">{strategy.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedStrategy && (
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground">선택된 전략</h4>
            {isCustomStrategy && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={handleEditStrategy}
              >
                <Settings2 className="mr-1 h-3 w-3" />
                수정
              </Button>
            )}
          </div>
          <div className="mt-2 rounded bg-muted/50 p-2">
            <p className="font-medium">{selectedStrategy.name}</p>
            {selectedStrategy.description && (
              <p className="mt-1 text-xs text-muted-foreground">{selectedStrategy.description}</p>
            )}
          </div>
          <button
            onClick={() => onStrategySelect(null)}
            className="mt-2 text-xs text-destructive hover:underline"
            data-testid="clear-strategy"
          >
            전략 해제
          </button>
        </div>
      )}
    </div>
  );
}

export default StrategySelector;
