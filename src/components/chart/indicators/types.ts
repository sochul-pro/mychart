/** 지표 유형 */
export type IndicatorType =
  | 'sma'
  | 'ema'
  | 'bollinger'
  | 'rsi'
  | 'macd'
  | 'stochastic'
  | 'obv'
  | 'atr';

/** 지표 설정 기본 인터페이스 */
export interface BaseIndicatorConfig {
  type: IndicatorType;
  enabled: boolean;
  color?: string;
}

/** 이동평균 설정 */
export interface MAConfig extends BaseIndicatorConfig {
  type: 'sma' | 'ema';
  period: number;
}

/** 볼린저밴드 설정 */
export interface BollingerConfig extends BaseIndicatorConfig {
  type: 'bollinger';
  period: number;
  stdDev: number;
}

/** RSI 설정 */
export interface RSIConfig extends BaseIndicatorConfig {
  type: 'rsi';
  period: number;
  overbought: number;
  oversold: number;
}

/** MACD 설정 */
export interface MACDConfig extends BaseIndicatorConfig {
  type: 'macd';
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

/** 스토캐스틱 설정 */
export interface StochasticConfig extends BaseIndicatorConfig {
  type: 'stochastic';
  kPeriod: number;
  dPeriod: number;
  overbought: number;
  oversold: number;
}

/** OBV 설정 */
export interface OBVConfig extends BaseIndicatorConfig {
  type: 'obv';
}

/** ATR 설정 */
export interface ATRConfig extends BaseIndicatorConfig {
  type: 'atr';
  period: number;
}

/** 지표 설정 유니온 타입 */
export type IndicatorConfig =
  | MAConfig
  | BollingerConfig
  | RSIConfig
  | MACDConfig
  | StochasticConfig
  | OBVConfig
  | ATRConfig;

/** 기본 지표 설정값 */
export const DEFAULT_INDICATOR_CONFIGS: Record<IndicatorType, IndicatorConfig> = {
  sma: { type: 'sma', enabled: false, period: 20, color: '#2196F3' },
  ema: { type: 'ema', enabled: false, period: 20, color: '#FF9800' },
  bollinger: { type: 'bollinger', enabled: false, period: 20, stdDev: 2, color: '#9C27B0' },
  rsi: { type: 'rsi', enabled: false, period: 14, overbought: 70, oversold: 30, color: '#E91E63' },
  macd: {
    type: 'macd',
    enabled: false,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    color: '#00BCD4',
  },
  stochastic: {
    type: 'stochastic',
    enabled: false,
    kPeriod: 14,
    dPeriod: 3,
    overbought: 80,
    oversold: 20,
    color: '#4CAF50',
  },
  obv: { type: 'obv', enabled: false, color: '#795548' },
  atr: { type: 'atr', enabled: false, period: 14, color: '#607D8B' },
};

/** 지표가 메인 차트에 오버레이 되는지 여부 */
export function isOverlayIndicator(type: IndicatorType): boolean {
  return ['sma', 'ema', 'bollinger'].includes(type);
}

/** 지표가 서브차트에 표시되는지 여부 */
export function isSubChartIndicator(type: IndicatorType): boolean {
  return ['rsi', 'macd', 'stochastic', 'obv', 'atr'].includes(type);
}
