'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
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
  LogicalRange,
  SeriesMarker,
} from 'lightweight-charts';
import type { OHLCV, TimeFrame } from '@/types';
import type { IndicatorConfig, MAConfig, BollingerConfig, RSIConfig, MACDConfig, StochasticConfig } from './types';
import { isOverlayIndicator } from './types';
import { sma, ema, bollingerBands, rsi, macd, stochastic } from '@/lib/indicators';

/** 마커 모양 타입 */
export type MarkerShape = 'arrowUp' | 'arrowDown' | 'circle' | 'square';

/** 매매 신호 마커 */
export interface SignalMarker {
  time: number; // timestamp in milliseconds
  type: 'buy' | 'sell';
  color: string;
  shape: MarkerShape;
  strategyName: string;
  reason?: string; // 신호 발생 조건
  price?: number; // 신호 발생 시점 가격
}

export interface StockChartWithIndicatorsProps {
  /** OHLCV 데이터 */
  data: OHLCV[];
  /** 지표 설정 */
  indicators: IndicatorConfig[];
  /** 매매 신호 마커 */
  signalMarkers?: SignalMarker[];
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
/** 신호 마커를 차트 마커로 변환 */
function toChartMarkers(signals: SignalMarker[]): SeriesMarker<Time>[] {
  return signals
    .map((signal) => ({
      time: (signal.time / 1000) as Time,
      position: signal.type === 'buy' ? 'belowBar' : 'aboveBar',
      color: signal.color,
      shape: signal.shape,
      text: signal.type === 'buy' ? 'B' : 'S',
    } as SeriesMarker<Time>))
    .sort((a, b) => (a.time as number) - (b.time as number));
}

export function StockChartWithIndicators({
  data,
  indicators,
  signalMarkers = [],
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
  const stochasticContainerRef = useRef<HTMLDivElement>(null);

  const mainChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const stochasticChartRef = useRef<IChartApi | null>(null);

  const seriesRefs = useRef<Map<string, ISeriesApi<'Line' | 'Histogram' | 'Candlestick'>>>(
    new Map()
  );

  // 동기화 관련 refs
  const isSyncingRef = useRef(false);
  const isDisposedRef = useRef(false);

  // 호버된 신호 정보 상태
  const [hoveredSignals, setHoveredSignals] = useState<SignalMarker[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // signalMarkers를 ref로 저장 (크로스헤어 핸들러에서 최신값 참조용)
  const signalMarkersRef = useRef<SignalMarker[]>(signalMarkers);
  useEffect(() => {
    signalMarkersRef.current = signalMarkers;
  }, [signalMarkers]);

  // 활성화된 지표 필터링
  const enabledIndicators = useMemo(
    () => indicators.filter((i) => i.enabled),
    [indicators]
  );

  const hasRSI = enabledIndicators.some((i) => i.type === 'rsi');
  const hasMACD = enabledIndicators.some((i) => i.type === 'macd');
  const hasStochastic = enabledIndicators.some((i) => i.type === 'stochastic');

  // 이동평균선 범례 데이터
  const maLegendData = useMemo(() => {
    const maIndicators = enabledIndicators.filter(
      (i) => i.type === 'sma' || i.type === 'ema'
    ) as MAConfig[];

    return maIndicators.map((config) => ({
      period: config.period,
      color: config.color || '#2196F3',
    }));
  }, [enabledIndicators]);

  // 시간축 동기화 함수 (메인 차트 기준)
  const syncChartsFromMain = useCallback(() => {
    if (isDisposedRef.current || isSyncingRef.current || !mainChartRef.current) return;

    try {
      const logicalRange = mainChartRef.current.timeScale().getVisibleLogicalRange();
      if (!logicalRange) return;

      isSyncingRef.current = true;

      // RSI 차트 동기화
      if (rsiChartRef.current) {
        rsiChartRef.current.timeScale().setVisibleLogicalRange(logicalRange);
      }
      // MACD 차트 동기화
      if (macdChartRef.current) {
        macdChartRef.current.timeScale().setVisibleLogicalRange(logicalRange);
      }
      // Stochastic 차트 동기화
      if (stochasticChartRef.current) {
        stochasticChartRef.current.timeScale().setVisibleLogicalRange(logicalRange);
      }
    } catch {
      // 차트가 disposed 상태일 수 있음 - 무시
    } finally {
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }
  }, []);

  // 서브 차트의 시간축 변경을 메인 차트로 역방향 동기화
  const syncMainFromSubChart = useCallback((logicalRange: LogicalRange | null) => {
    if (isDisposedRef.current || isSyncingRef.current || !mainChartRef.current || !logicalRange) return;

    try {
      isSyncingRef.current = true;

      mainChartRef.current.timeScale().setVisibleLogicalRange(logicalRange);

      // 다른 서브 차트들도 동기화
      if (rsiChartRef.current) {
        rsiChartRef.current.timeScale().setVisibleLogicalRange(logicalRange);
      }
      if (macdChartRef.current) {
        macdChartRef.current.timeScale().setVisibleLogicalRange(logicalRange);
      }
      if (stochasticChartRef.current) {
        stochasticChartRef.current.timeScale().setVisibleLogicalRange(logicalRange);
      }
    } catch {
      // 차트가 disposed 상태일 수 있음 - 무시
    } finally {
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }
  }, []);

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
      timeScale: { borderColor: '#e0e0e0', timeVisible: true, fixRightEdge: true },
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toISOString().slice(0, 10);
        },
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
    isDisposedRef.current = false;

    // 시간축 동기화 구독
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      syncChartsFromMain();
    });

    // 크로스헤어 이동 이벤트 (신호 툴팁용)
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        setHoveredSignals([]);
        setTooltipPosition(null);
        return;
      }

      // 현재 커서 위치의 시간 (초 단위)
      const cursorTime = param.time as number;

      // 해당 시간에 있는 신호 찾기 (ref에서 최신값 참조)
      const matchingSignals = signalMarkersRef.current.filter((signal) => {
        const signalTime = Math.floor(signal.time / 1000);
        return signalTime === cursorTime;
      });

      if (matchingSignals.length > 0) {
        setHoveredSignals(matchingSignals);
        setTooltipPosition({ x: param.point.x, y: param.point.y });
      } else {
        setHoveredSignals([]);
        setTooltipPosition(null);
      }
    });

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
      isDisposedRef.current = true;
      window.removeEventListener('resize', handleResize);
      chart.remove();
      mainChartRef.current = null;
      currentSeriesRefs.clear();
    };
  }, [height, showVolume, upColor, downColor, syncChartsFromMain]);

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
      timeScale: { visible: false, fixRightEdge: true },
    });

    const rsiSeries = chart.addLineSeries({
      color: '#E91E63',
      lineWidth: 2,
    });
    seriesRefs.current.set('rsi', rsiSeries);

    rsiChartRef.current = chart;

    // 역방향 동기화 구독 (RSI → 메인)
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      syncMainFromSubChart(range);
    });

    // 초기 동기화
    if (mainChartRef.current) {
      const logicalRange = mainChartRef.current.timeScale().getVisibleLogicalRange();
      if (logicalRange) {
        chart.timeScale().setVisibleLogicalRange(logicalRange);
      }
    }

    // 리사이즈 핸들러
    const handleResize = () => {
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    const currentSeriesRefs = seriesRefs.current;
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      rsiChartRef.current = null;
      currentSeriesRefs.delete('rsi');
    };
  }, [hasRSI, subChartHeight, syncMainFromSubChart]);

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
      timeScale: { visible: false, fixRightEdge: true },
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

    // 역방향 동기화 구독 (MACD → 메인)
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      syncMainFromSubChart(range);
    });

    // 초기 동기화
    if (mainChartRef.current) {
      const logicalRange = mainChartRef.current.timeScale().getVisibleLogicalRange();
      if (logicalRange) {
        chart.timeScale().setVisibleLogicalRange(logicalRange);
      }
    }

    // 리사이즈 핸들러
    const handleResize = () => {
      if (macdContainerRef.current && macdChartRef.current) {
        macdChartRef.current.applyOptions({ width: macdContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    const currentSeriesRefs = seriesRefs.current;
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      macdChartRef.current = null;
      currentSeriesRefs.delete('macd-line');
      currentSeriesRefs.delete('macd-signal');
      currentSeriesRefs.delete('macd-histogram');
    };
  }, [hasMACD, subChartHeight, syncMainFromSubChart]);

  // Stochastic 서브차트
  useEffect(() => {
    if (!hasStochastic || !stochasticContainerRef.current) {
      if (stochasticChartRef.current) {
        stochasticChartRef.current.remove();
        stochasticChartRef.current = null;
      }
      return;
    }

    const chart = createChart(stochasticContainerRef.current, {
      width: stochasticContainerRef.current.clientWidth,
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
      timeScale: { visible: false, fixRightEdge: true },
    });

    // %K 라인 (빠른 선)
    const kSeries = chart.addLineSeries({
      color: '#4CAF50',
      lineWidth: 2,
    });
    // %D 라인 (느린 선)
    const dSeries = chart.addLineSeries({
      color: '#FF5722',
      lineWidth: 1,
    });

    seriesRefs.current.set('stochastic-k', kSeries);
    seriesRefs.current.set('stochastic-d', dSeries);

    stochasticChartRef.current = chart;

    // 역방향 동기화 구독 (Stochastic → 메인)
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      syncMainFromSubChart(range);
    });

    // 초기 동기화
    if (mainChartRef.current) {
      const logicalRange = mainChartRef.current.timeScale().getVisibleLogicalRange();
      if (logicalRange) {
        chart.timeScale().setVisibleLogicalRange(logicalRange);
      }
    }

    // 리사이즈 핸들러
    const handleResize = () => {
      if (stochasticContainerRef.current && stochasticChartRef.current) {
        stochasticChartRef.current.applyOptions({ width: stochasticContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    const currentSeriesRefs = seriesRefs.current;
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      stochasticChartRef.current = null;
      currentSeriesRefs.delete('stochastic-k');
      currentSeriesRefs.delete('stochastic-d');
    };
  }, [hasStochastic, subChartHeight, syncMainFromSubChart]);

  // 시리즈 제거 함수
  const removeOverlaySeries = useCallback((seriesKey: string) => {
    const chart = mainChartRef.current;
    const series = seriesRefs.current.get(seriesKey);
    if (chart && series) {
      try {
        chart.removeSeries(series);
      } catch {
        // 시리즈가 이미 제거되었거나 차트가 유효하지 않은 경우 무시
      }
      seriesRefs.current.delete(seriesKey);
    }
  }, []);

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
      } else {
        // 기존 시리즈가 있으면 색상 업데이트
        (series as ISeriesApi<'Line'>).applyOptions({
          color: config.color || '#2196F3',
        });
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

  // 비활성화된 오버레이 지표 제거
  const cleanupDisabledOverlays = useCallback(
    (allIndicators: IndicatorConfig[]) => {
      // 차트가 아직 초기화되지 않았으면 스킵
      if (!mainChartRef.current) return;

      const enabledKeys = new Set<string>();

      // 활성화된 지표의 시리즈 키 수집
      for (const config of allIndicators) {
        if (!config.enabled || !isOverlayIndicator(config.type)) continue;

        if (config.type === 'sma' || config.type === 'ema') {
          enabledKeys.add(`${config.type}-${(config as MAConfig).period}`);
        } else if (config.type === 'bollinger') {
          enabledKeys.add('bollinger-');
          enabledKeys.add('bollinger-upper');
          enabledKeys.add('bollinger-lower');
        }
      }

      // 비활성화된 시리즈 제거
      const keysToRemove: string[] = [];
      seriesRefs.current.forEach((_, key) => {
        // candle, volume, rsi, macd, stochastic 시리즈는 건드리지 않음
        if (key === 'candle' || key === 'volume' || key === 'rsi' || key.startsWith('macd') || key.startsWith('stochastic')) {
          return;
        }
        if (!enabledKeys.has(key)) {
          keysToRemove.push(key);
        }
      });

      keysToRemove.forEach(removeOverlaySeries);
    },
    [removeOverlaySeries]
  );

  // 데이터 및 지표 업데이트
  useEffect(() => {
    if (data.length === 0 || !mainChartRef.current) return;

    // 캔들 데이터
    const candleSeries = seriesRefs.current.get('candle');
    if (candleSeries) {
      (candleSeries as ISeriesApi<'Candlestick'>).setData(toChartData(data));
      // 매매 신호 마커 설정
      const markers = toChartMarkers(signalMarkers);
      (candleSeries as ISeriesApi<'Candlestick'>).setMarkers(markers);
    }

    // 거래량 데이터
    const volumeSeries = seriesRefs.current.get('volume');
    if (volumeSeries) {
      (volumeSeries as ISeriesApi<'Histogram'>).setData(
        toVolumeData(data, upColor + '80', downColor + '80')
      );
    }

    // 비활성화된 오버레이 지표 제거 (전체 indicators 배열 전달)
    cleanupDisabledOverlays(indicators);

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

    // Stochastic 업데이트
    const stochasticConfig = enabledIndicators.find((i) => i.type === 'stochastic') as StochasticConfig | undefined;
    if (stochasticConfig) {
      const stochasticResult = stochastic(
        data,
        stochasticConfig.kPeriod,
        stochasticConfig.dPeriod
      );

      const kSeries = seriesRefs.current.get('stochastic-k');
      const dSeries = seriesRefs.current.get('stochastic-d');

      if (kSeries) {
        (kSeries as ISeriesApi<'Line'>).setData(toLineData(data, stochasticResult.k));
      }
      if (dSeries) {
        (dSeries as ISeriesApi<'Line'>).setData(toLineData(data, stochasticResult.d));
      }
    }

    // 차트를 최신 데이터(오른쪽 끝)로 스크롤
    mainChartRef.current?.timeScale().scrollToRealTime();

    // 서브 차트들은 메인 차트의 범위를 따르도록 동기화
    requestAnimationFrame(() => {
      if (mainChartRef.current) {
        const logicalRange = mainChartRef.current.timeScale().getVisibleLogicalRange();
        if (logicalRange) {
          rsiChartRef.current?.timeScale().setVisibleLogicalRange(logicalRange);
          macdChartRef.current?.timeScale().setVisibleLogicalRange(logicalRange);
          stochasticChartRef.current?.timeScale().setVisibleLogicalRange(logicalRange);
        }
      }
    });
  }, [data, indicators, signalMarkers, enabledIndicators, upColor, downColor, updateOverlayIndicator, cleanupDisabledOverlays]);

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
      {/* 타임프레임 선택 + 이동평균선 범례 */}
      <div className="mb-1 flex items-center justify-between flex-wrap gap-1">
        {/* 타임프레임 선택 */}
        {onTimeFrameChange && (
          <div className="flex gap-1">
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

        {/* 이동평균선 범례 */}
        {maLegendData.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {maLegendData.map((ma) => (
              <div key={`ma-${ma.period}`} className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-0.5 rounded"
                  style={{ backgroundColor: ma.color }}
                />
                <span style={{ color: ma.color }}>
                  {ma.period}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 메인 차트 */}
      <div className="relative">
        <div
          ref={mainContainerRef}
          style={{ width: '100%', height }}
          data-testid="main-chart"
        />

        {/* 신호 정보 툴팁 */}
        {hoveredSignals.length > 0 && tooltipPosition && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: Math.min(tooltipPosition.x + 12, (mainContainerRef.current?.clientWidth || 300) - 280),
              top: Math.max(tooltipPosition.y - 10, 10),
            }}
          >
            <div className="bg-gray-900/95 text-white text-xs rounded-lg shadow-lg p-3 min-w-[240px] max-w-[320px]">
              <div className="font-semibold mb-2 pb-2 border-b border-gray-700">
                📊 매매신호 ({hoveredSignals.length}건)
              </div>
              <div className="space-y-3">
                {hoveredSignals.map((signal, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: signal.color }}
                        />
                        <span className="font-medium">{signal.strategyName}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          signal.type === 'buy'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {signal.type === 'buy' ? '매수' : '매도'}
                      </span>
                    </div>
                    {signal.price && (
                      <div className="ml-4 text-gray-300">
                        가격: {signal.price.toLocaleString()}원
                      </div>
                    )}
                    {signal.reason && (
                      <div className="ml-4 text-gray-400 text-[11px] leading-relaxed">
                        조건: {signal.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Stochastic 서브차트 */}
      {hasStochastic && (
        <div className="mt-1">
          <div className="text-xs text-gray-500">Stochastic (%K, %D)</div>
          <div
            ref={stochasticContainerRef}
            style={{ width: '100%', height: subChartHeight }}
            data-testid="stochastic-chart"
          />
        </div>
      )}
    </div>
  );
}

export default StockChartWithIndicators;
