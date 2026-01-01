// OHLCV 데이터 (캔들)
export interface OHLCV {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 종목 기본 정보
export interface StockInfo {
  symbol: string; // 종목코드 (예: 005930)
  name: string; // 종목명 (예: 삼성전자)
  market: 'KOSPI' | 'KOSDAQ';
  sector?: string;
}

// 현재가 정보
export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  timestamp: number;
}

// 호가 정보
export interface OrderbookEntry {
  price: number;
  quantity: number;
}

export interface Orderbook {
  symbol: string;
  asks: OrderbookEntry[]; // 매도 호가
  bids: OrderbookEntry[]; // 매수 호가
  timestamp: number;
}

// 차트 시간 프레임
export type TimeFrame = 'D' | 'W' | 'M'; // 일, 주, 월

// 뉴스
export interface News {
  id: string;
  title: string;
  summary?: string;
  url: string;
  source: string;
  publishedAt: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}
