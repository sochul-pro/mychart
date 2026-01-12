'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Loader2, Settings2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StockChartWithIndicators, IndicatorPanel } from '@/components/chart/indicators';
import { SignalStrategySelector, STRATEGY_STYLES } from './SignalStrategySelector';
import type { SelectedStrategy } from './SignalStrategySelector';
import { useChartSettings } from '@/hooks/useChartSettings';
import { useSignalPresets } from '@/hooks/useSignalPresets';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';
import { generateSignals } from '@/lib/signals/engine';
import type { IndicatorConfig } from '@/components/chart/indicators/types';
import type { SignalMarker } from '@/components/chart/indicators/StockChartWithIndicators';
import type { OHLCV, TimeFrame } from '@/types';

interface StockChartCardProps {
  ohlcv: OHLCV[] | undefined;
  timeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  height?: number;
  compact?: boolean;
}

export function StockChartCard({
  ohlcv,
  timeFrame,
  onTimeFrameChange,
  height = 600,
  compact = false,
}: StockChartCardProps) {
  const { settings, updateIndicators, updateSignalStrategies, isSaving } = useChartSettings();
  const { presets, defaultPresets } = useSignalPresets();
  const [isIndicatorPanelOpen, setIsIndicatorPanelOpen] = useState(false);
  const [localIndicators, setLocalIndicators] = useState<IndicatorConfig[] | null>(null);
  const [selectedStrategies, setSelectedStrategies] = useState<SelectedStrategy[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const indicators = localIndicators ?? settings.indicators;

  // 모든 전략 목록
  const allStrategies = useMemo(() => [...defaultPresets, ...presets], [defaultPresets, presets]);

  // 저장된 전략 ID로 selectedStrategies 초기화
  useEffect(() => {
    if (isInitialized || allStrategies.length === 0) return;

    const savedIds = settings.signalStrategies || [];
    if (savedIds.length === 0) {
      setIsInitialized(true);
      return;
    }

    const restored: SelectedStrategy[] = [];
    savedIds.forEach((id, index) => {
      const strategy = allStrategies.find((s) => s.id === id);
      if (strategy && index < STRATEGY_STYLES.length) {
        const style = STRATEGY_STYLES[index];
        restored.push({
          id: strategy.id,
          name: strategy.name,
          color: style.buy,
          buyShape: style.buyShape,
          sellShape: style.sellShape,
          buyRules: strategy.buyRules,
          sellRules: strategy.sellRules,
        });
      }
    });

    if (restored.length > 0) {
      setSelectedStrategies(restored);
    }
    setIsInitialized(true);
  }, [allStrategies, settings.signalStrategies, isInitialized]);

  // 선택된 전략에서 신호 생성
  const signalMarkers = useMemo<SignalMarker[]>(() => {
    if (!ohlcv || ohlcv.length === 0 || selectedStrategies.length === 0) {
      return [];
    }

    const allMarkers: SignalMarker[] = [];

    for (const strategy of selectedStrategies) {
      // 전략 생성
      const tradingStrategy = {
        id: strategy.id,
        name: strategy.name,
        buyCondition: strategy.buyRules,
        sellCondition: strategy.sellRules,
      };

      // 신호 생성
      const result = generateSignals(tradingStrategy, ohlcv);

      // 스타일 설정
      const styleSet = STRATEGY_STYLES.find((c) => c.buy === strategy.color) || STRATEGY_STYLES[0];

      // 마커 추가
      for (const signal of result.signals) {
        allMarkers.push({
          time: signal.time,
          type: signal.type,
          color: signal.type === 'buy' ? styleSet.buy : styleSet.sell,
          shape: signal.type === 'buy' ? strategy.buyShape : strategy.sellShape,
          strategyName: strategy.name,
        });
      }
    }

    return allMarkers;
  }, [ohlcv, selectedStrategies]);

  const debouncedSaveIndicators = useDebouncedCallback((newIndicators: IndicatorConfig[]) => {
    updateIndicators(newIndicators);
  }, 500);

  const debouncedSaveStrategies = useDebouncedCallback((strategyIds: string[]) => {
    updateSignalStrategies(strategyIds);
  }, 500);

  const handleIndicatorsChange = useCallback((newIndicators: IndicatorConfig[]) => {
    setLocalIndicators(newIndicators);
    debouncedSaveIndicators(newIndicators);
  }, [debouncedSaveIndicators]);

  const handleStrategiesChange = useCallback((strategies: SelectedStrategy[]) => {
    setSelectedStrategies(strategies);
    // 전략 ID만 저장
    const ids = strategies.map((s) => s.id);
    debouncedSaveStrategies(ids);
  }, [debouncedSaveStrategies]);

  const chartHeight = compact ? 400 : height;

  return (
    <Card className={compact ? '' : 'mb-6'}>
      <CardHeader className="pb-1 sm:pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? 'text-base' : ''}>차트</CardTitle>
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                저장 중...
              </span>
            )}
            <SignalStrategySelector
              selectedStrategies={selectedStrategies}
              onSelectionChange={handleStrategiesChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsIndicatorPanelOpen(!isIndicatorPanelOpen)}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">지표 설정</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  isIndicatorPanelOpen && 'rotate-180'
                )}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6 pt-0">
        {isIndicatorPanelOpen && (
          <div className="mb-4">
            <IndicatorPanel
              indicators={indicators}
              onIndicatorsChange={handleIndicatorsChange}
            />
          </div>
        )}

        {ohlcv && ohlcv.length > 0 ? (
          <StockChartWithIndicators
            data={ohlcv}
            indicators={indicators}
            signalMarkers={signalMarkers}
            height={chartHeight}
            showVolume={true}
            timeFrame={timeFrame}
            onTimeFrameChange={onTimeFrameChange}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-muted/30 rounded-lg"
            style={{ height: compact ? 300 : 400 }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
