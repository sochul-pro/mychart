'use client';

import { useEffect, useRef } from 'react';
import type { IChartApi, ISeriesApi, SeriesMarker, Time } from 'lightweight-charts';
import type { Signal } from '@/lib/signals/types';

export interface SignalMarkersProps {
  /** 차트 API 참조 */
  chart: IChartApi | null;
  /** 캔들스틱 시리즈 참조 */
  series: ISeriesApi<'Candlestick'> | null;
  /** 신호 목록 */
  signals: Signal[];
}

/**
 * 차트에 매수/매도 신호 마커 표시
 *
 * 이 컴포넌트는 직접 렌더링하지 않고 차트에 마커를 추가합니다.
 */
export function SignalMarkers({ chart, series, signals }: SignalMarkersProps) {
  const prevSignalsRef = useRef<Signal[]>([]);

  useEffect(() => {
    if (!chart || !series) return;

    // 신호가 변경되지 않았으면 업데이트 안 함
    if (
      prevSignalsRef.current.length === signals.length &&
      prevSignalsRef.current.every((s, i) => s.time === signals[i]?.time)
    ) {
      return;
    }

    prevSignalsRef.current = signals;

    // 마커 생성
    const markers: SeriesMarker<Time>[] = signals.map((signal) => ({
      time: (signal.time / 1000) as Time,
      position: signal.type === 'buy' ? 'belowBar' : 'aboveBar',
      color: signal.type === 'buy' ? '#26a69a' : '#ef5350',
      shape: signal.type === 'buy' ? 'arrowUp' : 'arrowDown',
      text: signal.type === 'buy' ? 'B' : 'S',
    }));

    // 시리즈에 마커 설정
    series.setMarkers(markers);

    return () => {
      // 컴포넌트 언마운트 시 마커 제거
      if (series) {
        series.setMarkers([]);
      }
    };
  }, [chart, series, signals]);

  // 이 컴포넌트는 아무것도 렌더링하지 않음
  return null;
}

/**
 * 신호를 마커 형식으로 변환
 */
export function signalsToMarkers(signals: Signal[]): SeriesMarker<Time>[] {
  return signals.map((signal) => ({
    time: (signal.time / 1000) as Time,
    position: signal.type === 'buy' ? 'belowBar' : 'aboveBar',
    color: signal.type === 'buy' ? '#26a69a' : '#ef5350',
    shape: signal.type === 'buy' ? 'arrowUp' : 'arrowDown',
    text: signal.type === 'buy' ? 'B' : 'S',
  }));
}

export default SignalMarkers;
