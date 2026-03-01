/**
 * 상대 수익률 비교 차트용 정규화 유틸리티
 */

import type { OHLCV } from '@/types';
import type { NormalizedDataPoint, NormalizedOHLCPoint, ComparePeriod } from '@/types/comparison';
import { PERIOD_LIMITS } from '@/types/comparison';

/**
 * OHLCV 데이터를 수익률(%)로 정규화
 * 첫 번째 데이터 포인트 = 0%, 이후 상대 변화율
 *
 * @param data - OHLCV 데이터 배열 (시간순 정렬)
 * @param period - 기간 (데이터 개수 제한용)
 * @returns 정규화된 데이터 포인트 배열
 */
export function normalizeToReturn(
  data: OHLCV[],
  period: ComparePeriod
): NormalizedDataPoint[] {
  if (data.length === 0) return [];

  // 기간에 맞게 데이터 자르기 (최근 N개)
  const limit = PERIOD_LIMITS[period];
  const slicedData = data.slice(-limit);

  if (slicedData.length === 0) return [];

  // 첫 번째 데이터의 종가를 기준으로 수익률 계산
  const basePrice = slicedData[0].close;

  if (basePrice === 0) return [];

  return slicedData.map((d) => ({
    // Lightweight Charts는 초 단위 timestamp 사용
    time: Math.floor(d.time / 1000),
    value: ((d.close - basePrice) / basePrice) * 100,
  }));
}

/**
 * OHLCV 데이터를 OHLC 수익률(%)로 정규화 (봉차트용)
 * 첫 번째 데이터의 종가를 기준으로 OHLC 모두 수익률 계산
 *
 * @param data - OHLCV 데이터 배열 (시간순 정렬)
 * @param period - 기간 (데이터 개수 제한용)
 * @returns 정규화된 OHLC 데이터 포인트 배열
 */
export function normalizeOHLCToReturn(
  data: OHLCV[],
  period: ComparePeriod
): NormalizedOHLCPoint[] {
  if (data.length === 0) return [];

  // 기간에 맞게 데이터 자르기 (최근 N개)
  const limit = PERIOD_LIMITS[period];
  const slicedData = data.slice(-limit);

  if (slicedData.length === 0) return [];

  // 첫 번째 데이터의 종가를 기준으로 수익률 계산
  const basePrice = slicedData[0].close;

  if (basePrice === 0) return [];

  return slicedData.map((d) => ({
    time: Math.floor(d.time / 1000),
    open: ((d.open - basePrice) / basePrice) * 100,
    high: ((d.high - basePrice) / basePrice) * 100,
    low: ((d.low - basePrice) / basePrice) * 100,
    close: ((d.close - basePrice) / basePrice) * 100,
  }));
}

/**
 * 현재 수익률 계산 (마지막 데이터 기준)
 *
 * @param data - OHLCV 데이터 배열
 * @param period - 기간
 * @returns 현재 수익률 (%)
 */
export function calculateCurrentReturn(
  data: OHLCV[],
  period: ComparePeriod
): number {
  if (data.length === 0) return 0;

  const limit = PERIOD_LIMITS[period];
  const slicedData = data.slice(-limit);

  if (slicedData.length === 0) return 0;

  const basePrice = slicedData[0].close;
  const currentPrice = slicedData[slicedData.length - 1].close;

  if (basePrice === 0) return 0;

  return ((currentPrice - basePrice) / basePrice) * 100;
}

/**
 * 여러 종목의 OHLCV 데이터를 동일 시간축으로 정렬
 * 일부 종목이 상장폐지, 거래정지 등으로 데이터가 없을 수 있음
 *
 * @param datasets - 종목별 정규화된 데이터 Map
 * @returns 시간축 정렬된 데이터 Map
 */
export function alignTimeSeries(
  datasets: Map<string, NormalizedDataPoint[]>
): Map<string, NormalizedDataPoint[]> {
  // 모든 타임스탬프 수집
  const allTimes = new Set<number>();
  datasets.forEach((data) => {
    data.forEach((d) => allTimes.add(d.time));
  });

  const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);

  // 각 종목별로 빈 타임스탬프 채우기 (이전 값으로)
  const aligned = new Map<string, NormalizedDataPoint[]>();

  datasets.forEach((data, code) => {
    const timeMap = new Map(data.map((d) => [d.time, d.value]));
    let lastValue = 0;

    const filledData = sortedTimes.map((time) => {
      const value = timeMap.get(time);
      if (value !== undefined) {
        lastValue = value;
        return { time, value };
      }
      // 데이터가 없는 시점은 이전 값으로 채움
      return { time, value: lastValue };
    });

    aligned.set(code, filledData);
  });

  return aligned;
}

/**
 * 기간에 따른 시작 날짜 계산
 *
 * @param period - 기간
 * @returns 시작 날짜 (YYYY-MM-DD)
 */
export function getStartDateForPeriod(period: ComparePeriod): string {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '1M':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case '3M':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case '6M':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case '1Y':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case '2Y':
      startDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  }

  return startDate.toISOString().split('T')[0];
}

/**
 * 오늘 날짜 반환
 *
 * @returns 오늘 날짜 (YYYY-MM-DD)
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 수익률 포맷팅
 *
 * @param value - 수익률 (%)
 * @param decimals - 소수점 자릿수
 * @returns 포맷된 문자열 (예: "+15.3%", "-5.2%")
 */
export function formatReturn(value: number, decimals: number = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}
