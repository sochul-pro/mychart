import type { OHLCV } from '@/types';

/**
 * OBV (On Balance Volume) 거래량 균형
 * @param data OHLCV 데이터 배열
 * @returns OBV 값 배열
 */
export function obv(data: OHLCV[]): number[] {
  if (data.length === 0) return [];

  const result: number[] = [0]; // 첫 번째는 0으로 시작

  for (let i = 1; i < data.length; i++) {
    const prevOBV = result[i - 1];
    const close = data[i].close;
    const prevClose = data[i - 1].close;
    const volume = data[i].volume;

    if (close > prevClose) {
      // 상승: +volume
      result.push(prevOBV + volume);
    } else if (close < prevClose) {
      // 하락: -volume
      result.push(prevOBV - volume);
    } else {
      // 보합: 유지
      result.push(prevOBV);
    }
  }

  return result;
}
