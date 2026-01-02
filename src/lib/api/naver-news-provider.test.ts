import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NaverNewsProvider } from './naver-news-provider';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('NaverNewsProvider', () => {
  const config = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  };

  let provider: NaverNewsProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new NaverNewsProvider(config);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getNewsBySymbol', () => {
    it('should fetch news for known symbol', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            lastBuildDate: 'Thu, 02 Jan 2025 10:00:00 +0900',
            total: 100,
            start: 1,
            display: 2,
            items: [
              {
                title: '삼성전자 <b>주가</b> 상승',
                originallink: 'https://news.example.com/1',
                link: 'https://news.naver.com/1',
                description: '삼성전자 주가가 상승세를 보이고 있다.',
                pubDate: 'Thu, 02 Jan 2025 09:00:00 +0900',
              },
              {
                title: '삼성전자 실적 발표',
                originallink: 'https://news.example.com/2',
                link: 'https://news.naver.com/2',
                description: '삼성전자 4분기 실적 발표 예정.',
                pubDate: 'Thu, 02 Jan 2025 08:00:00 +0900',
              },
            ],
          }),
      });

      const news = await provider.getNewsBySymbol('005930', 10);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('openapi.naver.com'),
        expect.objectContaining({
          headers: {
            'X-Naver-Client-Id': 'test-client-id',
            'X-Naver-Client-Secret': 'test-client-secret',
          },
        })
      );

      expect(news).toHaveLength(2);
      expect(news[0].title).toBe('삼성전자 주가 상승'); // HTML stripped
      expect(news[0].source).toBe('네이버뉴스');
      expect(news[0].url).toBe('https://news.example.com/1');
    });

    it('should return empty array for unknown symbol', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [],
          }),
      });

      const news = await provider.getNewsBySymbol('UNKNOWN');
      expect(news).toHaveLength(0);
    });

    it('should return empty array on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const news = await provider.getNewsBySymbol('005930');
      expect(news).toHaveLength(0);
    });
  });

  describe('getLatestNews', () => {
    it('should fetch general market news', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                title: '코스피 상승 마감',
                originallink: 'https://news.example.com/1',
                link: 'https://news.naver.com/1',
                description: '코스피 지수가 상승 마감했다.',
                pubDate: 'Thu, 02 Jan 2025 15:30:00 +0900',
              },
            ],
          }),
      });

      const news = await provider.getLatestNews(10);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('openapi.naver.com'),
        expect.any(Object)
      );
      expect(news).toHaveLength(1);
    });
  });

  describe('searchNews', () => {
    it('should search news by query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                title: '반도체 산업 전망',
                originallink: 'https://news.example.com/1',
                link: 'https://news.naver.com/1',
                description: '반도체 산업 2025년 전망 분석.',
                pubDate: 'Thu, 02 Jan 2025 10:00:00 +0900',
              },
            ],
          }),
      });

      const news = await provider.searchNews('반도체');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('openapi.naver.com'),
        expect.any(Object)
      );
      expect(news).toHaveLength(1);
      expect(news[0].title).toBe('반도체 산업 전망');
    });
  });

  describe('getNewsBySymbols', () => {
    it('should fetch news for multiple symbols', async () => {
      // First call for 삼성전자
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                title: '삼성전자 뉴스',
                originallink: 'https://news.example.com/1',
                link: 'https://news.naver.com/1',
                description: '삼성전자 관련 뉴스.',
                pubDate: 'Thu, 02 Jan 2025 10:00:00 +0900',
              },
            ],
          }),
      });

      // Second call for SK하이닉스
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                title: 'SK하이닉스 뉴스',
                originallink: 'https://news.example.com/2',
                link: 'https://news.naver.com/2',
                description: 'SK하이닉스 관련 뉴스.',
                pubDate: 'Thu, 02 Jan 2025 09:00:00 +0900',
              },
            ],
          }),
      });

      const news = await provider.getNewsBySymbols(['005930', '000660'], 10);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(news.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('sentiment analysis', () => {
    it('should detect positive sentiment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                title: '삼성전자 주가 급등, 신고가 돌파',
                originallink: 'https://news.example.com/1',
                link: 'https://news.naver.com/1',
                description: '실적 호조로 주가 상승.',
                pubDate: 'Thu, 02 Jan 2025 10:00:00 +0900',
              },
            ],
          }),
      });

      const news = await provider.getNewsBySymbol('005930');
      expect(news[0].sentiment).toBe('positive');
    });

    it('should detect negative sentiment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                title: '삼성전자 주가 급락, 실적 부진 우려',
                originallink: 'https://news.example.com/1',
                link: 'https://news.naver.com/1',
                description: '실적 악화로 주가 하락.',
                pubDate: 'Thu, 02 Jan 2025 10:00:00 +0900',
              },
            ],
          }),
      });

      const news = await provider.getNewsBySymbol('005930');
      expect(news[0].sentiment).toBe('negative');
    });

    it('should detect neutral sentiment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                title: '삼성전자 주주총회 개최',
                originallink: 'https://news.example.com/1',
                link: 'https://news.naver.com/1',
                description: '정기 주주총회 예정.',
                pubDate: 'Thu, 02 Jan 2025 10:00:00 +0900',
              },
            ],
          }),
      });

      const news = await provider.getNewsBySymbol('005930');
      expect(news[0].sentiment).toBe('neutral');
    });
  });
});
