// 주도주 정보
export interface LeadingStock {
  symbol: string; // 종목코드
  name: string; // 종목명
  price: number; // 현재가
  changePercent: number; // 등락률
}

// 테마 내 종목 상세 정보 (모멘텀 점수 계산용)
export interface ThemeStock extends LeadingStock {
  volume: number; // 거래량
  tradingValue: number; // 거래대금 (백만원)
  marketCap: number; // 시가총액 (억원)
  momentumScore?: number; // 모멘텀 점수 (계산된 값)
}

// 테마 기본 정보
export interface Theme {
  id: string; // 테마 고유 ID (네이버 테마 코드)
  name: string; // 테마명
  changePercent: number; // 평균 등락률
  stockCount: number; // 총 종목수
  advanceCount: number; // 상승 종목수
  unchangedCount: number; // 보합 종목수
  declineCount: number; // 하락 종목수
  leadingStocks: LeadingStock[]; // 주도주 목록 (최대 5개)
  updatedAt: number; // 업데이트 시간 (Unix timestamp)
}

// 관심 테마
export interface FavoriteTheme {
  id: string; // 관심 테마 ID (DB PK)
  themeId: string; // 테마 ID
  themeName: string; // 테마명 (캐시)
  order: number; // 정렬 순서
  customStocks: string[] | null; // 사용자 선택 종목 (null이면 기본 주도주)
  createdAt: number; // 추가 시간
}

// 모멘텀 점수 가중치 설정
export interface MomentumWeights {
  changePercent: number; // 상승률 가중치 (0-1)
  volume: number; // 거래량 증가율 가중치 (0-1)
  tradingValue: number; // 거래대금 가중치 (0-1)
  marketCap: number; // 시가총액 가중치 (0-1)
}

// 기본 모멘텀 가중치
export const DEFAULT_MOMENTUM_WEIGHTS: MomentumWeights = {
  changePercent: 0.3, // 30%
  volume: 0.25, // 25%
  tradingValue: 0.25, // 25%
  marketCap: 0.2, // 20%
};

// 테마 필터 타입
export type ThemeFilterType = 'all' | 'advance' | 'decline';

// 테마 정렬 기준
export type ThemeSortBy = 'change' | 'name' | 'stockCount';

// 테마 필터
export interface ThemeFilter {
  type: ThemeFilterType; // 전체/상승/하락
  sortBy: ThemeSortBy; // 정렬 기준
  sortOrder: 'asc' | 'desc'; // 정렬 순서
  search?: string; // 검색어
}

// 테마 요약 (상단 카드용)
export interface ThemeSummary {
  hotTheme: Theme | null; // 가장 인기 있는 테마 (종목수 기준)
  topGainer: Theme | null; // 최고 상승 테마
  topLoser: Theme | null; // 최고 하락 테마
  totalThemes: number; // 전체 테마 수
  advanceThemes: number; // 상승 테마 수
  declineThemes: number; // 하락 테마 수
}

// 스파크라인 데이터
export interface SparklineData {
  symbol: string; // 종목코드
  prices: number[]; // 최근 N일 종가
  isUp: boolean; // 상승 여부 (첫날 대비)
}

// API 응답 타입
export interface ThemeListResponse {
  themes: Theme[];
  summary: ThemeSummary;
  total: number;
  page: number;
  pageSize: number;
  updatedAt: number;
}

export interface FavoriteThemeListResponse {
  favorites: FavoriteTheme[];
  total: number;
}

// 테마 페이지네이션
export interface ThemePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 기본값
export const DEFAULT_THEME_FILTER: ThemeFilter = {
  type: 'all',
  sortBy: 'change',
  sortOrder: 'desc',
};

export const THEME_PAGE_SIZE = 20;
