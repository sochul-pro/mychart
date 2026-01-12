'use client';

import { useEffect, useRef, useMemo } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  SeriesMarker,
  Time,
} from 'lightweight-charts';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStockOHLCV } from '@/hooks/useStock';
import type { BacktestResult, Trade } from '@/lib/signals/types';
import type { OHLCV } from '@/types';

interface BacktestPriceChartProps {
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
    // 매수 마커
    markers.push({
      time: (trade.entryTime / 1000) as Time,
      position: 'belowBar',
      color: '#26a69a',
      shape: 'arrowUp',
      text: 'B',
    });

    // 매도 마커 (청산된 거래만)
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

  // 시간순 정렬
  markers.sort((a, b) => (a.time as number) - (b.time as number));

  return markers;
}

export function BacktestPriceChart({ result }: BacktestPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const { config, trades } = result;

  // 날짜를 Date 객체로 변환 (JSON에서 문자열로 올 수 있음)
  const startDate = useMemo(() =>
    config.startDate instanceof Date ? config.startDate : new Date(config.startDate),
    [config.startDate]
  );
  const endDate = useMemo(() =>
    config.endDate instanceof Date ? config.endDate : new Date(config.endDate),
    [config.endDate]
  );

  // 날짜 차이 계산 (여유분 포함)
  const daysDiff = useMemo(() => {
    const diff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.min(diff + 50, 500); // 지표 계산용 여유 데이터 + 최대 500
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

  // 마커 생성
  const markers = useMemo(() => tradesToMarkers(trades), [trades]);

  // 차트 초기화 및 데이터 설정
  useEffect(() => {
    if (!chartContainerRef.current || filteredData.length === 0) return;

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.remove();
    }

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
      height: 400,
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        horzLine: { visible: true, labelVisible: true },
        vertLine: { visible: true, labelVisible: true },
      },
    });

    // 캔들스틱 시리즈
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // 거래량 시리즈 (하단 20% 영역)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      borderVisible: false,
    });

    // 데이터 설정
    candleSeries.setData(toChartData(filteredData));
    volumeSeries.setData(toVolumeData(filteredData));

    // 마커 설정
    candleSeries.setMarkers(markers);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // 리사이즈 핸들러
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
  }, [filteredData, markers]);

  // 거래 통계
  const buyCount = trades.length;
  const sellCount = trades.filter((t) => t.status === 'closed').length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>가격 차트</span>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            차트 데이터를 불러올 수 없습니다.
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full" />
        )}
      </CardContent>
    </Card>
  );
}
