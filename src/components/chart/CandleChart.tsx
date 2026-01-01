'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  ColorType,
  CrosshairMode,
  Time,
} from 'lightweight-charts';
import type { OHLCV, TimeFrame } from '@/types';

export interface CandleChartProps {
  /** OHLCV 데이터 */
  data: OHLCV[];
  /** 차트 너비 (기본값: 100%) */
  width?: number | string;
  /** 차트 높이 (기본값: 400) */
  height?: number;
  /** 거래량 표시 여부 */
  showVolume?: boolean;
  /** 현재 타임프레임 */
  timeFrame?: TimeFrame;
  /** 타임프레임 변경 시 콜백 */
  onTimeFrameChange?: (timeFrame: TimeFrame) => void;
  /** 상승 캔들 색상 */
  upColor?: string;
  /** 하락 캔들 색상 */
  downColor?: string;
  /** 클래스명 */
  className?: string;
}

/** OHLCV 데이터를 Lightweight Charts 형식으로 변환 */
function toChartData(data: OHLCV[]): CandlestickData<Time>[] {
  return data.map((d) => ({
    time: (d.time / 1000) as Time, // ms -> seconds
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }));
}

/** OHLCV 데이터를 거래량 히스토그램 형식으로 변환 */
function toVolumeData(data: OHLCV[], upColor: string, downColor: string): HistogramData<Time>[] {
  return data.map((d) => ({
    time: (d.time / 1000) as Time,
    value: d.volume,
    color: d.close >= d.open ? upColor : downColor,
  }));
}

/**
 * 캔들스틱 차트 컴포넌트
 *
 * Lightweight Charts를 사용한 주식 차트 렌더링
 */
export function CandleChart({
  data,
  width = '100%',
  height = 400,
  showVolume = true,
  timeFrame = 'D',
  onTimeFrameChange,
  upColor = '#26a69a',
  downColor = '#ef5350',
  className = '',
}: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // 차트 초기화
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: typeof width === 'number' ? width : containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#e0e0e0',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.25 : 0.1,
        },
      },
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    // 캔들스틱 시리즈
    const candleSeries = chart.addCandlestickSeries({
      upColor,
      downColor,
      borderDownColor: downColor,
      borderUpColor: upColor,
      wickDownColor: downColor,
      wickUpColor: upColor,
    });

    // 거래량 시리즈
    let volumeSeries: ISeriesApi<'Histogram'> | null = null;
    if (showVolume) {
      volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // 반응형 리사이즈
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height, showVolume, upColor, downColor, width]);

  // 데이터 업데이트
  useEffect(() => {
    if (!candleSeriesRef.current || data.length === 0) return;

    const candleData = toChartData(data);
    candleSeriesRef.current.setData(candleData);

    if (volumeSeriesRef.current) {
      const volumeData = toVolumeData(data, upColor + '80', downColor + '80');
      volumeSeriesRef.current.setData(volumeData);
    }

    // 마지막 데이터로 스크롤
    chartRef.current?.timeScale().fitContent();
  }, [data, upColor, downColor]);

  // 타임프레임 변경 핸들러
  const handleTimeFrameChange = useCallback(
    (tf: TimeFrame) => {
      onTimeFrameChange?.(tf);
    },
    [onTimeFrameChange]
  );

  const timeFrameLabels: Record<TimeFrame, string> = {
    D: '일',
    W: '주',
    M: '월',
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 타임프레임 선택 */}
      {onTimeFrameChange && (
        <div className="mb-2 flex gap-1">
          {(['D', 'W', 'M'] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeFrameChange(tf)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                timeFrame === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {timeFrameLabels[tf]}
            </button>
          ))}
        </div>
      )}

      {/* 차트 컨테이너 */}
      <div
        ref={containerRef}
        style={{ width: typeof width === 'number' ? width : width, height }}
        data-testid="candle-chart"
      />
    </div>
  );
}

export default CandleChart;
