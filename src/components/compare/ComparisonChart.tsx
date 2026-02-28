'use client';

import { useEffect, useRef, useMemo, memo } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  ColorType,
  CrosshairMode,
  Time,
  LineStyle,
} from 'lightweight-charts';
import type { ComparisonData, NormalizedDataPoint } from '@/types/comparison';
import { COMPARISON_COLORS, getComparisonColor } from '@/types/comparison';
import { formatReturn } from '@/lib/comparison/normalize';

export interface ComparisonChartProps {
  /** 비교 데이터 */
  data: ComparisonData | null;
  /** 종목 코드 순서 (색상 매칭용) */
  orderedCodes: string[];
  /** 차트 높이 (기본값: 400) */
  height?: number;
  /** 클래스명 */
  className?: string;
  /** 툴팁 표시 콜백 */
  onCrosshairMove?: (time: number | null, values: Record<string, number>) => void;
}

/** 정규화된 데이터를 Lightweight Charts 형식으로 변환 */
function toLineData(data: NormalizedDataPoint[]): LineData<Time>[] {
  return data.map((d) => ({
    time: d.time as Time,
    value: d.value,
  }));
}

/**
 * 상대 수익률 비교 차트 컴포넌트
 *
 * Lightweight Charts를 사용하여 여러 종목의 수익률을 오버레이
 */
export const ComparisonChart = memo(function ComparisonChart({
  data,
  orderedCodes,
  height = 400,
  className = '',
  onCrosshairMove,
}: ComparisonChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  // 차트 초기화
  useEffect(() => {
    if (!containerRef.current) return;

    // 기존 차트 정리
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRefs.current.clear();
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(156, 163, 175, 0.1)' },
        horzLines: { color: 'rgba(156, 163, 175, 0.1)' },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          width: 1,
          color: 'rgba(156, 163, 175, 0.5)',
          style: LineStyle.Dashed,
        },
        horzLine: {
          width: 1,
          color: 'rgba(156, 163, 175, 0.5)',
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(156, 163, 175, 0.2)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: 'rgba(156, 163, 175, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // 0% 기준선 추가
    // Lightweight Charts는 직접적인 기준선 지원이 없으므로
    // 프라이스 라인으로 대체
    chart.applyOptions({
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
    });

    // 반응형 리사이즈
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // 크로스헤어 이벤트
    chart.subscribeCrosshairMove((param) => {
      if (!onCrosshairMove) return;

      if (!param.time || !param.seriesData) {
        onCrosshairMove(null, {});
        return;
      }

      const values: Record<string, number> = {};
      param.seriesData.forEach((value, series) => {
        const code = Array.from(seriesRefs.current.entries()).find(
          ([, s]) => s === series
        )?.[0];
        if (code && 'value' in value) {
          values[code] = value.value as number;
        }
      });

      onCrosshairMove(param.time as number, values);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRefs.current.clear();
    };
  }, [height, onCrosshairMove]);

  // orderedCodes를 문자열로 변환하여 의존성 비교에 사용
  const orderedCodesKey = orderedCodes.join(',');

  // 데이터 업데이트
  useEffect(() => {
    if (!chartRef.current || !data) return;

    const chart = chartRef.current;
    const items = data.items;

    // 모든 기존 시리즈 제거 (색상 순서 보장을 위해)
    seriesRefs.current.forEach((series) => {
      chart.removeSeries(series);
    });
    seriesRefs.current.clear();

    // orderedCodes 순서대로 라인 시리즈 새로 생성 (색상 순서 보장)
    orderedCodes.forEach((code, index) => {
      const item = items[code];
      if (!item) return; // 데이터가 아직 로드되지 않은 경우

      const color = getComparisonColor(index);
      const lineData = toLineData(item.values);

      // 새 시리즈 생성
      const series = chart.addLineSeries({
        color,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        priceFormat: {
          type: 'custom',
          formatter: (value: number) => formatReturn(value),
        },
        lastValueVisible: true,
        priceLineVisible: false,
      });
      seriesRefs.current.set(code, series);

      // 데이터 설정
      series.setData(lineData);

      // 0% 기준선 추가 (첫 번째 시리즈에만)
      if (index === 0) {
        series.createPriceLine({
          price: 0,
          color: 'rgba(156, 163, 175, 0.5)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: '0%',
        });
      }
    });

    // 차트 범위 자동 조정
    chart.timeScale().fitContent();
  }, [data, orderedCodesKey]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full" />
      {(!data || orderedCodes.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          종목을 추가하여 비교해보세요
        </div>
      )}
    </div>
  );
});

export default ComparisonChart;
