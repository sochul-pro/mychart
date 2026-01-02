import { useQuery } from '@tanstack/react-query';
import type { StockInfo, Quote, OHLCV, TimeFrame } from '@/types';

interface UseStockOptions {
  symbol: string;
  enabled?: boolean;
}

interface StockResponse {
  info: StockInfo;
  quote: Quote;
  provider: string;
}

interface OHLCVResponse {
  symbol: string;
  timeFrame: TimeFrame;
  data: OHLCV[];
  provider: string;
}

async function fetchStock(symbol: string): Promise<StockResponse> {
  const res = await fetch(`/api/stocks/${symbol}`);
  if (!res.ok) {
    throw new Error('Failed to fetch stock data');
  }
  return res.json();
}

async function fetchOHLCV(
  symbol: string,
  timeFrame: TimeFrame,
  limit: number
): Promise<OHLCV[]> {
  const res = await fetch(
    `/api/stocks/${symbol}/ohlcv?timeFrame=${timeFrame}&limit=${limit}`
  );
  if (!res.ok) {
    throw new Error('Failed to fetch OHLCV data');
  }
  const data: OHLCVResponse = await res.json();
  return data.data;
}

export function useStockInfo(options: UseStockOptions) {
  return useQuery({
    queryKey: ['stock', 'info', options.symbol],
    queryFn: async () => {
      const data = await fetchStock(options.symbol);
      return data.info;
    },
    enabled: options.enabled !== false && !!options.symbol,
  });
}

export function useStockQuote(options: UseStockOptions) {
  return useQuery({
    queryKey: ['stock', 'quote', options.symbol],
    queryFn: async () => {
      const data = await fetchStock(options.symbol);
      return data.quote;
    },
    enabled: options.enabled !== false && !!options.symbol,
    refetchInterval: 30 * 1000, // 30초마다 갱신
  });
}

export function useStockOHLCV(
  options: UseStockOptions & { timeFrame?: TimeFrame; limit?: number }
) {
  const { symbol, timeFrame = 'D', limit = 100, enabled } = options;

  return useQuery({
    queryKey: ['stock', 'ohlcv', symbol, timeFrame, limit],
    queryFn: () => fetchOHLCV(symbol, timeFrame, limit),
    enabled: enabled !== false && !!symbol,
  });
}

export function useStock(symbol: string) {
  const stockQuery = useQuery({
    queryKey: ['stock', 'data', symbol],
    queryFn: () => fetchStock(symbol),
    enabled: !!symbol,
  });

  const ohlcvQuery = useStockOHLCV({ symbol, timeFrame: 'D', limit: 252 });

  return {
    info: stockQuery.data?.info as StockInfo | null,
    quote: stockQuery.data?.quote as Quote | null,
    ohlcv: ohlcvQuery.data as OHLCV[] | undefined,
    isLoading: stockQuery.isLoading || ohlcvQuery.isLoading,
    error: stockQuery.error || ohlcvQuery.error,
    provider: stockQuery.data?.provider,
    refetch: () => {
      stockQuery.refetch();
      ohlcvQuery.refetch();
    },
  };
}
