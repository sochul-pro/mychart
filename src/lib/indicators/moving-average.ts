import type { OHLCV } from '@/types';

/**
 * SMA (Simple Moving Average) 단순 이동평균
 * @param data OHLCV 데이터 배열
 * @param period 기간
 * @returns 이동평균 값 배열 (첫 period-1 개는 null)
 */
export function sma(data: OHLCV[], period: number): (number | null)[] {
  if (period <= 0 || data.length === 0) return [];

  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push(sum / period);
  }

  return result;
}

/**
 * EMA (Exponential Moving Average) 지수 이동평균
 * @param data OHLCV 데이터 배열
 * @param period 기간
 * @returns 이동평균 값 배열 (첫 period-1 개는 null)
 */
export function ema(data: OHLCV[], period: number): (number | null)[] {
  if (period <= 0 || data.length === 0) return [];

  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  // 첫 번째 EMA는 SMA로 시작
  let prevEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    if (prevEma === null) {
      // 첫 EMA는 SMA로 계산
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      prevEma = sum / period;
    } else {
      // EMA = 오늘 종가 * multiplier + 어제 EMA * (1 - multiplier)
      prevEma = data[i].close * multiplier + prevEma * (1 - multiplier);
    }

    result.push(prevEma);
  }

  return result;
}

/**
 * 종가 배열에서 SMA 계산 (내부용)
 */
export function smaFromValues(values: number[], period: number): (number | null)[] {
  if (period <= 0 || values.length === 0) return [];

  const result: (number | null)[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += values[i - j];
    }
    result.push(sum / period);
  }

  return result;
}

/**
 * 종가 배열에서 EMA 계산 (내부용)
 */
export function emaFromValues(values: number[], period: number): (number | null)[] {
  if (period <= 0 || values.length === 0) return [];

  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    if (prevEma === null) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += values[i - j];
      }
      prevEma = sum / period;
    } else {
      prevEma = values[i] * multiplier + prevEma * (1 - multiplier);
    }

    result.push(prevEma);
  }

  return result;
}
