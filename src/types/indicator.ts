import type { IndicatorType } from './signal';

// 지표 설정
export interface IndicatorConfig {
  type: IndicatorType;
  params: Record<string, number>;
  visible: boolean;
  color?: string;
}

// 지표 계산 결과 (단일 값)
export interface SingleIndicatorResult {
  time: number;
  value: number;
}

// MACD 결과
export interface MACDResult {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

// 볼린저밴드 결과
export interface BollingerResult {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

// 스토캐스틱 결과
export interface StochasticResult {
  time: number;
  k: number;
  d: number;
}

// 지표 결과 유니온 타입
export type IndicatorResult =
  | SingleIndicatorResult
  | MACDResult
  | BollingerResult
  | StochasticResult;

// 지표 파라미터 기본값
export const DEFAULT_INDICATOR_PARAMS: Record<IndicatorType, Record<string, number>> = {
  SMA: { period: 20 },
  EMA: { period: 20 },
  RSI: { period: 14 },
  MACD: { fast: 12, slow: 26, signal: 9 },
  STOCHASTIC: { k: 14, d: 3, smooth: 3 },
  BOLLINGER: { period: 20, stdDev: 2 },
  ATR: { period: 14 },
  OBV: {},
  VOLUME_MA: { period: 20 },
};
