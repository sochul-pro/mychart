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
  type: 'volume' | 'price' | 'high' | 'breakout' | 'foreign' | 'multi_rank';
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

// ============================================
// 순위 기반 주도주 발굴 타입
// ============================================

// 순위 유형
export type RankingType = 'change' | 'turnover' | 'amount' | 'foreign';

// 순위 항목
export interface RankingItem {
  symbol: string;
  name: string;
  market: 'KOSPI' | 'KOSDAQ';
  rank: number;
  price: number;
  changePercent: number;
  volume: number;
  amount?: number; // 거래대금
  turnoverRate?: number; // 회전율
  foreignNetBuy?: number; // 외인 순매수
  institutionNetBuy?: number; // 기관 순매수
}

// 순위 조회 결과
export interface RankingResult {
  type: RankingType;
  market: 'KOSPI' | 'KOSDAQ' | 'ALL';
  items: RankingItem[];
  fetchedAt: number;
}

// 가중치 설정
export interface RankingWeights {
  changeWeight: number; // 등락률 가중치 (기본 25)
  turnoverWeight: number; // 회전율 가중치 (기본 25)
  amountWeight: number; // 거래대금 가중치 (기본 25)
  foreignWeight: number; // 외인/기관 가중치 (기본 25)
}

// 기본 가중치
export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  changeWeight: 25,
  turnoverWeight: 25,
  amountWeight: 25,
  foreignWeight: 25,
};

// 주도주 결과
export interface LeaderStock {
  symbol: string;
  name: string;
  market: 'KOSPI' | 'KOSDAQ';

  // 순위 정보
  changeRank?: number; // 등락률 순위
  turnoverRank?: number; // 회전율 순위
  amountRank?: number; // 거래대금 순위
  foreignRank?: number; // 외인/기관 순위
  rankingCount: number; // 몇 개 순위에 등장했는지

  // 시세 정보
  price: number;
  changePercent: number;
  volume: number;
  amount?: number;

  // 점수
  score: number;
  signals: ScreenerSignal[];
}
