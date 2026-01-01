'use client';

import { useState } from 'react';
import type { TradingStrategy, PresetStrategyId } from '@/lib/signals/types';
import { getPresetStrategies, getPresetStrategy } from '@/lib/signals/presets';

export interface StrategySelectorProps {
  /** 현재 선택된 전략 */
  selectedStrategy: TradingStrategy | null;
  /** 전략 선택 시 콜백 */
  onStrategySelect: (strategy: TradingStrategy | null) => void;
  /** 클래스명 */
  className?: string;
}

/**
 * 매매 전략 선택 컴포넌트
 */
export function StrategySelector({
  selectedStrategy,
  onStrategySelect,
  className = '',
}: StrategySelectorProps) {
  const [showPresets, setShowPresets] = useState(true);
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

  return (
    <div className={`rounded-lg border bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">매매 신호</h3>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="text-xs text-blue-600 hover:underline"
          data-testid="toggle-presets"
        >
          {showPresets ? '접기' : '펼치기'}
        </button>
      </div>

      {showPresets && (
        <div className="space-y-2" data-testid="preset-list">
          {presets.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => handlePresetSelect(strategy.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selectedStrategy?.id === strategy.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              data-testid={`strategy-${strategy.id}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{strategy.name}</span>
                {selectedStrategy?.id === strategy.id && (
                  <span className="text-xs text-blue-600">적용됨</span>
                )}
              </div>
              {strategy.description && (
                <p className="mt-1 text-xs text-gray-500">{strategy.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedStrategy && (
        <div className="mt-4 border-t pt-4">
          <h4 className="mb-2 text-xs font-medium text-gray-700">선택된 전략</h4>
          <div className="rounded bg-gray-50 p-2">
            <p className="font-medium text-gray-900">{selectedStrategy.name}</p>
            {selectedStrategy.description && (
              <p className="mt-1 text-xs text-gray-500">{selectedStrategy.description}</p>
            )}
          </div>
          <button
            onClick={() => onStrategySelect(null)}
            className="mt-2 text-xs text-red-600 hover:underline"
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
