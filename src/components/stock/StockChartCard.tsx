'use client';

import { useState, useCallback } from 'react';
import { Loader2, Settings2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StockChartWithIndicators, IndicatorPanel } from '@/components/chart/indicators';
import { useChartSettings } from '@/hooks/useChartSettings';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';
import type { IndicatorConfig } from '@/components/chart/indicators/types';
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
  const { settings, updateIndicators, isSaving } = useChartSettings();
  const [isIndicatorPanelOpen, setIsIndicatorPanelOpen] = useState(false);
  const [localIndicators, setLocalIndicators] = useState<IndicatorConfig[] | null>(null);

  const indicators = localIndicators ?? settings.indicators;

  const debouncedSave = useDebouncedCallback((newIndicators: IndicatorConfig[]) => {
    updateIndicators(newIndicators);
  }, 500);

  const handleIndicatorsChange = useCallback((newIndicators: IndicatorConfig[]) => {
    setLocalIndicators(newIndicators);
    debouncedSave(newIndicators);
  }, [debouncedSave]);

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
