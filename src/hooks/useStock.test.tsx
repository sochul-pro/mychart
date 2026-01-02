import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStock, useStockInfo, useStockQuote } from './useStock';
import type { ReactNode } from 'react';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryWrapper';
  return Wrapper;
};

describe('useStock hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockInfo = {
    symbol: '005930',
    name: '삼성전자',
    market: 'KOSPI' as const,
  };

  const mockQuote = {
    symbol: '005930',
    price: 75000,
    change: 1000,
    changePercent: 1.35,
    volume: 10000000,
    high: 76000,
    low: 74000,
    open: 74500,
    prevClose: 74000,
    timestamp: Date.now(),
  };

  const mockOHLCV = [
    { time: Date.now(), open: 74000, high: 76000, low: 73000, close: 75000, volume: 10000000 },
  ];

  describe('useStockInfo', () => {
    it('should fetch stock info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ info: mockInfo, quote: mockQuote, provider: 'MockProvider' }),
      });

      const { result } = renderHook(() => useStockInfo({ symbol: '005930' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockInfo);
    });
  });

  describe('useStockQuote', () => {
    it('should fetch stock quote', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ info: mockInfo, quote: mockQuote, provider: 'MockProvider' }),
      });

      const { result } = renderHook(() => useStockQuote({ symbol: '005930' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.price).toBe(75000);
    });
  });

  describe('useStock', () => {
    it('should fetch all stock data', async () => {
      // Mock for stock data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ info: mockInfo, quote: mockQuote, provider: 'MockProvider' }),
      });

      // Mock for OHLCV data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ symbol: '005930', timeFrame: 'D', data: mockOHLCV, provider: 'MockProvider' }),
      });

      const { result } = renderHook(() => useStock('005930'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.info?.name).toBe('삼성전자');
      expect(result.current.quote?.price).toBe(75000);
      expect(result.current.ohlcv).toHaveLength(1);
    });
  });
});
