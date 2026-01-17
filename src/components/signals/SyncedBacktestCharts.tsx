'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  AreaData,
  SeriesMarker,
  Time,
} from 'lightweight-charts';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStockOHLCV } from '@/hooks/useStock';
import type { BacktestResult, Trade } from '@/lib/signals/types';
import type { OHLCV } from '@/types';

interface SyncedBacktestChartsProps {
  result: BacktestResult;
}

/** OHLCV 데이터를 Lightweight Charts 형식으로 변환 */
function toChartData(data: OHLCV[]): CandlestickData<Time>[] {
  return data.map((d) => ({
    time: (d.time / 1000) as Time,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }));
}

/** OHLCV 데이터를 거래량 히스토그램 형식으로 변환 */
function toVolumeData(data: OHLCV[]): HistogramData<Time>[] {
  return data.map((d) => ({
    time: (d.time / 1000) as Time,
    value: d.volume,
    color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
  }));
}

/** 거래를 차트 마커로 변환 */
function tradesToMarkers(trades: Trade[]): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = [];

  trades.forEach((trade) => {
    markers.push({
      time: (trade.entryTime / 1000) as Time,
      position: 'belowBar',
      color: '#26a69a',
      shape: 'arrowUp',
      text: 'B',
    });

    if (trade.exitTime && trade.status === 'closed') {
      markers.push({
        time: (trade.exitTime / 1000) as Time,
        position: 'aboveBar',
        color: '#ef5350',
        shape: 'arrowDown',
        text: 'S',
      });
    }
  });

  markers.sort((a, b) => (a.time as number) - (b.time as number));
  return markers;
}

/** 이동평균 계산 */
function calculateSMA(data: OHLCV[], period: number): LineData<Time>[] {
  const result: LineData<Time>[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: (data[i].time / 1000) as Time,
      value: sum / period,
    });
  }

  return result;
}

/** 이동평균선 색상 설정 */
const MA_COLORS = {
  5: '#f59e0b',   // 노란색 (5일)
  10: '#ec4899',  // 분홍색 (10일)
  20: '#22c55e',  // 녹색 (20일)
  50: '#3b82f6',  // 파란색 (50일)
} as const;

export function SyncedBacktestCharts({ result }: SyncedBacktestChartsProps) {
  // Chart container refs
  const priceContainerRef = useRef<HTMLDivElement>(null);
  const equityContainerRef = useRef<HTMLDivElement>(null);
  const drawdownContainerRef = useRef<HTMLDivElement>(null);

  // Chart instance refs
  const priceChartRef = useRef<IChartApi | null>(null);
  const equityChartRef = useRef<IChartApi | null>(null);
  const drawdownChartRef = useRef<IChartApi | null>(null);

  // Series refs
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const equitySeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const drawdownSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  // Sync lock to prevent infinite loops
  const isSyncingRef = useRef(false);

  // Disposed flag to prevent accessing removed charts
  const isDisposedRef = useRef(false);

  const { config, trades, equityCurve, drawdownCurve, maxDrawdown, maxDrawdownDuration } = result;

  // 날짜를 Date 객체로 변환
  const startDate = useMemo(
    () => (config.startDate instanceof Date ? config.startDate : new Date(config.startDate)),
    [config.startDate]
  );
  const endDate = useMemo(
    () => (config.endDate instanceof Date ? config.endDate : new Date(config.endDate)),
    [config.endDate]
  );

  // 날짜 차이 계산
  const daysDiff = useMemo(() => {
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(diff + 50, 500);
  }, [startDate, endDate]);

  // OHLCV 데이터 조회
  const { data: ohlcvData, isLoading } = useStockOHLCV({
    symbol: config.symbol,
    timeFrame: 'D',
    limit: daysDiff,
    enabled: !!config.symbol,
  });

  // 날짜 범위 내 데이터 필터링
  const filteredData = useMemo(() => {
    if (!ohlcvData) return [];
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    return ohlcvData.filter((d) => d.time >= startTime && d.time <= endTime);
  }, [ohlcvData, startDate, endDate]);

  // 차트 데이터의 실제 시간 범위 (OHLCV 데이터가 없는 구간의 마커 방지)
  const chartTimeRange = useMemo(() => {
    if (filteredData.length === 0) return { start: 0, end: 0 };
    return {
      start: filteredData[0].time,
      end: filteredData[filteredData.length - 1].time,
    };
  }, [filteredData]);

  // 마커 생성 (차트 데이터 범위 내의 거래만)
  const markers = useMemo(() => {
    const filteredTrades = trades.filter((trade) => {
      const entryInRange = trade.entryTime >= chartTimeRange.start && trade.entryTime <= chartTimeRange.end;
      const exitInRange = !trade.exitTime || (trade.exitTime >= chartTimeRange.start && trade.exitTime <= chartTimeRange.end);
      return entryInRange || exitInRange;
    });
    return tradesToMarkers(filteredTrades);
  }, [trades, chartTimeRange]);

  // 자산곡선 데이터 (차트 데이터 범위 내만)
  const equityData: LineData<Time>[] = useMemo(
    () =>
      equityCurve
        .filter((point) => point.time >= chartTimeRange.start && point.time <= chartTimeRange.end)
        .map((point) => ({
          time: (point.time / 1000) as Time,
          value: point.value,
        })),
    [equityCurve, chartTimeRange]
  );

  // 낙폭 데이터 (차트 데이터 범위 내만)
  const drawdownData: AreaData<Time>[] = useMemo(
    () =>
      drawdownCurve
        .filter((point) => point.time >= chartTimeRange.start && point.time <= chartTimeRange.end)
        .map((point) => ({
          time: (point.time / 1000) as Time,
          value: point.value,
        })),
    [drawdownCurve, chartTimeRange]
  );

  // 시간축 동기화 함수 (가격 차트 기준으로만 동기화)
  const syncFromPriceChart = useCallback(() => {
    // 차트가 제거되었으면 동기화 중지
    if (isDisposedRef.current || isSyncingRef.current || !priceChartRef.current) return;

    try {
      const timeRange = priceChartRef.current.timeScale().getVisibleRange();
      if (!timeRange) return;

      isSyncingRef.current = true;

      // 가격 차트 → 자산곡선, 낙폭 차트로만 동기화
      if (equityChartRef.current) {
        equityChartRef.current.timeScale().setVisibleRange(timeRange);
      }
      if (drawdownChartRef.current) {
        drawdownChartRef.current.timeScale().setVisibleRange(timeRange);
      }
    } catch {
      // 차트가 disposed 상태일 수 있음 - 무시
    } finally {
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }
  }, []);

  // 차트 초기화
  useEffect(() => {
    if (
      !priceContainerRef.current ||
      !equityContainerRef.current ||
      !drawdownContainerRef.current ||
      filteredData.length === 0
    )
      return;

    // 기존 차트 제거
    priceChartRef.current?.remove();
    equityChartRef.current?.remove();
    drawdownChartRef.current?.remove();

    const commonOptions = {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        fixRightEdge: true,
      },
      crosshair: {
        horzLine: { visible: true, labelVisible: true },
        vertLine: { visible: true, labelVisible: true },
      },
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toISOString().slice(0, 10);
        },
      },
    };

    // 1. 가격 차트 생성
    const priceChart = createChart(priceContainerRef.current, {
      ...commonOptions,
      width: priceContainerRef.current.clientWidth,
      height: 520,
    });

    const candleSeries = priceChart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const volumeSeries = priceChart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    priceChart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      borderVisible: false,
    });

    candleSeries.setData(toChartData(filteredData));
    volumeSeries.setData(toVolumeData(filteredData));
    candleSeries.setMarkers(markers);

    // 이동평균선 추가 (5, 10, 20, 50일)
    const maPeriods = [5, 10, 20, 50] as const;
    maPeriods.forEach((period) => {
      const maSeries = priceChart.addLineSeries({
        color: MA_COLORS[period],
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      const maData = calculateSMA(filteredData, period);
      maSeries.setData(maData);
    });

    // 2. 자산곡선 차트 생성
    const equityChart = createChart(equityContainerRef.current, {
      ...commonOptions,
      width: equityContainerRef.current.clientWidth,
      height: 140,
    });

    const equitySeries = equityChart.addLineSeries({
      color: '#22c55e',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => {
          if (price >= 100000000) return `${(price / 100000000).toFixed(2)}억`;
          if (price >= 10000) return `${(price / 10000).toFixed(0)}만`;
          return price.toLocaleString();
        },
      },
    });

    equitySeries.setData(equityData);

    // 3. 낙폭 차트 생성
    const drawdownChart = createChart(drawdownContainerRef.current, {
      ...commonOptions,
      width: drawdownContainerRef.current.clientWidth,
      height: 140,
    });

    const drawdownSeries = drawdownChart.addAreaSeries({
      lineColor: '#ef4444',
      topColor: 'rgba(239, 68, 68, 0.4)',
      bottomColor: 'rgba(239, 68, 68, 0.0)',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => `${price.toFixed(2)}%`,
      },
    });

    drawdownSeries.setData(drawdownData);

    // 시간축 동기화 설정 (가격 차트 기준으로만 동기화)
    // 가격 차트의 변경만 다른 차트로 전파
    priceChart.timeScale().subscribeVisibleTimeRangeChange(() => {
      syncFromPriceChart();
    });

    // 초기 시간축 맞추기
    priceChart.timeScale().fitContent();
    const initialRange = priceChart.timeScale().getVisibleRange();
    if (initialRange) {
      equityChart.timeScale().setVisibleRange(initialRange);
      drawdownChart.timeScale().setVisibleRange(initialRange);
    }

    // Refs 저장
    priceChartRef.current = priceChart;
    equityChartRef.current = equityChart;
    drawdownChartRef.current = drawdownChart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    equitySeriesRef.current = equitySeries;
    drawdownSeriesRef.current = drawdownSeries;

    // 리사이즈 핸들러
    const handleResize = () => {
      if (priceContainerRef.current && priceChartRef.current) {
        priceChartRef.current.applyOptions({ width: priceContainerRef.current.clientWidth });
      }
      if (equityContainerRef.current && equityChartRef.current) {
        equityChartRef.current.applyOptions({ width: equityContainerRef.current.clientWidth });
      }
      if (drawdownContainerRef.current && drawdownChartRef.current) {
        drawdownChartRef.current.applyOptions({ width: drawdownContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    // disposed 플래그 초기화
    isDisposedRef.current = false;

    return () => {
      // 먼저 disposed 플래그 설정
      isDisposedRef.current = true;

      window.removeEventListener('resize', handleResize);

      // refs 초기화
      priceChartRef.current = null;
      equityChartRef.current = null;
      drawdownChartRef.current = null;

      // 차트 제거
      priceChart.remove();
      equityChart.remove();
      drawdownChart.remove();
    };
  }, [filteredData, markers, equityData, drawdownData, syncFromPriceChart]);

  // 거래 통계
  const buyCount = trades.length;
  const sellCount = trades.filter((t) => t.status === 'closed').length;

  // 자산곡선 통계
  const startValue = equityCurve[0]?.value || config.initialCapital;
  const endValue = equityCurve[equityCurve.length - 1]?.value || startValue;
  const profit = endValue - startValue;
  const profitPercent = ((profit / startValue) * 100).toFixed(2);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[800px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (filteredData.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          차트 데이터를 불러올 수 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 가격 차트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>가격 차트</span>
              {/* 이동평균선 범례 */}
              <div className="flex items-center gap-3 text-xs font-normal text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-[#f59e0b]" />5
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-[#ec4899]" />10
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-[#22c55e]" />20
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-[#3b82f6]" />50
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm font-normal">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#26a69a]" />
                매수 {buyCount}회
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#ef5350]" />
                매도 {sellCount}회
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={priceContainerRef} className="w-full" />
        </CardContent>
      </Card>

      {/* 자산 곡선 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>자산 곡선</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <span className="text-muted-foreground">시작: {startValue.toLocaleString()}원</span>
              <span className={profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                종료: {endValue.toLocaleString()}원 ({profit >= 0 ? '+' : ''}
                {profitPercent}%)
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={equityContainerRef} className="w-full" />
        </CardContent>
      </Card>

      {/* 낙폭 차트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>낙폭 (Drawdown)</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <span className="text-orange-500">MDD: -{maxDrawdown.toFixed(2)}%</span>
              <span className="text-muted-foreground">최대 낙폭 기간: {maxDrawdownDuration}일</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={drawdownContainerRef} className="w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
