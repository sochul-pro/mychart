import type { TradingStrategy, PresetStrategyId } from './types';

/**
 * 프리셋 매매 전략 (추세 추종 전략 3종)
 */
export const PRESET_STRATEGIES: Record<PresetStrategyId, TradingStrategy> = {
  // 전략 1: 트리플 스크린
  // Alexander Elder의 트리플 스크린 전략 기반
  // 장기 추세 확인 + 중기 모멘텀 + 단기 진입
  triple_screen: {
    id: 'triple_screen',
    name: '트리플 스크린',
    description: '장기 추세 + 중기 모멘텀 + 단기 진입 조건으로 안정적인 추세 추종',
    buyCondition: {
      type: 'and',
      conditions: [
        // SMA(20) > SMA(60) - 장기 상승추세
        {
          type: 'single',
          indicator: 'sma',
          operator: 'gt',
          value: 'sma',
          params: { period: 20 },
        },
        // MACD > 0 - 모멘텀 확인
        {
          type: 'single',
          indicator: 'macd',
          operator: 'gt',
          value: 0,
        },
        // RSI > 30 - 과매도 회복
        {
          type: 'single',
          indicator: 'rsi',
          operator: 'gt',
          value: 30,
          params: { period: 14 },
        },
        // RSI < 50 - 아직 과열 아님
        {
          type: 'single',
          indicator: 'rsi',
          operator: 'lt',
          value: 50,
          params: { period: 14 },
        },
      ],
    },
    sellCondition: {
      type: 'or',
      conditions: [
        // 데드크로스 - SMA(20) cross_below SMA(60)
        {
          type: 'crossover',
          indicator1: 'sma',
          indicator2: 'sma',
          direction: 'down',
          params1: { period: 20 },
          params2: { period: 60 },
        },
        // RSI > 70 - 과매수
        {
          type: 'single',
          indicator: 'rsi',
          operator: 'gt',
          value: 70,
          params: { period: 14 },
        },
      ],
    },
  },

  // 전략 2: 추세 모멘텀
  // 이동평균 정배열 + 거래량 확인으로 강한 추세 진입
  trend_momentum: {
    id: 'trend_momentum',
    name: '추세 모멘텀',
    description: '이동평균 정배열과 거래량 증가로 강한 상승 추세 포착',
    buyCondition: {
      type: 'and',
      conditions: [
        // Price > SMA(20) - 가격이 20일선 위
        {
          type: 'single',
          indicator: 'price',
          operator: 'gt',
          value: 'sma',
          params: { period: 20 },
        },
        // SMA(20) > SMA(60) - 정배열
        {
          type: 'single',
          indicator: 'sma',
          operator: 'gt',
          value: 'sma',
          params: { period: 20 },
        },
        // Volume > Volume_MA(20) - 거래량 증가
        {
          type: 'single',
          indicator: 'volume',
          operator: 'gt',
          value: 'volume_ma',
          params: { period: 20 },
        },
      ],
    },
    sellCondition: {
      type: 'or',
      conditions: [
        // Price < SMA(20) - 가격이 20일선 아래로
        {
          type: 'single',
          indicator: 'price',
          operator: 'lt',
          value: 'sma',
          params: { period: 20 },
        },
        // 데드크로스 - SMA(20) cross_below SMA(60)
        {
          type: 'crossover',
          indicator1: 'sma',
          indicator2: 'sma',
          direction: 'down',
          params1: { period: 20 },
          params2: { period: 60 },
        },
      ],
    },
  },

  // 전략 3: 볼린저 추세
  // 볼린저밴드 중심선 돌파 + MACD 모멘텀 확인
  bollinger_trend: {
    id: 'bollinger_trend',
    name: '볼린저 추세',
    description: '볼린저밴드 중심선 돌파와 MACD 모멘텀으로 추세 진입',
    buyCondition: {
      type: 'and',
      conditions: [
        // Price cross_above BB_Middle - 중심선 상향돌파
        {
          type: 'crossover',
          indicator1: 'price',
          indicator2: 'bollinger_middle',
          direction: 'up',
          params2: { period: 20 },
        },
        // MACD cross_above MACD_Signal - MACD 골든크로스
        {
          type: 'crossover',
          indicator1: 'macd',
          indicator2: 'macd_signal',
          direction: 'up',
        },
      ],
    },
    sellCondition: {
      type: 'or',
      conditions: [
        // Price cross_below BB_Middle - 중심선 하향돌파
        {
          type: 'crossover',
          indicator1: 'price',
          indicator2: 'bollinger_middle',
          direction: 'down',
          params2: { period: 20 },
        },
        // 상단밴드 도달 + 과매수 (복합 조건)
        {
          type: 'and',
          conditions: [
            {
              type: 'single',
              indicator: 'price',
              operator: 'gt',
              value: 'bollinger_upper',
              params: { period: 20, stdDev: 2 },
            },
            {
              type: 'single',
              indicator: 'rsi',
              operator: 'gt',
              value: 70,
              params: { period: 14 },
            },
          ],
        },
      ],
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
