import { describe, it, expect } from 'vitest';
import type { OHLCV } from '@/types';
import {
  compare,
  detectCrossover,
  createIndicatorCache,
  getIndicatorValues,
} from './conditions';
import { evaluateCondition, generateSignals } from './engine';
import { PRESET_STRATEGIES, getPresetStrategies, getPresetStrategy } from './presets';
import type { SingleCondition, CrossoverCondition, LogicalCondition, TradingStrategy } from './types';

// 테스트용 데이터 생성
function generateTestData(count: number = 100): OHLCV[] {
  const data: OHLCV[] = [];
  let price = 100;

  for (let i = 0; i < count; i++) {
    // 사인파 패턴으로 데이터 생성 (추세 + 변동)
    const trend = i * 0.1;
    const wave = Math.sin(i * 0.1) * 10;
    price = 100 + trend + wave;

    const open = price;
    const change = (Math.random() - 0.5) * 5;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      time: Date.now() - (count - i) * 86400000,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return data;
}

describe('compare', () => {
  it('should handle greater than', () => {
    expect(compare(10, 'gt', 5)).toBe(true);
    expect(compare(5, 'gt', 10)).toBe(false);
    expect(compare(5, 'gt', 5)).toBe(false);
  });

  it('should handle greater than or equal', () => {
    expect(compare(10, 'gte', 5)).toBe(true);
    expect(compare(5, 'gte', 5)).toBe(true);
    expect(compare(4, 'gte', 5)).toBe(false);
  });

  it('should handle less than', () => {
    expect(compare(5, 'lt', 10)).toBe(true);
    expect(compare(10, 'lt', 5)).toBe(false);
    expect(compare(5, 'lt', 5)).toBe(false);
  });

  it('should handle less than or equal', () => {
    expect(compare(5, 'lte', 10)).toBe(true);
    expect(compare(5, 'lte', 5)).toBe(true);
    expect(compare(6, 'lte', 5)).toBe(false);
  });

  it('should handle equal', () => {
    expect(compare(5, 'eq', 5)).toBe(true);
    expect(compare(5, 'eq', 6)).toBe(false);
  });

  it('should return false for null values', () => {
    expect(compare(null, 'gt', 5)).toBe(false);
    expect(compare(5, 'gt', null)).toBe(false);
    expect(compare(null, 'gt', null)).toBe(false);
  });
});

describe('detectCrossover', () => {
  it('should detect upward crossover', () => {
    const values1 = [5, 10, 15, 12, 8];
    const values2 = [10, 10, 10, 10, 10];
    const result = detectCrossover(values1, values2, 'up');

    expect(result[0]).toBe(false);
    expect(result[1]).toBe(false); // 5->10 crosses 10, but from below to equal
    expect(result[2]).toBe(true); // 10->15 crosses above 10
    expect(result[3]).toBe(false);
    expect(result[4]).toBe(false);
  });

  it('should detect downward crossover', () => {
    const values1 = [15, 10, 5, 8, 12];
    const values2 = [10, 10, 10, 10, 10];
    const result = detectCrossover(values1, values2, 'down');

    expect(result[0]).toBe(false);
    expect(result[1]).toBe(false); // 15->10 equals, not crossing
    expect(result[2]).toBe(true); // 10->5 crosses below 10
    expect(result[3]).toBe(false);
    expect(result[4]).toBe(false);
  });

  it('should handle null values', () => {
    const values1 = [null, 10, 15];
    const values2 = [10, null, 10];
    const result = detectCrossover(values1, values2, 'up');

    expect(result[0]).toBe(false);
    expect(result[1]).toBe(false);
    expect(result[2]).toBe(false);
  });
});

describe('getIndicatorValues', () => {
  const data = generateTestData(50);
  const cache = createIndicatorCache();

  it('should return price values', () => {
    const values = getIndicatorValues(data, 'price', {}, cache);
    expect(values.length).toBe(data.length);
    expect(values[0]).toBe(data[0].close);
  });

  it('should return volume values', () => {
    const values = getIndicatorValues(data, 'volume', {}, cache);
    expect(values.length).toBe(data.length);
    expect(values[0]).toBe(data[0].volume);
  });

  it('should calculate and cache SMA', () => {
    const values1 = getIndicatorValues(data, 'sma', { period: 10 }, cache);
    const values2 = getIndicatorValues(data, 'sma', { period: 10 }, cache);

    expect(values1).toBe(values2); // Same reference (cached)
    expect(values1.length).toBe(data.length);
  });

  it('should calculate RSI', () => {
    const values = getIndicatorValues(data, 'rsi', { period: 14 }, cache);
    expect(values.length).toBe(data.length);

    // RSI values should be between 0 and 100
    values.forEach((v) => {
      if (v !== null) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    });
  });

  it('should calculate MACD components', () => {
    const macdValues = getIndicatorValues(data, 'macd', {}, cache);
    const signalValues = getIndicatorValues(data, 'macd_signal', {}, cache);
    const histogramValues = getIndicatorValues(data, 'macd_histogram', {}, cache);

    expect(macdValues.length).toBe(data.length);
    expect(signalValues.length).toBe(data.length);
    expect(histogramValues.length).toBe(data.length);
  });
});

describe('evaluateCondition', () => {
  const data = generateTestData(50);
  const cache = createIndicatorCache();

  it('should evaluate single condition', () => {
    const condition: SingleCondition = {
      type: 'single',
      indicator: 'rsi',
      operator: 'lte',
      value: 100, // RSI is always <= 100
      params: { period: 14 },
    };

    // RSI 값이 있는 인덱스에서 테스트
    const result = evaluateCondition(condition, data, 40, cache);
    expect(typeof result).toBe('boolean');
  });

  it('should evaluate crossover condition', () => {
    const condition: CrossoverCondition = {
      type: 'crossover',
      indicator1: 'sma',
      indicator2: 'sma',
      direction: 'up',
      params1: { period: 5 },
      params2: { period: 20 },
    };

    // 첫 번째 인덱스에서는 항상 false
    const result = evaluateCondition(condition, data, 0, cache);
    expect(result).toBe(false);
  });

  it('should evaluate AND condition', () => {
    const condition: LogicalCondition = {
      type: 'and',
      conditions: [
        { type: 'single', indicator: 'rsi', operator: 'gte', value: 0, params: { period: 14 } },
        { type: 'single', indicator: 'rsi', operator: 'lte', value: 100, params: { period: 14 } },
      ],
    };

    const result = evaluateCondition(condition, data, 40, cache);
    expect(result).toBe(true); // RSI is always between 0 and 100
  });

  it('should evaluate OR condition', () => {
    const condition: LogicalCondition = {
      type: 'or',
      conditions: [
        { type: 'single', indicator: 'rsi', operator: 'lt', value: 0, params: { period: 14 } }, // false
        { type: 'single', indicator: 'rsi', operator: 'lte', value: 100, params: { period: 14 } }, // true
      ],
    };

    const result = evaluateCondition(condition, data, 40, cache);
    expect(result).toBe(true);
  });
});

describe('generateSignals', () => {
  const data = generateTestData(100);

  it('should generate signals for RSI strategy', () => {
    const strategy: TradingStrategy = {
      id: 'test',
      name: 'Test RSI',
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
    };

    const result = generateSignals(strategy, data);

    expect(result).toHaveProperty('signals');
    expect(result).toHaveProperty('buyCount');
    expect(result).toHaveProperty('sellCount');
    expect(Array.isArray(result.signals)).toBe(true);
  });

  it('should include signal details', () => {
    const strategy: TradingStrategy = {
      id: 'test',
      name: 'Test',
      buyCondition: {
        type: 'single',
        indicator: 'rsi',
        operator: 'lte',
        value: 50, // 더 자주 발생하도록
        params: { period: 14 },
      },
      sellCondition: {
        type: 'single',
        indicator: 'rsi',
        operator: 'gte',
        value: 50,
        params: { period: 14 },
      },
    };

    const result = generateSignals(strategy, data);

    if (result.signals.length > 0) {
      const signal = result.signals[0];
      expect(signal).toHaveProperty('type');
      expect(signal).toHaveProperty('time');
      expect(signal).toHaveProperty('price');
      expect(signal).toHaveProperty('reason');
      expect(['buy', 'sell']).toContain(signal.type);
    }
  });
});

describe('Preset Strategies', () => {
  it('should have all preset strategies', () => {
    expect(PRESET_STRATEGIES).toHaveProperty('golden_cross');
    expect(PRESET_STRATEGIES).toHaveProperty('death_cross');
    expect(PRESET_STRATEGIES).toHaveProperty('rsi_oversold');
    expect(PRESET_STRATEGIES).toHaveProperty('rsi_overbought');
    expect(PRESET_STRATEGIES).toHaveProperty('macd_crossover');
    expect(PRESET_STRATEGIES).toHaveProperty('bollinger_breakout');
  });

  it('should return all strategies with getPresetStrategies', () => {
    const strategies = getPresetStrategies();
    expect(strategies.length).toBe(3);
    expect(strategies.every((s) => s.id && s.name)).toBe(true);
  });

  it('should get specific strategy by id', () => {
    const strategy = getPresetStrategy('triple_screen');
    expect(strategy).toBeDefined();
    expect(strategy?.name).toBe('트리플 스크린');
  });

  it('should work with generateSignals', () => {
    const data = generateTestData(100);
    const strategy = PRESET_STRATEGIES.triple_screen;
    const result = generateSignals(strategy, data);

    expect(result).toHaveProperty('signals');
    expect(result).toHaveProperty('buyCount');
    expect(result).toHaveProperty('sellCount');
  });
});
