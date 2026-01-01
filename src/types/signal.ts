// 지표 타입
export type IndicatorType =
  | 'SMA'
  | 'EMA'
  | 'RSI'
  | 'MACD'
  | 'STOCHASTIC'
  | 'BOLLINGER'
  | 'ATR'
  | 'OBV'
  | 'VOLUME_MA';

// 비교 연산자
export type ComparisonOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'cross_above' | 'cross_below';

// 특수 값 타입
export type SpecialValue = 'upper_band' | 'lower_band' | 'signal_line' | 'zero';

// 신호 규칙
export interface SignalRule {
  id: string;
  indicator: IndicatorType;
  params: Record<string, number>;
  operator: ComparisonOperator;
  value: number | SpecialValue;
}

// 규칙 그룹 (AND/OR 논리)
export interface RuleGroup {
  rules: SignalRule[];
  logic: 'AND' | 'OR';
}

// 신호 프리셋 구조
export interface SignalPresetData {
  id: string;
  name: string;
  buyRules: RuleGroup;
  sellRules: RuleGroup;
}

// 신호 결과
export interface Signal {
  time: number; // Unix timestamp
  type: 'BUY' | 'SELL';
  price: number;
  ruleId: string;
}
