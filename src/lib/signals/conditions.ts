import type { OHLCV } from '@/types';
import type {
  SignalIndicator,
  ComparisonOperator,
  IndicatorCache,
} from './types';
import { sma, ema, rsi, macd, stochastic, bollingerBands } from '@/lib/indicators';

/**
 * 지표 캐시 초기화
 */
export function createIndicatorCache(): IndicatorCache {
  return {
    sma: new Map(),
    ema: new Map(),
    rsi: new Map(),
    macd: new Map(),
    stochastic: new Map(),
    bollinger: new Map(),
  };
}

/**
 * 지표 값 계산 (캐시 활용)
 */
export function getIndicatorValues(
  data: OHLCV[],
  indicator: SignalIndicator,
  params: Record<string, number> = {},
  cache: IndicatorCache
): (number | null)[] {
  const defaultParams = getDefaultParams(indicator);
  const mergedParams = { ...defaultParams, ...params };

  switch (indicator) {
    case 'price':
      return data.map((d) => d.close);

    case 'volume':
      return data.map((d) => d.volume);

    case 'sma': {
      const period = mergedParams.period || 20;
      if (!cache.sma.has(period)) {
        cache.sma.set(period, sma(data, period));
      }
      return cache.sma.get(period)!;
    }

    case 'ema': {
      const period = mergedParams.period || 20;
      if (!cache.ema.has(period)) {
        cache.ema.set(period, ema(data, period));
      }
      return cache.ema.get(period)!;
    }

    case 'rsi': {
      const period = mergedParams.period || 14;
      if (!cache.rsi.has(period)) {
        cache.rsi.set(period, rsi(data, period));
      }
      return cache.rsi.get(period)!;
    }

    case 'macd':
    case 'macd_signal':
    case 'macd_histogram': {
      const fast = mergedParams.fast || 12;
      const slow = mergedParams.slow || 26;
      const signal = mergedParams.signal || 9;
      const key = `${fast}-${slow}-${signal}`;

      if (!cache.macd.has(key)) {
        cache.macd.set(key, macd(data, fast, slow, signal));
      }

      const result = cache.macd.get(key)!;
      if (indicator === 'macd') return result.macd;
      if (indicator === 'macd_signal') return result.signal;
      return result.histogram;
    }

    case 'stochastic_k':
    case 'stochastic_d': {
      const kPeriod = mergedParams.kPeriod || 14;
      const dPeriod = mergedParams.dPeriod || 3;
      const key = `${kPeriod}-${dPeriod}`;

      if (!cache.stochastic.has(key)) {
        cache.stochastic.set(key, stochastic(data, kPeriod, dPeriod));
      }

      const result = cache.stochastic.get(key)!;
      return indicator === 'stochastic_k' ? result.k : result.d;
    }

    case 'bollinger_upper':
    case 'bollinger_middle':
    case 'bollinger_lower': {
      const period = mergedParams.period || 20;
      const stdDev = mergedParams.stdDev || 2;
      const key = `${period}-${stdDev}`;

      if (!cache.bollinger.has(key)) {
        cache.bollinger.set(key, bollingerBands(data, period, stdDev));
      }

      const result = cache.bollinger.get(key)!;
      if (indicator === 'bollinger_upper') return result.upper;
      if (indicator === 'bollinger_middle') return result.middle;
      return result.lower;
    }

    default:
      return new Array(data.length).fill(null);
  }
}

/**
 * 지표별 기본 파라미터
 */
function getDefaultParams(indicator: SignalIndicator): Record<string, number> {
  switch (indicator) {
    case 'sma':
    case 'ema':
      return { period: 20 };
    case 'rsi':
      return { period: 14 };
    case 'macd':
    case 'macd_signal':
    case 'macd_histogram':
      return { fast: 12, slow: 26, signal: 9 };
    case 'stochastic_k':
    case 'stochastic_d':
      return { kPeriod: 14, dPeriod: 3 };
    case 'bollinger_upper':
    case 'bollinger_middle':
    case 'bollinger_lower':
      return { period: 20, stdDev: 2 };
    default:
      return {};
  }
}

/**
 * 비교 연산 수행
 */
export function compare(
  value1: number | null,
  operator: ComparisonOperator,
  value2: number | null
): boolean {
  if (value1 === null || value2 === null) return false;

  switch (operator) {
    case 'gt':
      return value1 > value2;
    case 'gte':
      return value1 >= value2;
    case 'lt':
      return value1 < value2;
    case 'lte':
      return value1 <= value2;
    case 'eq':
      return value1 === value2;
    default:
      return false;
  }
}

/**
 * 크로스오버 감지
 * @param values1 첫 번째 지표 값 배열
 * @param values2 두 번째 지표 값 배열
 * @param direction 크로스 방향 ('up': 상향돌파, 'down': 하향돌파)
 * @returns 각 인덱스에서 크로스오버 발생 여부
 */
export function detectCrossover(
  values1: (number | null)[],
  values2: (number | null)[],
  direction: 'up' | 'down'
): boolean[] {
  const result: boolean[] = new Array(values1.length).fill(false);

  for (let i = 1; i < values1.length; i++) {
    const prev1 = values1[i - 1];
    const prev2 = values2[i - 1];
    const curr1 = values1[i];
    const curr2 = values2[i];

    if (prev1 === null || prev2 === null || curr1 === null || curr2 === null) {
      continue;
    }

    if (direction === 'up') {
      // 상향돌파: 이전에 아래에 있다가 현재 위로 올라감
      result[i] = prev1 <= prev2 && curr1 > curr2;
    } else {
      // 하향돌파: 이전에 위에 있다가 현재 아래로 내려감
      result[i] = prev1 >= prev2 && curr1 < curr2;
    }
  }

  return result;
}
