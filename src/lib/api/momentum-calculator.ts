import type { ThemeStock, MomentumWeights } from '@/types';
import { DEFAULT_MOMENTUM_WEIGHTS } from '@/types';

/**
 * 정규화 함수 (Min-Max Normalization)
 * 값을 0-100 범위로 정규화
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50; // 모든 값이 같으면 중간값
  return ((value - min) / (max - min)) * 100;
}

/**
 * 배열에서 min, max 값 추출
 */
function getMinMax(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * 모멘텀 점수 계산
 *
 * 각 지표를 정규화(0-100)한 후 가중 평균으로 최종 점수 산출
 *
 * @param stocks 테마 내 종목 목록
 * @param weights 가중치 설정 (기본값 사용 가능)
 * @returns 모멘텀 점수가 계산된 종목 목록 (점수 내림차순 정렬)
 */
export function calculateMomentumScores(
  stocks: ThemeStock[],
  weights: MomentumWeights = DEFAULT_MOMENTUM_WEIGHTS
): ThemeStock[] {
  if (stocks.length === 0) return [];

  // 각 지표의 min, max 계산
  const changePercents = stocks.map((s) => s.changePercent);
  const volumes = stocks.map((s) => s.volume);
  const tradingValues = stocks.map((s) => s.tradingValue);
  const marketCaps = stocks.map((s) => s.marketCap);

  const changeRange = getMinMax(changePercents);
  const volumeRange = getMinMax(volumes);
  const tradingRange = getMinMax(tradingValues);
  const marketCapRange = getMinMax(marketCaps);

  // 각 종목의 모멘텀 점수 계산
  const scoredStocks = stocks.map((stock) => {
    // 각 지표 정규화 (0-100)
    const normalizedChange = normalize(stock.changePercent, changeRange.min, changeRange.max);
    const normalizedVolume = normalize(stock.volume, volumeRange.min, volumeRange.max);
    const normalizedTrading = normalize(stock.tradingValue, tradingRange.min, tradingRange.max);
    const normalizedMarketCap = normalize(stock.marketCap, marketCapRange.min, marketCapRange.max);

    // 가중 평균 점수 계산
    const momentumScore =
      normalizedChange * weights.changePercent +
      normalizedVolume * weights.volume +
      normalizedTrading * weights.tradingValue +
      normalizedMarketCap * weights.marketCap;

    return {
      ...stock,
      momentumScore: Number(momentumScore.toFixed(2)),
    };
  });

  // 모멘텀 점수 내림차순 정렬
  return scoredStocks.sort((a, b) => (b.momentumScore || 0) - (a.momentumScore || 0));
}

/**
 * 상위 N개 종목 선정
 *
 * @param stocks 테마 내 종목 목록
 * @param topN 선정할 종목 수 (기본값: 5)
 * @param weights 가중치 설정
 * @returns 모멘텀 점수 상위 N개 종목
 */
export function getTopMomentumStocks(
  stocks: ThemeStock[],
  topN: number = 5,
  weights: MomentumWeights = DEFAULT_MOMENTUM_WEIGHTS
): ThemeStock[] {
  const scoredStocks = calculateMomentumScores(stocks, weights);
  return scoredStocks.slice(0, topN);
}

/**
 * ThemeStock을 LeadingStock 형식으로 변환
 */
export function toLeadingStocks(stocks: ThemeStock[]): {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}[] {
  return stocks.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    changePercent: stock.changePercent,
  }));
}
