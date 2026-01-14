'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BacktestResult } from '@/lib/signals/types';

interface EquityCurveChartProps {
  result: BacktestResult;
}

export function EquityCurveChart({ result }: EquityCurveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        horzLine: {
          visible: true,
          labelVisible: true,
        },
        vertLine: {
          visible: true,
          labelVisible: true,
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toISOString().slice(0, 10);
        },
      },
    });

    const lineSeries = chart.addLineSeries({
      color: '#22c55e',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => {
          if (price >= 100000000) {
            return `${(price / 100000000).toFixed(2)}억`;
          } else if (price >= 10000) {
            return `${(price / 10000).toFixed(0)}만`;
          }
          return price.toLocaleString();
        },
      },
    });

    // Transform equity curve data
    const lineData: LineData[] = result.equityCurve.map((point) => ({
      time: (point.time / 1000) as UTCTimestamp,
      value: point.value,
    }));

    lineSeries.setData(lineData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = lineSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [result.equityCurve]);

  // Calculate performance metrics
  const startValue = result.equityCurve[0]?.value || result.config.initialCapital;
  const endValue = result.equityCurve[result.equityCurve.length - 1]?.value || startValue;
  const profit = endValue - startValue;
  const profitPercent = ((profit / startValue) * 100).toFixed(2);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>자산 곡선</span>
          <div className="flex items-center gap-4 text-sm font-normal">
            <span className="text-muted-foreground">
              시작: {startValue.toLocaleString()}원
            </span>
            <span className={profit >= 0 ? 'text-green-500' : 'text-red-500'}>
              종료: {endValue.toLocaleString()}원 ({profit >= 0 ? '+' : ''}{profitPercent}%)
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={chartContainerRef} className="w-full" />
      </CardContent>
    </Card>
  );
}
