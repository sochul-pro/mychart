import type { OHLCV } from '@/types';

/**
 * RSI (Relative Strength Index) 상대강도지수
 * @param data OHLCV 데이터 배열
 * @param period 기간 (기본값: 14)
 * @returns RSI 값 배열 (0-100 사이, 첫 period 개는 null)
 */
export function rsi(data: OHLCV[], period: number = 14): (number | null)[] {
  if (period <= 0 || data.length <= period) return new Array(data.length).fill(null);

  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // 첫 번째 데이터는 변화가 없음
  result.push(null);

  // 가격 변화 계산
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // 처음 period 개 데이터는 null
  for (let i = 0; i < period - 1; i++) {
    result.push(null);
  }

  // 첫 번째 평균 상승/하락 계산 (SMA)
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;

  // 첫 번째 RSI
  if (avgLoss === 0) {
    result.push(100);
  } else {
    const rs = avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  // 이후 RSI 계산 (Wilder's smoothing)
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}
