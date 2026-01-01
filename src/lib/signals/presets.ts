import type { TradingStrategy, PresetStrategyId } from './types';

/**
 * 프리셋 매매 전략
 */
export const PRESET_STRATEGIES: Record<PresetStrategyId, TradingStrategy> = {
  // 골든크로스 전략
  golden_cross: {
    id: 'golden_cross',
    name: '골든크로스',
    description: '단기 이평선이 장기 이평선을 상향돌파 시 매수, 하향돌파 시 매도',
    buyCondition: {
      type: 'crossover',
      indicator1: 'sma',
      indicator2: 'sma',
      direction: 'up',
      params1: { period: 20 },
      params2: { period: 60 },
    },
    sellCondition: {
      type: 'crossover',
      indicator1: 'sma',
      indicator2: 'sma',
      direction: 'down',
      params1: { period: 20 },
      params2: { period: 60 },
    },
  },

  // 데드크로스 전략 (역방향)
  death_cross: {
    id: 'death_cross',
    name: '데드크로스',
    description: '단기 이평선이 장기 이평선을 하향돌파 시 매도, 상향돌파 시 매수',
    buyCondition: {
      type: 'crossover',
      indicator1: 'sma',
      indicator2: 'sma',
      direction: 'up',
      params1: { period: 20 },
      params2: { period: 60 },
    },
    sellCondition: {
      type: 'crossover',
      indicator1: 'sma',
      indicator2: 'sma',
      direction: 'down',
      params1: { period: 20 },
      params2: { period: 60 },
    },
  },

  // RSI 과매도 전략
  rsi_oversold: {
    id: 'rsi_oversold',
    name: 'RSI 과매도',
    description: 'RSI가 30 이하일 때 매수, 70 이상일 때 매도',
    buyCondition: {
      type: 'single',
      indicator: 'rsi',
      operator: 'lte',
      value: 30,
      params: { period: 14 },
    },
    sellCondition: {
      type: 'single',
      indicator: 'rsi',
      operator: 'gte',
      value: 70,
      params: { period: 14 },
    },
  },

  // RSI 과매수 전략 (역방향)
  rsi_overbought: {
    id: 'rsi_overbought',
    name: 'RSI 과매수',
    description: 'RSI가 70 이상일 때 매도, 30 이하일 때 매수',
    buyCondition: {
      type: 'single',
      indicator: 'rsi',
      operator: 'lte',
      value: 30,
      params: { period: 14 },
    },
    sellCondition: {
      type: 'single',
      indicator: 'rsi',
      operator: 'gte',
      value: 70,
      params: { period: 14 },
    },
  },

  // MACD 크로스오버 전략
  macd_crossover: {
    id: 'macd_crossover',
    name: 'MACD 크로스오버',
    description: 'MACD가 시그널을 상향돌파 시 매수, 하향돌파 시 매도',
    buyCondition: {
      type: 'crossover',
      indicator1: 'macd',
      indicator2: 'macd_signal',
      direction: 'up',
      params1: { fast: 12, slow: 26, signal: 9 },
      params2: { fast: 12, slow: 26, signal: 9 },
    },
    sellCondition: {
      type: 'crossover',
      indicator1: 'macd',
      indicator2: 'macd_signal',
      direction: 'down',
      params1: { fast: 12, slow: 26, signal: 9 },
      params2: { fast: 12, slow: 26, signal: 9 },
    },
  },

  // 볼린저밴드 돌파 전략
  bollinger_breakout: {
    id: 'bollinger_breakout',
    name: '볼린저밴드 돌파',
    description: '가격이 하단밴드 이하일 때 매수, 상단밴드 이상일 때 매도',
    buyCondition: {
      type: 'single',
      indicator: 'price',
      operator: 'lte',
      value: 'bollinger_lower' as const,
      params: { period: 20, stdDev: 2 },
    },
    sellCondition: {
      type: 'single',
      indicator: 'price',
      operator: 'gte',
      value: 'bollinger_upper' as const,
      params: { period: 20, stdDev: 2 },
    },
  },
};

/**
 * 프리셋 전략 목록 가져오기
 */
export function getPresetStrategies(): TradingStrategy[] {
  return Object.values(PRESET_STRATEGIES);
}

/**
 * ID로 프리셋 전략 가져오기
 */
export function getPresetStrategy(id: PresetStrategyId): TradingStrategy | undefined {
  return PRESET_STRATEGIES[id];
}
