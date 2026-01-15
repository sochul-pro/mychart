'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { MiniOHLCV } from '@/hooks/useSparklines';

interface SparklineChartProps {
  data: number[];
  ohlcv?: MiniOHLCV[];
  candleCount?: number;
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * SVG 기반 스파크라인 차트
 * 왼쪽: 최근 N개 일봉 (캔들스틱)
 * 오른쪽: 종가 라인 차트
 */
export const SparklineChart = memo(function SparklineChart({
  data,
  ohlcv = [],
  candleCount = 5,
  width = 80,
  height = 32,
  className,
  strokeWidth = 1.5,
}: SparklineChartProps) {
  // 캔들 영역 크기 계산
  const candleWidth = ohlcv.length > 0 ? 25 : 0; // 5개 캔들용 영역
  const sparklineWidth = width - candleWidth;
  const gap = ohlcv.length > 0 ? 2 : 0; // 캔들과 라인 사이 간격

  const chartData = useMemo(() => {
    if (!data || data.length < 2) {
      return null;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // 상승/하락 여부 (첫날 대비 마지막 날)
    const isUp = data[data.length - 1] >= data[0];

    // SVG path 포인트 생성 (캔들 영역 이후부터 시작)
    const offsetX = candleWidth + gap;
    const effectiveWidth = sparklineWidth - gap;
    const points = data.map((value, index) => {
      const x = offsetX + (index / (data.length - 1)) * effectiveWidth;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return { x, y };
    });

    // SVG path 문자열 생성
    const pathD = points
      .map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        return `L ${point.x} ${point.y}`;
      })
      .join(' ');

    // 영역 채우기용 path
    const areaD = `${pathD} L ${width} ${height} L ${offsetX} ${height} Z`;

    return { pathD, areaD, isUp, points, min, max, range };
  }, [data, width, height, candleWidth, sparklineWidth, gap]);

  // 캔들스틱 데이터 계산
  const candleData = useMemo(() => {
    if (!ohlcv || ohlcv.length === 0 || !chartData) return null;

    // 최근 N개만 사용
    const recentCandles = ohlcv.slice(-candleCount);
    if (recentCandles.length === 0) return null;

    // 전체 데이터의 min/range 사용 (라인 차트와 스케일 맞춤)
    const { min, range } = chartData;

    const candleGap = 1;
    const singleCandleWidth = (candleWidth - candleGap * (recentCandles.length + 1)) / recentCandles.length;

    return recentCandles.map((candle, index) => {
      const x = candleGap + index * (singleCandleWidth + candleGap);
      const isUp = candle.close >= candle.open;

      // Y 좌표 계산 (상단 패딩 2px)
      const highY = height - ((candle.high - min) / range) * (height - 4) - 2;
      const lowY = height - ((candle.low - min) / range) * (height - 4) - 2;
      const openY = height - ((candle.open - min) / range) * (height - 4) - 2;
      const closeY = height - ((candle.close - min) / range) * (height - 4) - 2;

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1); // 최소 1px

      return {
        x,
        width: singleCandleWidth,
        highY,
        lowY,
        bodyTop,
        bodyHeight,
        isUp,
      };
    });
  }, [ohlcv, candleCount, candleWidth, height, chartData]);

  if (!chartData) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ width, height }}
      >
        <span className="text-xs text-muted-foreground">-</span>
      </div>
    );
  }

  const strokeColor = chartData.isUp ? '#ef4444' : '#3b82f6'; // red-500 / blue-500
  const fillColor = chartData.isUp ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {/* 캔들스틱 (왼쪽) */}
      {candleData && candleData.map((candle, index) => {
        const candleColor = candle.isUp ? '#ef4444' : '#3b82f6';
        const centerX = candle.x + candle.width / 2;

        return (
          <g key={index}>
            {/* 심지 (고가-저가) */}
            <line
              x1={centerX}
              y1={candle.highY}
              x2={centerX}
              y2={candle.lowY}
              stroke={candleColor}
              strokeWidth={0.5}
            />
            {/* 몸통 (시가-종가) */}
            <rect
              x={candle.x}
              y={candle.bodyTop}
              width={candle.width}
              height={candle.bodyHeight}
              fill={candle.isUp ? candleColor : candleColor}
              stroke={candleColor}
              strokeWidth={0.5}
            />
          </g>
        );
      })}

      {/* 스파크라인 영역 채우기 */}
      <path d={chartData.areaD} fill={fillColor} />

      {/* 스파크라인 */}
      <path
        d={chartData.pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 마지막 점 강조 */}
      {chartData.points.length > 0 && (
        <circle
          cx={chartData.points[chartData.points.length - 1].x}
          cy={chartData.points[chartData.points.length - 1].y}
          r={2}
          fill={strokeColor}
        />
      )}
    </svg>
  );
});
