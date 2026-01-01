import { describe, it, expect } from 'vitest';
import { sma, ema } from './moving-average';
import { rsi } from './rsi';
import { macd } from './macd';
import { bollingerBands } from './bollinger';
import { stochastic } from './stochastic';
import { obv } from './obv';
import { atr } from './atr';
import type { OHLCV } from '@/types';

// 테스트용 샘플 데이터 생성
function generateTestData(count: number, basePrice: number = 100): OHLCV[] {
  const data: OHLCV[] = [];
  let price = basePrice;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 10;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      time: Date.now() - (count - i) * 86400000,
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
  }

  return data;
}

describe('Moving Averages', () => {
  const data = generateTestData(30);

  describe('SMA', () => {
    it('should return correct length', () => {
      const result = sma(data, 5);
      expect(result.length).toBe(data.length);
    });

    it('should return null for first period-1 values', () => {
      const period = 5;
      const result = sma(data, period);

      for (let i = 0; i < period - 1; i++) {
        expect(result[i]).toBeNull();
      }
      expect(result[period - 1]).not.toBeNull();
    });

    it('should calculate correct SMA', () => {
      const simpleData: OHLCV[] = [
        { time: 1, open: 10, high: 11, low: 9, close: 10, volume: 100 },
        { time: 2, open: 10, high: 12, low: 9, close: 12, volume: 100 },
        { time: 3, open: 12, high: 14, low: 11, close: 14, volume: 100 },
        { time: 4, open: 14, high: 15, low: 13, close: 13, volume: 100 },
        { time: 5, open: 13, high: 14, low: 12, close: 11, volume: 100 },
      ];

      const result = sma(simpleData, 3);
      expect(result[2]).toBe((10 + 12 + 14) / 3);
      expect(result[3]).toBe((12 + 14 + 13) / 3);
      expect(result[4]).toBe((14 + 13 + 11) / 3);
    });

    it('should handle empty data', () => {
      expect(sma([], 5)).toEqual([]);
    });
  });

  describe('EMA', () => {
    it('should return correct length', () => {
      const result = ema(data, 5);
      expect(result.length).toBe(data.length);
    });

    it('should return null for first period-1 values', () => {
      const period = 5;
      const result = ema(data, period);

      for (let i = 0; i < period - 1; i++) {
        expect(result[i]).toBeNull();
      }
      expect(result[period - 1]).not.toBeNull();
    });

    it('should start with SMA value', () => {
      const period = 5;
      const smaResult = sma(data, period);
      const emaResult = ema(data, period);

      expect(emaResult[period - 1]).toBe(smaResult[period - 1]);
    });
  });
});

describe('RSI', () => {
  it('should return values between 0 and 100', () => {
    const data = generateTestData(50);
    const result = rsi(data, 14);

    result.forEach((value) => {
      if (value !== null) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });
  });

  it('should return null for first period values', () => {
    const data = generateTestData(30);
    const period = 14;
    const result = rsi(data, period);

    // RSI는 첫 번째 값 + (period-1)개의 변화가 필요하므로
    // result[0]~result[period-1]까지가 null
    for (let i = 0; i < period; i++) {
      expect(result[i]).toBeNull();
    }
    // result[period]부터 유효한 값
    expect(result[period]).not.toBeNull();
  });

  it('should handle constant prices', () => {
    const constantData: OHLCV[] = Array.from({ length: 20 }, (_, i) => ({
      time: i,
      open: 100,
      high: 100,
      low: 100,
      close: 100,
      volume: 1000,
    }));

    const result = rsi(constantData, 14);
    // 가격 변화가 없으면 avgGain=0, avgLoss=0 -> RS=0/0 -> RSI=100 (avgLoss=0 분기)
    expect(result[14]).toBe(100);
  });
});

describe('MACD', () => {
  const data = generateTestData(50);

  it('should return correct structure', () => {
    const result = macd(data);

    expect(result).toHaveProperty('macd');
    expect(result).toHaveProperty('signal');
    expect(result).toHaveProperty('histogram');
    expect(result.macd.length).toBe(data.length);
    expect(result.signal.length).toBe(data.length);
    expect(result.histogram.length).toBe(data.length);
  });

  it('should return null for initial values', () => {
    const result = macd(data, 12, 26, 9);

    // slowPeriod(26) 전까지는 null
    for (let i = 0; i < 25; i++) {
      expect(result.macd[i]).toBeNull();
    }
  });

  it('should handle empty data', () => {
    const result = macd([]);
    expect(result.macd).toEqual([]);
    expect(result.signal).toEqual([]);
    expect(result.histogram).toEqual([]);
  });
});

describe('Bollinger Bands', () => {
  const data = generateTestData(30);

  it('should return correct structure', () => {
    const result = bollingerBands(data);

    expect(result).toHaveProperty('upper');
    expect(result).toHaveProperty('middle');
    expect(result).toHaveProperty('lower');
    expect(result.upper.length).toBe(data.length);
    expect(result.middle.length).toBe(data.length);
    expect(result.lower.length).toBe(data.length);
  });

  it('should have upper > middle > lower', () => {
    const result = bollingerBands(data, 20, 2);

    for (let i = 19; i < data.length; i++) {
      expect(result.upper[i]).toBeGreaterThan(result.middle[i]!);
      expect(result.middle[i]).toBeGreaterThan(result.lower[i]!);
    }
  });

  it('should return null for first period-1 values', () => {
    const period = 20;
    const result = bollingerBands(data, period);

    for (let i = 0; i < period - 1; i++) {
      expect(result.upper[i]).toBeNull();
      expect(result.middle[i]).toBeNull();
      expect(result.lower[i]).toBeNull();
    }
  });
});

describe('Stochastic', () => {
  const data = generateTestData(30);

  it('should return values between 0 and 100', () => {
    const result = stochastic(data, 14, 3);

    result.k.forEach((value) => {
      if (value !== null) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });

    result.d.forEach((value) => {
      if (value !== null) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });
  });

  it('should return correct structure', () => {
    const result = stochastic(data);

    expect(result).toHaveProperty('k');
    expect(result).toHaveProperty('d');
    expect(result.k.length).toBe(data.length);
    expect(result.d.length).toBe(data.length);
  });
});

describe('OBV', () => {
  it('should return correct length', () => {
    const data = generateTestData(30);
    const result = obv(data);
    expect(result.length).toBe(data.length);
  });

  it('should start with 0', () => {
    const data = generateTestData(10);
    const result = obv(data);
    expect(result[0]).toBe(0);
  });

  it('should increase on up days', () => {
    const data: OHLCV[] = [
      { time: 1, open: 10, high: 11, low: 9, close: 10, volume: 1000 },
      { time: 2, open: 10, high: 12, low: 9, close: 12, volume: 2000 },
    ];

    const result = obv(data);
    expect(result[1]).toBe(2000);
  });

  it('should decrease on down days', () => {
    const data: OHLCV[] = [
      { time: 1, open: 10, high: 11, low: 9, close: 10, volume: 1000 },
      { time: 2, open: 10, high: 11, low: 8, close: 8, volume: 2000 },
    ];

    const result = obv(data);
    expect(result[1]).toBe(-2000);
  });

  it('should not change on unchanged days', () => {
    const data: OHLCV[] = [
      { time: 1, open: 10, high: 11, low: 9, close: 10, volume: 1000 },
      { time: 2, open: 10, high: 11, low: 9, close: 10, volume: 2000 },
    ];

    const result = obv(data);
    expect(result[1]).toBe(0);
  });
});

describe('ATR', () => {
  const data = generateTestData(30);

  it('should return correct length', () => {
    const result = atr(data, 14);
    expect(result.length).toBe(data.length);
  });

  it('should return null for first period-1 values', () => {
    const period = 14;
    const result = atr(data, period);

    for (let i = 0; i < period - 1; i++) {
      expect(result[i]).toBeNull();
    }
    expect(result[period - 1]).not.toBeNull();
  });

  it('should always be positive', () => {
    const result = atr(data, 14);

    result.forEach((value) => {
      if (value !== null) {
        expect(value).toBeGreaterThan(0);
      }
    });
  });

  it('should handle empty data', () => {
    expect(atr([])).toEqual([]);
  });
});
