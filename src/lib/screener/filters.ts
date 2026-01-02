import type { Quote, StockInfo, OHLCV } from '@/types';
import type { ScreenerSignal, ScreenerResult, ScreenerFilter } from '@/types';

// 거래량 급증 필터
export function filterByVolumeSurge(
  quote: Quote,
  avgVolume: number,
  threshold: number = 2.0
): boolean {
  if (avgVolume <= 0) return false;
  return quote.volume / avgVolume >= threshold;
}

// 상승률 필터
export function filterByPriceChange(
  quote: Quote,
  minChange: number = 0,
  maxChange: number = 30
): boolean {
  return quote.changePercent >= minChange && quote.changePercent <= maxChange;
}

// 신고가 필터
export function filterByNewHigh(
  quote: Quote,
  high52w: number
): boolean {
  return quote.price >= high52w;
}

// 거래량 비율 계산
export function calculateVolumeRatio(
  currentVolume: number,
  avgVolume: number
): number {
  if (avgVolume <= 0) return 0;
  return Math.round((currentVolume / avgVolume) * 100) / 100;
}

// 52주 신고가 계산
export function calculate52WeekHigh(ohlcvData: OHLCV[]): number {
  if (ohlcvData.length === 0) return 0;
  return Math.max(...ohlcvData.map(d => d.high));
}

// 평균 거래량 계산 (20일)
export function calculateAvgVolume(ohlcvData: OHLCV[], days: number = 20): number {
  if (ohlcvData.length === 0) return 0;
  const recentData = ohlcvData.slice(-days);
  const totalVolume = recentData.reduce((sum, d) => sum + d.volume, 0);
  return Math.round(totalVolume / recentData.length);
}

// 스크리너 신호 생성
export function generateSignals(
  quote: Quote,
  volumeRatio: number,
  isNewHigh: boolean
): ScreenerSignal[] {
  const signals: ScreenerSignal[] = [];

  // 거래량 급증 신호
  if (volumeRatio >= 5) {
    signals.push({
      type: 'volume',
      message: `거래량 ${volumeRatio.toFixed(1)}배 급증`,
      strength: 'strong',
    });
  } else if (volumeRatio >= 3) {
    signals.push({
      type: 'volume',
      message: `거래량 ${volumeRatio.toFixed(1)}배 증가`,
      strength: 'medium',
    });
  } else if (volumeRatio >= 2) {
    signals.push({
      type: 'volume',
      message: `거래량 ${volumeRatio.toFixed(1)}배`,
      strength: 'weak',
    });
  }

  // 가격 상승 신호
  if (quote.changePercent >= 10) {
    signals.push({
      type: 'price',
      message: `${quote.changePercent.toFixed(1)}% 급등`,
      strength: 'strong',
    });
  } else if (quote.changePercent >= 5) {
    signals.push({
      type: 'price',
      message: `${quote.changePercent.toFixed(1)}% 상승`,
      strength: 'medium',
    });
  } else if (quote.changePercent >= 3) {
    signals.push({
      type: 'price',
      message: `${quote.changePercent.toFixed(1)}% 상승`,
      strength: 'weak',
    });
  }

  // 신고가 신호
  if (isNewHigh) {
    signals.push({
      type: 'high',
      message: '52주 신고가',
      strength: 'strong',
    });
  }

  return signals;
}

// 종합 점수 계산 (0-100)
export function calculateScore(
  quote: Quote,
  volumeRatio: number,
  isNewHigh: boolean,
  priceChange52w: number
): number {
  let score = 0;

  // 거래량 점수 (최대 30점)
  if (volumeRatio >= 5) score += 30;
  else if (volumeRatio >= 3) score += 20;
  else if (volumeRatio >= 2) score += 15;
  else if (volumeRatio >= 1.5) score += 10;

  // 등락률 점수 (최대 30점)
  if (quote.changePercent >= 10) score += 30;
  else if (quote.changePercent >= 5) score += 20;
  else if (quote.changePercent >= 3) score += 15;
  else if (quote.changePercent >= 1) score += 10;
  else if (quote.changePercent < 0) score -= 10;

  // 신고가 점수 (20점)
  if (isNewHigh) score += 20;

  // 52주 성과 점수 (최대 20점)
  if (priceChange52w >= 100) score += 20;
  else if (priceChange52w >= 50) score += 15;
  else if (priceChange52w >= 20) score += 10;
  else if (priceChange52w >= 0) score += 5;

  return Math.max(0, Math.min(100, score));
}

// 스크리너 결과 생성
export function createScreenerResult(
  stock: StockInfo,
  quote: Quote,
  ohlcvData: OHLCV[]
): ScreenerResult {
  const avgVolume = calculateAvgVolume(ohlcvData, 20);
  const volumeRatio = calculateVolumeRatio(quote.volume, avgVolume);
  const high52w = calculate52WeekHigh(ohlcvData);
  const isNewHigh = quote.price >= high52w;

  // 52주 전 가격 대비 변화율
  const price52wAgo = ohlcvData.length > 0 ? ohlcvData[0].close : quote.price;
  const priceChange52w = ((quote.price - price52wAgo) / price52wAgo) * 100;

  const score = calculateScore(quote, volumeRatio, isNewHigh, priceChange52w);
  const signals = generateSignals(quote, volumeRatio, isNewHigh);

  return {
    stock,
    quote,
    score,
    volumeRatio,
    isNewHigh,
    priceChange52w,
    signals,
  };
}

// 필터 적용
export function applyFilters(
  results: ScreenerResult[],
  filter: ScreenerFilter
): ScreenerResult[] {
  return results.filter(result => {
    // 마켓 필터
    if (filter.market && filter.market !== 'all') {
      if (result.stock.market !== filter.market) return false;
    }

    // 섹터 필터
    if (filter.sector && result.stock.sector !== filter.sector) {
      return false;
    }

    // 거래량 비율 필터
    if (filter.minVolumeRatio && result.volumeRatio < filter.minVolumeRatio) {
      return false;
    }

    // 등락률 필터
    if (filter.minChangePercent !== undefined) {
      if (result.quote.changePercent < filter.minChangePercent) return false;
    }
    if (filter.maxChangePercent !== undefined) {
      if (result.quote.changePercent > filter.maxChangePercent) return false;
    }

    // 신고가만 필터
    if (filter.onlyNewHigh && !result.isNewHigh) {
      return false;
    }

    return true;
  });
}

// 정렬
export function sortResults(
  results: ScreenerResult[],
  sortBy: 'score' | 'change_percent' | 'volume_ratio' = 'score'
): ScreenerResult[] {
  return [...results].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'change_percent':
        return b.quote.changePercent - a.quote.changePercent;
      case 'volume_ratio':
        return b.volumeRatio - a.volumeRatio;
      default:
        return b.score - a.score;
    }
  });
}
