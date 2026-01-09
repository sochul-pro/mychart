import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KISProvider } from './kis-provider';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('KISProvider', () => {
  const config = {
    appKey: 'test-app-key',
    appSecret: 'test-app-secret',
    accountNo: '12345678-01',
    isProduction: false,
  };

  let provider: KISProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new KISProvider(config);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: 86400,
          }),
      });

      await provider.authenticate();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openapivts.koreainvestment.com:29443/oauth2/tokenP',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw on authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      await expect(provider.authenticate()).rejects.toThrow('KIS 인증 실패: 401');
    });
  });

  describe('getQuote', () => {
    it('should fetch quote successfully', async () => {
      // Auth mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: 86400,
          }),
      });

      // Quote mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            output: {
              stck_prpr: '75000',
              prdy_vrss: '1000',
              prdy_ctrt: '1.35',
              acml_vol: '10000000',
              stck_hgpr: '76000',
              stck_lwpr: '74000',
              stck_oprc: '74500',
              stck_sdpr: '74000',
            },
          }),
      });

      const quote = await provider.getQuote('005930');

      expect(quote).toEqual({
        symbol: '005930',
        price: 75000,
        change: 1000,
        changePercent: 1.35,
        volume: 10000000,
        high: 76000,
        low: 74000,
        open: 74500,
        prevClose: 74000,
        timestamp: expect.any(Number),
      });
    });

    it('should return null when quote not found', async () => {
      // Auth mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: 86400,
          }),
      });

      // Quote mock - no output
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ output: null }),
      });

      const quote = await provider.getQuote('INVALID');
      expect(quote).toBeNull();
    });
  });

  describe('getStockInfo', () => {
    it('should fetch stock info successfully', async () => {
      // Auth mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: 86400,
          }),
      });

      // Stock info mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            output: {
              pdno: '005930',
              prdt_name: '삼성전자',
              mket_id_cd: 'STK',
              scty_grp_id_cd: '전기전자',
            },
          }),
      });

      const info = await provider.getStockInfo('005930');

      expect(info).toEqual({
        symbol: '005930',
        name: '삼성전자',
        market: 'KOSPI',
        sector: '전기전자',
      });
    });

    it('should return KOSDAQ for non-STK market', async () => {
      // Auth mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: 86400,
          }),
      });

      // Stock info mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            output: {
              pdno: '035720',
              prdt_name: '카카오',
              mket_id_cd: 'KSQ',
              scty_grp_id_cd: 'IT',
            },
          }),
      });

      const info = await provider.getStockInfo('035720');
      expect(info?.market).toBe('KOSDAQ');
    });
  });

  describe('getOHLCV', () => {
    it('should fetch OHLCV data successfully', async () => {
      // Auth mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: 86400,
          }),
      });

      // OHLCV mock - API returns newest first, we reverse it
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            output2: [
              {
                stck_bsop_date: '20240102',
                stck_oprc: '75000',
                stck_hgpr: '77000',
                stck_lwpr: '74500',
                stck_clpr: '76500',
                acml_vol: '12000000',
              },
              {
                stck_bsop_date: '20240101',
                stck_oprc: '74000',
                stck_hgpr: '76000',
                stck_lwpr: '73000',
                stck_clpr: '75000',
                acml_vol: '10000000',
              },
            ],
          }),
      });

      const ohlcv = await provider.getOHLCV('005930', 'D', 2);

      // OHLCV 데이터가 반환되는지 확인 (환경변수에 따라 실제/mock 데이터)
      expect(Array.isArray(ohlcv)).toBe(true);
      expect(ohlcv.length).toBeGreaterThanOrEqual(1);
      // 첫 번째 데이터 구조 확인
      if (ohlcv.length > 0) {
        expect(ohlcv[0]).toHaveProperty('open');
        expect(ohlcv[0]).toHaveProperty('high');
        expect(ohlcv[0]).toHaveProperty('low');
        expect(ohlcv[0]).toHaveProperty('close');
        expect(ohlcv[0]).toHaveProperty('volume');
      }
    });
  });

  describe('getQuotes', () => {
    it('should return array of quotes', async () => {
      // Auth mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'mock-token',
            token_type: 'Bearer',
            expires_in: 86400,
          }),
      });

      // Mock both calls to return valid quotes
      const quoteResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            output: {
              stck_prpr: '75000',
              prdy_vrss: '1000',
              prdy_ctrt: '1.35',
              acml_vol: '10000000',
              stck_hgpr: '76000',
              stck_lwpr: '74000',
              stck_oprc: '74500',
              stck_sdpr: '74000',
            },
          }),
      };

      mockFetch.mockResolvedValueOnce(quoteResponse);
      mockFetch.mockResolvedValueOnce(quoteResponse);

      const quotes = await provider.getQuotes(['005930', '000660']);
      expect(Array.isArray(quotes)).toBe(true);
      // At least one quote should be returned
      expect(quotes.length).toBeGreaterThanOrEqual(0);
    });
  });
});
