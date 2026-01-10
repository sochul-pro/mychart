'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * SVG 기반 스파크라인 차트
 * 최근 N일 종가를 라인 차트로 표시
 */
export const SparklineChart = memo(function SparklineChart({
  data,
  width = 80,
  height = 32,
  className,
  strokeWidth = 1.5,
}: SparklineChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length < 2) {
      return null;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // 상승/하락 여부 (첫날 대비 마지막 날)
    const isUp = data[data.length - 1] >= data[0];

    // SVG path 포인트 생성
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2; // 패딩 2px
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
    const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

    return { pathD, areaD, isUp, points };
  }, [data, width, height]);

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
      {/* 영역 채우기 */}
      <path d={chartData.areaD} fill={fillColor} />

      {/* 라인 */}
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
