'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  ColorType,
  CrosshairMode,
  Time,
} from 'lightweight-charts';
import type { OHLCV, TimeFrame } from '@/types';
import type { IndicatorConfig, MAConfig, BollingerConfig, RSIConfig, MACDConfig } from './types';
import { isOverlayIndicator } from './types';
import { sma, ema, bollingerBands, rsi, macd } from '@/lib/indicators';

export interface StockChartWithIndicatorsProps {
  /** OHLCV 데이터 */
  data: OHLCV[];
  /** 지표 설정 */
  indicators: IndicatorConfig[];
  /** 차트 높이 (기본값: 400) */
  height?: number;
  /** 서브차트 높이 (기본값: 100) */
  subChartHeight?: number;
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
    time: (d.time / 1000) as Time,
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

/** 지표 데이터를 LineData로 변환 */
function toLineData(
  data: OHLCV[],
  values: (number | null)[]
): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  for (let i = 0; i < data.length; i++) {
    if (values[i] !== null) {
      result.push({
        time: (data[i].time / 1000) as Time,
        value: values[i]!,
      });
    }
  }
  return result;
}

/**
 * 지표를 포함한 주식 차트 컴포넌트
 */
export function StockChartWithIndicators({
  data,
  indicators,
  height = 400,
  subChartHeight = 100,
  showVolume = true,
  timeFrame = 'D',
  onTimeFrameChange,
  upColor = '#26a69a',
  downColor = '#ef5350',
  className = '',
}: StockChartWithIndicatorsProps) {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  const mainChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);

  const seriesRefs = useRef<Map<string, ISeriesApi<'Line' | 'Histogram' | 'Candlestick'>>>(
    new Map()
  );

  // 활성화된 지표 필터링
  const enabledIndicators = useMemo(
    () => indicators.filter((i) => i.enabled),
    [indicators]
  );

  const hasRSI = enabledIndicators.some((i) => i.type === 'rsi');
  const hasMACD = enabledIndicators.some((i) => i.type === 'macd');

  // 메인 차트 초기화
  useEffect(() => {
    if (!mainContainerRef.current) return;

    const chart = createChart(mainContainerRef.current, {
      width: mainContainerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: '#e0e0e0',
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.25 : 0.1 },
      },
      timeScale: { borderColor: '#e0e0e0', timeVisible: true },
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
    seriesRefs.current.set('candle', candleSeries);

    // 거래량 시리즈
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      seriesRefs.current.set('volume', volumeSeries);
    }

    mainChartRef.current = chart;

    const handleResize = () => {
      if (mainContainerRef.current && mainChartRef.current) {
        mainChartRef.current.applyOptions({
          width: mainContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    const currentSeriesRefs = seriesRefs.current;
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      mainChartRef.current = null;
      currentSeriesRefs.clear();
    };
  }, [height, showVolume, upColor, downColor]);

  // RSI 서브차트
  useEffect(() => {
    if (!hasRSI || !rsiContainerRef.current) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      return;
    }

    const chart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: subChartHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: '#e0e0e0',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: { visible: false },
    });

    const rsiSeries = chart.addLineSeries({
      color: '#E91E63',
      lineWidth: 2,
    });
    seriesRefs.current.set('rsi', rsiSeries);

    rsiChartRef.current = chart;

    const currentSeriesRefs = seriesRefs.current;
    return () => {
      chart.remove();
      rsiChartRef.current = null;
      currentSeriesRefs.delete('rsi');
    };
  }, [hasRSI, subChartHeight]);

  // MACD 서브차트
  useEffect(() => {
    if (!hasMACD || !macdContainerRef.current) {
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
      return;
    }

    const chart = createChart(macdContainerRef.current, {
      width: macdContainerRef.current.clientWidth,
      height: subChartHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: '#e0e0e0',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: { visible: false },
    });

    const macdLineSeries = chart.addLineSeries({
      color: '#00BCD4',
      lineWidth: 2,
    });
    const signalLineSeries = chart.addLineSeries({
      color: '#FF9800',
      lineWidth: 1,
    });
    const histogramSeries = chart.addHistogramSeries({
      color: '#26a69a',
    });

    seriesRefs.current.set('macd-line', macdLineSeries);
    seriesRefs.current.set('macd-signal', signalLineSeries);
    seriesRefs.current.set('macd-histogram', histogramSeries);

    macdChartRef.current = chart;

    const currentSeriesRefs = seriesRefs.current;
    return () => {
      chart.remove();
      macdChartRef.current = null;
      currentSeriesRefs.delete('macd-line');
      currentSeriesRefs.delete('macd-signal');
      currentSeriesRefs.delete('macd-histogram');
    };
  }, [hasMACD, subChartHeight]);

  // 오버레이 지표 업데이트 함수
  const updateOverlayIndicator = useCallback(
    (ohlcv: OHLCV[], config: IndicatorConfig) => {
      const chart = mainChartRef.current;
      if (!chart) return;

      const seriesKey = `${config.type}-${config.type === 'sma' || config.type === 'ema' ? (config as MAConfig).period : ''}`;
      let series = seriesRefs.current.get(seriesKey);

      if (!series) {
        series = chart.addLineSeries({
          color: config.color || '#2196F3',
          lineWidth: 1,
        });
        seriesRefs.current.set(seriesKey, series);
      }

      let values: (number | null)[] = [];

      switch (config.type) {
        case 'sma':
          values = sma(ohlcv, (config as MAConfig).period);
          break;
        case 'ema':
          values = ema(ohlcv, (config as MAConfig).period);
          break;
        case 'bollinger': {
          const bb = bollingerBands(
            ohlcv,
            (config as BollingerConfig).period,
            (config as BollingerConfig).stdDev
          );
          // 중간선
          (series as ISeriesApi<'Line'>).setData(toLineData(ohlcv, bb.middle));

          // 상단선
          const upperKey = 'bollinger-upper';
          let upperSeries = seriesRefs.current.get(upperKey);
          if (!upperSeries) {
            upperSeries = chart.addLineSeries({
              color: config.color || '#9C27B0',
              lineWidth: 1,
              lineStyle: 2, // Dashed
            });
            seriesRefs.current.set(upperKey, upperSeries);
          }
          (upperSeries as ISeriesApi<'Line'>).setData(toLineData(ohlcv, bb.upper));

          // 하단선
          const lowerKey = 'bollinger-lower';
          let lowerSeries = seriesRefs.current.get(lowerKey);
          if (!lowerSeries) {
            lowerSeries = chart.addLineSeries({
              color: config.color || '#9C27B0',
              lineWidth: 1,
              lineStyle: 2,
            });
            seriesRefs.current.set(lowerKey, lowerSeries);
          }
          (lowerSeries as ISeriesApi<'Line'>).setData(toLineData(ohlcv, bb.lower));
          return;
        }
      }

      (series as ISeriesApi<'Line'>).setData(toLineData(ohlcv, values));
    },
    []
  );

  // 데이터 및 지표 업데이트
  useEffect(() => {
    if (data.length === 0) return;

    // 캔들 데이터
    const candleSeries = seriesRefs.current.get('candle');
    if (candleSeries) {
      (candleSeries as ISeriesApi<'Candlestick'>).setData(toChartData(data));
    }

    // 거래량 데이터
    const volumeSeries = seriesRefs.current.get('volume');
    if (volumeSeries) {
      (volumeSeries as ISeriesApi<'Histogram'>).setData(
        toVolumeData(data, upColor + '80', downColor + '80')
      );
    }

    // 오버레이 지표 업데이트
    enabledIndicators
      .filter((i) => isOverlayIndicator(i.type))
      .forEach((config) => {
        updateOverlayIndicator(data, config);
      });

    // RSI 업데이트
    const rsiConfig = enabledIndicators.find((i) => i.type === 'rsi') as RSIConfig | undefined;
    if (rsiConfig) {
      const rsiSeries = seriesRefs.current.get('rsi');
      if (rsiSeries) {
        const rsiValues = rsi(data, rsiConfig.period);
        (rsiSeries as ISeriesApi<'Line'>).setData(toLineData(data, rsiValues));
      }
    }

    // MACD 업데이트
    const macdConfig = enabledIndicators.find((i) => i.type === 'macd') as MACDConfig | undefined;
    if (macdConfig) {
      const macdResult = macd(
        data,
        macdConfig.fastPeriod,
        macdConfig.slowPeriod,
        macdConfig.signalPeriod
      );

      const macdLineSeries = seriesRefs.current.get('macd-line');
      const signalLineSeries = seriesRefs.current.get('macd-signal');
      const histogramSeries = seriesRefs.current.get('macd-histogram');

      if (macdLineSeries) {
        (macdLineSeries as ISeriesApi<'Line'>).setData(toLineData(data, macdResult.macd));
      }
      if (signalLineSeries) {
        (signalLineSeries as ISeriesApi<'Line'>).setData(toLineData(data, macdResult.signal));
      }
      if (histogramSeries) {
        const histogramData: HistogramData<Time>[] = [];
        for (let i = 0; i < data.length; i++) {
          if (macdResult.histogram[i] !== null) {
            histogramData.push({
              time: (data[i].time / 1000) as Time,
              value: macdResult.histogram[i]!,
              color: macdResult.histogram[i]! >= 0 ? '#26a69a80' : '#ef535080',
            });
          }
        }
        (histogramSeries as ISeriesApi<'Histogram'>).setData(histogramData);
      }
    }

    // 차트 맞춤
    mainChartRef.current?.timeScale().fitContent();
    rsiChartRef.current?.timeScale().fitContent();
    macdChartRef.current?.timeScale().fitContent();
  }, [data, enabledIndicators, upColor, downColor, updateOverlayIndicator]);

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
    <div className={`flex flex-col ${className}`} data-testid="stock-chart-with-indicators">
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

      {/* 메인 차트 */}
      <div
        ref={mainContainerRef}
        style={{ width: '100%', height }}
        data-testid="main-chart"
      />

      {/* RSI 서브차트 */}
      {hasRSI && (
        <div className="mt-1">
          <div className="text-xs text-gray-500">RSI</div>
          <div
            ref={rsiContainerRef}
            style={{ width: '100%', height: subChartHeight }}
            data-testid="rsi-chart"
          />
        </div>
      )}

      {/* MACD 서브차트 */}
      {hasMACD && (
        <div className="mt-1">
          <div className="text-xs text-gray-500">MACD</div>
          <div
            ref={macdContainerRef}
            style={{ width: '100%', height: subChartHeight }}
            data-testid="macd-chart"
          />
        </div>
      )}
    </div>
  );
}

export default StockChartWithIndicators;
