import { describe, it, expect, beforeEach } from 'vitest';
import { MockNewsProvider } from './mock-news-provider';

describe('MockNewsProvider', () => {
  let provider: MockNewsProvider;

  beforeEach(() => {
    provider = new MockNewsProvider();
  });

  describe('getNewsBySymbol', () => {
    it('should return news for valid symbol', async () => {
      const news = await provider.getNewsBySymbol('005930', 5);
      expect(news.length).toBe(5);
      expect(news[0]).toHaveProperty('id');
      expect(news[0]).toHaveProperty('title');
      expect(news[0]).toHaveProperty('source');
      expect(news[0]).toHaveProperty('publishedAt');
      expect(news[0].title).toContain('삼성전자');
    });

    it('should return empty array for invalid symbol', async () => {
      const news = await provider.getNewsBySymbol('999999', 5);
      expect(news.length).toBe(0);
    });

    it('should return news sorted by publishedAt descending', async () => {
      const news = await provider.getNewsBySymbol('005930', 10);
      for (let i = 1; i < news.length; i++) {
        expect(news[i - 1].publishedAt).toBeGreaterThanOrEqual(news[i].publishedAt);
      }
    });
  });

  describe('getNewsBySymbols', () => {
    it('should return news for multiple symbols', async () => {
      const news = await provider.getNewsBySymbols(['005930', '000660'], 10);
      expect(news.length).toBeLessThanOrEqual(10);
      expect(news.length).toBeGreaterThan(0);
    });
  });

  describe('getLatestNews', () => {
    it('should return latest news', async () => {
      const news = await provider.getLatestNews(15);
      expect(news.length).toBe(15);
    });
  });

  describe('searchNews', () => {
    it('should return news matching query', async () => {
      const news = await provider.searchNews('테스트', 5);
      expect(news.length).toBe(5);
    });
  });

  describe('news properties', () => {
    it('should have valid sentiment', async () => {
      const news = await provider.getNewsBySymbol('005930', 20);
      news.forEach((n) => {
        expect(['positive', 'negative', 'neutral']).toContain(n.sentiment);
      });
    });

    it('should have valid source', async () => {
      const validSources = ['한국경제', '매일경제', '서울경제', '이데일리', '연합뉴스', '머니투데이'];
      const news = await provider.getNewsBySymbol('005930', 10);
      news.forEach((n) => {
        expect(validSources).toContain(n.source);
      });
    });
  });
});
