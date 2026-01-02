import type { StockInfo, Quote } from './stock';

// 스크리너 필터 타입
export type ScreenerFilterType =
  | 'volume_surge' // 거래량 급증
  | 'price_increase' // 상승률 상위
  | 'new_high' // 신고가
  | 'momentum'; // 복합 모멘텀

// 스크리너 정렬 옵션
export type ScreenerSortBy =
  | 'score' // 종합 점수
  | 'change_percent' // 등락률
  | 'volume_ratio' // 거래량 비율
  | 'market_cap'; // 시가총액

// 스크리너 결과 항목
export interface ScreenerResult {
  stock: StockInfo;
  quote: Quote;
  score: number; // 종합 점수 (0-100)
  volumeRatio: number; // 평균 거래량 대비 비율
  isNewHigh: boolean; // 52주 신고가 여부
  priceChange52w: number; // 52주 대비 가격 변화율
  signals: ScreenerSignal[];
}

// 스크리너 신호
export interface ScreenerSignal {
  type: 'volume' | 'price' | 'high' | 'breakout';
  message: string;
  strength: 'weak' | 'medium' | 'strong';
}

// 스크리너 필터 옵션
export interface ScreenerFilter {
  market?: 'KOSPI' | 'KOSDAQ' | 'all';
  sector?: string;
  minVolume?: number; // 최소 거래량
  minVolumeRatio?: number; // 최소 거래량 비율
  minChangePercent?: number; // 최소 등락률
  maxChangePercent?: number; // 최대 등락률
  onlyNewHigh?: boolean; // 신고가만
}

// 스크리너 API 응답
export interface ScreenerResponse {
  results: ScreenerResult[];
  total: number;
  filter: ScreenerFilter;
  updatedAt: number;
}
