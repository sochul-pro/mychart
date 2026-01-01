import { describe, it, expect } from 'vitest';
import { DEFAULT_INDICATOR_PARAMS } from './indicator';
import type { IndicatorType } from './signal';

describe('Indicator Types', () => {
  it('should have default params for all indicator types', () => {
    const indicatorTypes: IndicatorType[] = [
      'SMA',
      'EMA',
      'RSI',
      'MACD',
      'STOCHASTIC',
      'BOLLINGER',
      'ATR',
      'OBV',
      'VOLUME_MA',
    ];

    indicatorTypes.forEach((type) => {
      expect(DEFAULT_INDICATOR_PARAMS[type]).toBeDefined();
    });
  });

  it('should have correct default RSI period', () => {
    expect(DEFAULT_INDICATOR_PARAMS.RSI.period).toBe(14);
  });

  it('should have correct default MACD params', () => {
    expect(DEFAULT_INDICATOR_PARAMS.MACD).toEqual({
      fast: 12,
      slow: 26,
      signal: 9,
    });
  });

  it('should have correct default Bollinger params', () => {
    expect(DEFAULT_INDICATOR_PARAMS.BOLLINGER).toEqual({
      period: 20,
      stdDev: 2,
    });
  });
});
