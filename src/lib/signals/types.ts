/** 비교 연산자 */
export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

/** 지표 타입 */
export type SignalIndicator =
  | 'price'
  | 'volume'
  | 'sma'
  | 'ema'
  | 'rsi'
  | 'macd'
  | 'macd_signal'
  | 'macd_histogram'
  | 'stochastic_k'
  | 'stochastic_d'
  | 'bollinger_upper'
  | 'bollinger_middle'
  | 'bollinger_lower';

/** 단일 조건 */
export interface SingleCondition {
  type: 'single';
  indicator: SignalIndicator;
  operator: ComparisonOperator;
  value: number | SignalIndicator; // 고정값 또는 다른 지표와 비교
  params?: Record<string, number>; // 지표 파라미터 (예: period)
}

/** 크로스오버 조건 */
export interface CrossoverCondition {
  type: 'crossover';
  indicator1: SignalIndicator;
  indicator2: SignalIndicator;
  direction: 'up' | 'down'; // up: indicator1이 indicator2를 상향돌파, down: 하향돌파
  params1?: Record<string, number>;
  params2?: Record<string, number>;
}

/** 논리 연산자 조건 (AND/OR) */
export interface LogicalCondition {
  type: 'and' | 'or';
  conditions: Condition[];
}

/** 조건 유니온 타입 */
export type Condition = SingleCondition | CrossoverCondition | LogicalCondition;

/** 매매 신호 */
export interface Signal {
  type: 'buy' | 'sell';
  time: number;
  price: number;
  reason: string;
}

/** 매매 전략 */
export interface TradingStrategy {
  id: string;
  name: string;
  description?: string;
  buyCondition: Condition;
  sellCondition: Condition;
}

/** 지표 계산 결과 캐시 */
export interface IndicatorCache {
  sma: Map<number, (number | null)[]>; // key: period
  ema: Map<number, (number | null)[]>;
  rsi: Map<number, (number | null)[]>;
  macd: Map<string, { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] }>;
  stochastic: Map<string, { k: (number | null)[]; d: (number | null)[] }>;
  bollinger: Map<string, { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] }>;
}

/** 프리셋 전략 ID */
export type PresetStrategyId =
  | 'golden_cross'
  | 'death_cross'
  | 'rsi_oversold'
  | 'rsi_overbought'
  | 'macd_crossover'
  | 'bollinger_breakout';

/** 신호 생성 결과 */
export interface SignalResult {
  signals: Signal[];
  buyCount: number;
  sellCount: number;
}
