import { useQuery } from '@tanstack/react-query';
import { mockProvider } from '@/lib/api/mock-provider';
import type { StockInfo, Quote, OHLCV, TimeFrame } from '@/types';

interface UseStockOptions {
  symbol: string;
  enabled?: boolean;
}

export function useStockInfo(options: UseStockOptions) {
  return useQuery({
    queryKey: ['stock', 'info', options.symbol],
    queryFn: () => mockProvider.getStockInfo(options.symbol),
    enabled: options.enabled !== false && !!options.symbol,
  });
}

export function useStockQuote(options: UseStockOptions) {
  return useQuery({
    queryKey: ['stock', 'quote', options.symbol],
    queryFn: () => mockProvider.getQuote(options.symbol),
    enabled: options.enabled !== false && !!options.symbol,
    refetchInterval: 30 * 1000, // 30초마다 갱신
  });
}

export function useStockOHLCV(options: UseStockOptions & { timeFrame?: TimeFrame; limit?: number }) {
  const { symbol, timeFrame = 'D', limit = 100, enabled } = options;

  return useQuery({
    queryKey: ['stock', 'ohlcv', symbol, timeFrame, limit],
    queryFn: () => mockProvider.getOHLCV(symbol, timeFrame, limit),
    enabled: enabled !== false && !!symbol,
  });
}

export function useStock(symbol: string) {
  const infoQuery = useStockInfo({ symbol });
  const quoteQuery = useStockQuote({ symbol });
  const ohlcvQuery = useStockOHLCV({ symbol, timeFrame: 'D', limit: 252 });

  return {
    info: infoQuery.data as StockInfo | null,
    quote: quoteQuery.data as Quote | null,
    ohlcv: ohlcvQuery.data as OHLCV[] | undefined,
    isLoading: infoQuery.isLoading || quoteQuery.isLoading || ohlcvQuery.isLoading,
    error: infoQuery.error || quoteQuery.error || ohlcvQuery.error,
    refetch: () => {
      infoQuery.refetch();
      quoteQuery.refetch();
      ohlcvQuery.refetch();
    },
  };
}
