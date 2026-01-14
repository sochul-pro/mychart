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
          valueParams: { period: 60 },
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
          valueParams: { period: 20 },
        },
        // SMA(20) > SMA(60) - 정배열
        {
          type: 'single',
          indicator: 'sma',
          operator: 'gt',
          value: 'sma',
          params: { period: 20 },
          valueParams: { period: 60 },
        },
        // Volume > Volume_MA(20) - 거래량 증가
        {
          type: 'single',
          indicator: 'volume',
          operator: 'gt',
          value: 'volume_ma',
          valueParams: { period: 20 },
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
          valueParams: { period: 20 },
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
              valueParams: { period: 20, stdDev: 2 },
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

  // 전략 4: 이동평균선 눌림목
  // 정배열 상승 추세에서 5일선까지 조정 후 반등
  ma_pullback: {
    id: 'ma_pullback',
    name: '이동평균선 눌림목',
    description: '정배열 상승 추세에서 5일선 눌림 후 반등 시 매수',
    buyCondition: {
      type: 'and',
      conditions: [
        // SMA(20) > SMA(60) - 중장기 상승추세
        {
          type: 'single',
          indicator: 'sma',
          operator: 'gt',
          value: 'sma',
          params: { period: 20 },
          valueParams: { period: 60 },
        },
        // Price > SMA(20) - 20일선 위에서 거래
        {
          type: 'single',
          indicator: 'price',
          operator: 'gt',
          value: 'sma',
          valueParams: { period: 20 },
        },
        // Price cross_above SMA(5) - 5일선 눌림 후 상향돌파
        {
          type: 'crossover',
          indicator1: 'price',
          indicator2: 'sma',
          direction: 'up',
          params2: { period: 5 },
        },
      ],
    },
    sellCondition: {
      type: 'or',
      conditions: [
        // Price cross_below SMA(20) - 20일선 하향돌파
        {
          type: 'crossover',
          indicator1: 'price',
          indicator2: 'sma',
          direction: 'down',
          params2: { period: 20 },
        },
        // RSI > 75 - 과매수
        {
          type: 'single',
          indicator: 'rsi',
          operator: 'gt',
          value: 75,
          params: { period: 14 },
        },
      ],
    },
  },

  // 전략 5: 볼린저밴드 눌림목
  // 상승 추세에서 볼린저 중심선 근처까지 조정 후 반등
  bollinger_pullback: {
    id: 'bollinger_pullback',
    name: '볼린저밴드 눌림목',
    description: '상승 추세에서 볼린저밴드 중심선 근처 눌림 후 반등 시 매수',
    buyCondition: {
      type: 'and',
      conditions: [
        // SMA(20) > SMA(60) - 상승추세 확인
        {
          type: 'single',
          indicator: 'sma',
          operator: 'gt',
          value: 'sma',
          params: { period: 20 },
          valueParams: { period: 60 },
        },
        // Price > BB_Lower - 하단밴드 아래로 추락하지 않음
        {
          type: 'single',
          indicator: 'price',
          operator: 'gt',
          value: 'bollinger_lower',
          valueParams: { period: 20, stdDev: 2 },
        },
        // Price <= BB_Middle - 중심선 근처까지 눌림
        {
          type: 'single',
          indicator: 'price',
          operator: 'lte',
          value: 'bollinger_middle',
          valueParams: { period: 20 },
        },
        // RSI > 40 - 과매도 아님
        {
          type: 'single',
          indicator: 'rsi',
          operator: 'gt',
          value: 40,
          params: { period: 14 },
        },
        // RSI < 60 - 과매수 아님 (중립 구간)
        {
          type: 'single',
          indicator: 'rsi',
          operator: 'lt',
          value: 60,
          params: { period: 14 },
        },
      ],
    },
    sellCondition: {
      type: 'or',
      conditions: [
        // Price >= BB_Upper - 상단밴드 도달
        {
          type: 'single',
          indicator: 'price',
          operator: 'gte',
          value: 'bollinger_upper',
          valueParams: { period: 20, stdDev: 2 },
        },
        // Price cross_below SMA(60) - 60일선 하향돌파
        {
          type: 'crossover',
          indicator1: 'price',
          indicator2: 'sma',
          direction: 'down',
          params2: { period: 60 },
        },
      ],
    },
  },

  // 전략 6: MACD 눌림목
  // MACD 양수 영역에서 히스토그램 축소 후 다시 확대
  macd_pullback: {
    id: 'macd_pullback',
    name: 'MACD 눌림목',
    description: 'MACD 양수 영역에서 모멘텀 회복 + 거래량 동반 시 매수',
    buyCondition: {
      type: 'and',
      conditions: [
        // MACD > 0 - 상승 모멘텀 유지
        {
          type: 'single',
          indicator: 'macd',
          operator: 'gt',
          value: 0,
        },
        // MACD > MACD_Signal - 히스토그램 양수 (모멘텀 회복)
        {
          type: 'single',
          indicator: 'macd',
          operator: 'gt',
          value: 'macd_signal',
        },
        // Price > SMA(20) - 단기 추세 상승
        {
          type: 'single',
          indicator: 'price',
          operator: 'gt',
          value: 'sma',
          valueParams: { period: 20 },
        },
        // Volume > Volume_MA(20) - 거래량 동반
        {
          type: 'single',
          indicator: 'volume',
          operator: 'gt',
          value: 'volume_ma',
          valueParams: { period: 20 },
        },
      ],
    },
    sellCondition: {
      type: 'or',
      conditions: [
        // MACD cross_below MACD_Signal - MACD 데드크로스
        {
          type: 'crossover',
          indicator1: 'macd',
          indicator2: 'macd_signal',
          direction: 'down',
        },
        // MACD < 0 - 하락 모멘텀 전환
        {
          type: 'single',
          indicator: 'macd',
          operator: 'lt',
          value: 0,
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
