import { describe, it, expect, beforeEach } from 'vitest';
import { MockProvider } from './mock-provider';

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  describe('getStockInfo', () => {
    it('should return stock info for valid symbol', async () => {
      const stock = await provider.getStockInfo('005930');
      expect(stock).not.toBeNull();
      expect(stock?.symbol).toBe('005930');
      expect(stock?.name).toBe('삼성전자');
      expect(stock?.market).toBe('KOSPI');
    });

    it('should return null for invalid symbol', async () => {
      const stock = await provider.getStockInfo('999999');
      expect(stock).toBeNull();
    });
  });

  describe('searchStocks', () => {
    it('should find stocks by name', async () => {
      const results = await provider.searchStocks('삼성');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((s) => s.name.includes('삼성'))).toBe(true);
    });

    it('should find stocks by symbol', async () => {
      const results = await provider.searchStocks('005930');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].symbol).toBe('005930');
    });
  });

  describe('getAllStocks', () => {
    it('should return all mock stocks', async () => {
      const stocks = await provider.getAllStocks();
      expect(stocks.length).toBeGreaterThan(10);
    });
  });

  describe('getOHLCV', () => {
    it('should return OHLCV data for valid symbol', async () => {
      const data = await provider.getOHLCV('005930', 'D', 10);
      expect(data.length).toBe(10);
      expect(data[0]).toHaveProperty('time');
      expect(data[0]).toHaveProperty('open');
      expect(data[0]).toHaveProperty('high');
      expect(data[0]).toHaveProperty('low');
      expect(data[0]).toHaveProperty('close');
      expect(data[0]).toHaveProperty('volume');
    });

    it('should return empty array for invalid symbol', async () => {
      const data = await provider.getOHLCV('999999', 'D', 10);
      expect(data.length).toBe(0);
    });

    it('should generate consistent data for same symbol', async () => {
      const data1 = await provider.getOHLCV('005930', 'D', 10);
      const data2 = await provider.getOHLCV('005930', 'D', 10);
      // 시드 기반이라 같은 결과
      expect(data1[0].close).toBe(data2[0].close);
    });
  });

  describe('getQuote', () => {
    it('should return quote for valid symbol', async () => {
      const quote = await provider.getQuote('005930');
      expect(quote).not.toBeNull();
      expect(quote?.symbol).toBe('005930');
      expect(quote?.price).toBeGreaterThan(0);
      expect(quote).toHaveProperty('change');
      expect(quote).toHaveProperty('changePercent');
      expect(quote).toHaveProperty('volume');
    });

    it('should return null for invalid symbol', async () => {
      const quote = await provider.getQuote('999999');
      expect(quote).toBeNull();
    });
  });

  describe('getQuotes', () => {
    it('should return quotes for multiple symbols', async () => {
      const quotes = await provider.getQuotes(['005930', '000660', '035420']);
      expect(quotes.length).toBe(3);
    });

    it('should filter out invalid symbols', async () => {
      const quotes = await provider.getQuotes(['005930', '999999']);
      expect(quotes.length).toBe(1);
    });
  });

  describe('getOrderbook', () => {
    it('should return orderbook for valid symbol', async () => {
      const orderbook = await provider.getOrderbook('005930');
      expect(orderbook).not.toBeNull();
      expect(orderbook?.asks.length).toBe(10);
      expect(orderbook?.bids.length).toBe(10);
      expect(orderbook?.asks[0].price).toBeGreaterThan(orderbook?.bids[0].price ?? 0);
    });

    it('should return null for invalid symbol', async () => {
      const orderbook = await provider.getOrderbook('999999');
      expect(orderbook).toBeNull();
    });
  });
});
