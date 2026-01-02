import { describe, it, expect } from 'vitest';
import {
  filterByVolumeSurge,
  filterByPriceChange,
  filterByNewHigh,
  calculateVolumeRatio,
  calculate52WeekHigh,
  calculateAvgVolume,
  generateSignals,
  calculateScore,
  createScreenerResult,
  applyFilters,
  sortResults,
} from './filters';
import type { Quote, StockInfo, OHLCV } from '@/types';

const mockQuote: Quote = {
  symbol: '005930',
  price: 75000,
  change: 2000,
  changePercent: 2.74,
  volume: 10000000,
  high: 76000,
  low: 73000,
  open: 73500,
  prevClose: 73000,
  timestamp: Date.now(),
};

const mockStock: StockInfo = {
  symbol: '005930',
  name: '삼성전자',
  market: 'KOSPI',
  sector: '반도체',
};

const mockOHLCV: OHLCV[] = Array.from({ length: 252 }, (_, i) => ({
  time: Date.now() - (252 - i) * 24 * 60 * 60 * 1000,
  open: 70000 + Math.random() * 5000,
  high: 72000 + Math.random() * 5000,
  low: 68000 + Math.random() * 3000,
  close: 70000 + Math.random() * 5000,
  volume: 5000000 + Math.floor(Math.random() * 5000000),
}));

describe('Screener Filters', () => {
  describe('filterByVolumeSurge', () => {
    it('should return true when volume ratio exceeds threshold', () => {
      expect(filterByVolumeSurge({ ...mockQuote, volume: 10000000 }, 5000000, 2.0)).toBe(true);
    });

    it('should return false when volume ratio below threshold', () => {
      expect(filterByVolumeSurge({ ...mockQuote, volume: 5000000 }, 5000000, 2.0)).toBe(false);
    });

    it('should return false when average volume is 0', () => {
      expect(filterByVolumeSurge(mockQuote, 0, 2.0)).toBe(false);
    });
  });

  describe('filterByPriceChange', () => {
    it('should return true when change is within range', () => {
      expect(filterByPriceChange({ ...mockQuote, changePercent: 5 }, 0, 10)).toBe(true);
    });

    it('should return false when change is below min', () => {
      expect(filterByPriceChange({ ...mockQuote, changePercent: 2 }, 3, 10)).toBe(false);
    });

    it('should return false when change exceeds max', () => {
      expect(filterByPriceChange({ ...mockQuote, changePercent: 15 }, 0, 10)).toBe(false);
    });
  });

  describe('filterByNewHigh', () => {
    it('should return true when price equals 52w high', () => {
      expect(filterByNewHigh({ ...mockQuote, price: 80000 }, 80000)).toBe(true);
    });

    it('should return true when price exceeds 52w high', () => {
      expect(filterByNewHigh({ ...mockQuote, price: 85000 }, 80000)).toBe(true);
    });

    it('should return false when price is below 52w high', () => {
      expect(filterByNewHigh({ ...mockQuote, price: 75000 }, 80000)).toBe(false);
    });
  });

  describe('calculateVolumeRatio', () => {
    it('should calculate correct volume ratio', () => {
      expect(calculateVolumeRatio(10000000, 5000000)).toBe(2);
    });

    it('should return 0 when average volume is 0', () => {
      expect(calculateVolumeRatio(10000000, 0)).toBe(0);
    });
  });

  describe('calculate52WeekHigh', () => {
    it('should return highest value in data', () => {
      const data: OHLCV[] = [
        { time: 1, open: 100, high: 120, low: 90, close: 110, volume: 1000 },
        { time: 2, open: 110, high: 130, low: 100, close: 125, volume: 1000 },
        { time: 3, open: 125, high: 140, low: 115, close: 135, volume: 1000 },
      ];
      expect(calculate52WeekHigh(data)).toBe(140);
    });

    it('should return 0 for empty data', () => {
      expect(calculate52WeekHigh([])).toBe(0);
    });
  });

  describe('calculateAvgVolume', () => {
    it('should calculate average volume', () => {
      const data: OHLCV[] = [
        { time: 1, open: 100, high: 120, low: 90, close: 110, volume: 1000 },
        { time: 2, open: 110, high: 130, low: 100, close: 125, volume: 2000 },
        { time: 3, open: 125, high: 140, low: 115, close: 135, volume: 3000 },
      ];
      expect(calculateAvgVolume(data, 3)).toBe(2000);
    });

    it('should return 0 for empty data', () => {
      expect(calculateAvgVolume([], 20)).toBe(0);
    });
  });

  describe('generateSignals', () => {
    it('should generate strong volume signal for 5x volume', () => {
      const signals = generateSignals(mockQuote, 5, false);
      const volumeSignal = signals.find(s => s.type === 'volume');
      expect(volumeSignal?.strength).toBe('strong');
    });

    it('should generate medium price signal for 5% change', () => {
      const signals = generateSignals({ ...mockQuote, changePercent: 5 }, 1, false);
      const priceSignal = signals.find(s => s.type === 'price');
      expect(priceSignal?.strength).toBe('medium');
    });

    it('should generate new high signal', () => {
      const signals = generateSignals(mockQuote, 1, true);
      const highSignal = signals.find(s => s.type === 'high');
      expect(highSignal).toBeDefined();
      expect(highSignal?.strength).toBe('strong');
    });
  });

  describe('calculateScore', () => {
    it('should return score between 0 and 100', () => {
      const score = calculateScore(mockQuote, 3, true, 50);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give high score for strong signals', () => {
      const score = calculateScore(
        { ...mockQuote, changePercent: 15 },
        5,
        true,
        100
      );
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should give low score for weak signals', () => {
      const score = calculateScore(
        { ...mockQuote, changePercent: -2 },
        0.5,
        false,
        -20
      );
      expect(score).toBeLessThanOrEqual(20);
    });
  });

  describe('createScreenerResult', () => {
    it('should create result with all fields', () => {
      const result = createScreenerResult(mockStock, mockQuote, mockOHLCV);

      expect(result.stock).toBe(mockStock);
      expect(result.quote).toBe(mockQuote);
      expect(typeof result.score).toBe('number');
      expect(typeof result.volumeRatio).toBe('number');
      expect(typeof result.isNewHigh).toBe('boolean');
      expect(Array.isArray(result.signals)).toBe(true);
    });
  });

  describe('applyFilters', () => {
    const mockResults = [
      createScreenerResult(
        { ...mockStock, market: 'KOSPI' },
        { ...mockQuote, changePercent: 5 },
        mockOHLCV
      ),
      createScreenerResult(
        { ...mockStock, symbol: '035420', name: 'NAVER', market: 'KOSPI' },
        { ...mockQuote, changePercent: 2 },
        mockOHLCV
      ),
    ];

    it('should filter by market', () => {
      const filtered = applyFilters(mockResults, { market: 'KOSDAQ' });
      expect(filtered.length).toBe(0);
    });

    it('should filter by min change percent', () => {
      const filtered = applyFilters(mockResults, { minChangePercent: 3 });
      expect(filtered.length).toBe(1);
    });
  });

  describe('sortResults', () => {
    const results = [
      createScreenerResult(mockStock, { ...mockQuote, changePercent: 3 }, mockOHLCV),
      createScreenerResult(mockStock, { ...mockQuote, changePercent: 7 }, mockOHLCV),
      createScreenerResult(mockStock, { ...mockQuote, changePercent: 5 }, mockOHLCV),
    ];

    it('should sort by change percent descending', () => {
      const sorted = sortResults(results, 'change_percent');
      expect(sorted[0].quote.changePercent).toBe(7);
      expect(sorted[1].quote.changePercent).toBe(5);
      expect(sorted[2].quote.changePercent).toBe(3);
    });
  });
});
