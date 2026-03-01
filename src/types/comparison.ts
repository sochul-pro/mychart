/**
 * 상대 수익률 비교 차트 관련 타입 정의
 */

// 비교 기간
export type ComparePeriod = '1M' | '3M' | '6M' | '1Y' | '2Y';

// 비교 아이템 타입
export type ComparisonItemType = 'stock' | 'index';

// 비교 아이템 (주식 또는 지수)
export interface ComparisonItem {
  code: string;       // 종목코드 또는 지수코드
  name: string;       // 이름
  type: ComparisonItemType;
  color: string;      // 차트 라인 색상
  visible: boolean;   // 차트 표시 여부
}

// 정규화된 데이터 포인트
export interface NormalizedDataPoint {
  time: number;       // Unix timestamp (초)
  value: number;      // 수익률 (%, 시작점=0)
}

// 비교 데이터 응답의 개별 아이템
export interface ComparisonDataItem {
  name: string;
  type: ComparisonItemType;
  values: NormalizedDataPoint[];
  currentReturn: number; // 현재 수익률
}

// 비교 데이터 응답
export interface ComparisonData {
  period: ComparePeriod;
  startDate: string;  // 시작일 (YYYY-MM-DD)
  endDate: string;    // 종료일 (YYYY-MM-DD)
  items: Record<string, ComparisonDataItem>;
}

// 비교 세트 (저장용)
export interface ComparisonSet {
  id: string;
  name: string;
  symbols: string[];  // 종목/지수 코드 목록
  period: ComparePeriod;
  createdAt: Date;
  updatedAt: Date;
}

// 비교 세트 생성 요청
export interface CreateComparisonSetRequest {
  name: string;
  symbols: string[];
  period?: ComparePeriod;
}

// 비교 세트 수정 요청
export interface UpdateComparisonSetRequest {
  name?: string;
  symbols?: string[];
  period?: ComparePeriod;
}

// 지수 정보
export interface IndexInfo {
  code: string;       // 지수코드 (예: KOSPI, KOSDAQ)
  name: string;       // 지수명
  nameEn?: string;    // 영문명
  market?: string;    // 시장 구분
}

// 기간별 데이터 개수 (영업일 기준)
export const PERIOD_LIMITS: Record<ComparePeriod, number> = {
  '1M': 22,   // 약 1개월 영업일
  '3M': 65,   // 약 3개월 영업일
  '6M': 130,  // 약 6개월 영업일
  '1Y': 252,  // 약 1년 영업일
  '2Y': 500,  // 약 2년 영업일
};

// 기간 옵션 (UI용)
export const PERIOD_OPTIONS: { value: ComparePeriod; label: string }[] = [
  { value: '1M', label: '1개월' },
  { value: '3M', label: '3개월' },
  { value: '6M', label: '6개월' },
  { value: '1Y', label: '1년' },
  { value: '2Y', label: '2년' },
];

// 차트 색상 팔레트 (최대 10개)
export const COMPARISON_COLORS = [
  '#2196F3', // Blue
  '#F44336', // Red
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63', // Pink
  '#3F51B5', // Indigo
];

// 최대 비교 가능 종목 수
export const MAX_COMPARISON_ITEMS = 10;

// 최대 저장 가능 세트 수
export const MAX_COMPARISON_SETS = 10;

// 지원하는 지수 목록
export const SUPPORTED_INDICES: IndexInfo[] = [
  { code: 'KOSPI', name: '코스피', nameEn: 'KOSPI', market: 'KRX' },
  { code: 'KOSDAQ', name: '코스닥', nameEn: 'KOSDAQ', market: 'KRX' },
  { code: 'KS200', name: '코스피200', nameEn: 'KOSPI 200', market: 'KRX' },
  { code: 'KQ150', name: '코스닥150', nameEn: 'KOSDAQ 150', market: 'KRX' },
];

// 지수 코드인지 확인
export function isIndexCode(code: string): boolean {
  return SUPPORTED_INDICES.some((idx) => idx.code === code);
}

// 색상 가져오기
export function getComparisonColor(index: number): string {
  return COMPARISON_COLORS[index % COMPARISON_COLORS.length];
}

// 유효한 기간인지 확인
export function isValidComparePeriod(period: string): period is ComparePeriod {
  return Object.keys(PERIOD_LIMITS).includes(period);
}

// 안전하게 기간 변환 (유효하지 않으면 기본값 반환)
export function toComparePeriod(period: string, defaultPeriod: ComparePeriod = '6M'): ComparePeriod {
  return isValidComparePeriod(period) ? period : defaultPeriod;
}
