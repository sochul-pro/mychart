import type { OHLCV, StockInfo, Quote, Orderbook, TimeFrame } from '@/types';

/**
 * 주식 데이터 Provider 인터페이스
 * Mock, 한국투자증권 등 다양한 구현체로 교체 가능
 */
export interface StockDataProvider {
  /** Provider 이름 */
  readonly name: string;

  /** 종목 정보 조회 */
  getStockInfo(symbol: string): Promise<StockInfo | null>;

  /** 종목 검색 */
  searchStocks(query: string): Promise<StockInfo[]>;

  /** 전체 종목 목록 */
  getAllStocks(): Promise<StockInfo[]>;

  /** OHLCV 차트 데이터 조회 */
  getOHLCV(symbol: string, timeFrame: TimeFrame, limit?: number): Promise<OHLCV[]>;

  /** 현재가 조회 */
  getQuote(symbol: string): Promise<Quote | null>;

  /** 여러 종목 현재가 조회 */
  getQuotes(symbols: string[]): Promise<Quote[]>;

  /** 호가 조회 */
  getOrderbook(symbol: string): Promise<Orderbook | null>;
}

/** 현재 활성화된 Provider */
let currentProvider: StockDataProvider | null = null;

/** Provider 설정 */
export function setStockProvider(provider: StockDataProvider): void {
  currentProvider = provider;
}

/** Provider 가져오기 */
export function getStockProvider(): StockDataProvider {
  if (!currentProvider) {
    throw new Error('StockDataProvider가 설정되지 않았습니다. setStockProvider()를 먼저 호출하세요.');
  }
  return currentProvider;
}
