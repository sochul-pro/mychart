'use client';

import { useEffect, useRef, memo } from 'react';
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
import { getComparisonColor } from '@/types/comparison';
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
}: ComparisonChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const baselineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

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

    // 0% 기준선용 투명 시리즈 생성 (종목 시리즈와 독립적으로 유지)
    const baselineSeries = chart.addLineSeries({
      color: 'transparent',
      lineWidth: 1,
      visible: false, // 라인 자체는 숨김
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    baselineSeries.createPriceLine({
      price: 0,
      color: 'rgba(156, 163, 175, 0.5)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '0%',
    });
    // 기준선이 보이도록 최소한의 데이터 설정
    baselineSeries.setData([{ time: 0 as Time, value: 0 }]);
    baselineSeriesRef.current = baselineSeries;

    // 반응형 리사이즈
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // cleanup을 위해 현재 ref 값을 캡처
    const currentSeriesRefs = seriesRefs.current;

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      currentSeriesRefs.clear();
      baselineSeriesRef.current = null;
    };
  }, [height]);

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
    });

    // 기준선 시리즈 데이터를 실제 데이터 범위에 맞게 업데이트
    if (baselineSeriesRef.current && orderedCodes.length > 0) {
      const firstCode = orderedCodes[0];
      const firstItem = items[firstCode];
      if (firstItem && firstItem.values.length > 0) {
        const firstTime = firstItem.values[0].time;
        const lastTime = firstItem.values[firstItem.values.length - 1].time;
        baselineSeriesRef.current.setData([
          { time: firstTime as Time, value: 0 },
          { time: lastTime as Time, value: 0 },
        ]);
      }
    }

    // 차트 범위 자동 조정
    chart.timeScale().fitContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, orderedCodesKey]); // orderedCodesKey는 orderedCodes의 문자열 표현

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
