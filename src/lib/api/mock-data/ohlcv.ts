import type { OHLCV, TimeFrame } from '@/types';

/** 시드 기반 난수 생성기 (일관된 데이터 생성) */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/** 종목별 기준가 */
const BASE_PRICES: Record<string, number> = {
  '005930': 72000, // 삼성전자
  '000660': 135000, // SK하이닉스
  '373220': 420000, // LG에너지솔루션
  '207940': 780000, // 삼성바이오로직스
  '005380': 185000, // 현대차
  '006400': 450000, // 삼성SDI
  '051910': 380000, // LG화학
  '035420': 195000, // NAVER
  '000270': 95000, // 기아
  '035720': 42000, // 카카오
  '247540': 95000, // 에코프로비엠
  '086520': 75000, // 에코프로
  '028300': 55000, // HLB
  '323410': 28000, // 카카오뱅크
  '352820': 235000, // 하이브
};

/** TimeFrame별 밀리초 */
const TIME_FRAME_MS: Record<TimeFrame, number> = {
  D: 24 * 60 * 60 * 1000,
  W: 7 * 24 * 60 * 60 * 1000,
  M: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Mock OHLCV 데이터 생성
 */
export function generateOHLCV(
  symbol: string,
  timeFrame: TimeFrame,
  limit: number = 100
): OHLCV[] {
  const basePrice = BASE_PRICES[symbol] || 50000;
  const seed = parseInt(symbol, 10) || 12345;
  const random = seededRandom(seed);

  const data: OHLCV[] = [];
  const now = Date.now();
  const interval = TIME_FRAME_MS[timeFrame];

  let price = basePrice;

  for (let i = limit - 1; i >= 0; i--) {
    const time = Math.floor((now - i * interval) / 1000);

    // 랜덤 변동률 (-3% ~ +3%)
    const changePercent = (random() - 0.5) * 0.06;
    price = price * (1 + changePercent);

    // OHLC 생성
    const volatility = price * 0.02 * random();
    const open = price + (random() - 0.5) * volatility;
    const close = price + (random() - 0.5) * volatility;
    const high = Math.max(open, close) + random() * volatility;
    const low = Math.min(open, close) - random() * volatility;

    // 거래량 (10만 ~ 1000만)
    const volume = Math.floor(100000 + random() * 9900000);

    data.push({
      time,
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    });
  }

  return data;
}

/** 최신 가격 가져오기 */
export function getLatestPrice(symbol: string): number {
  const ohlcv = generateOHLCV(symbol, 'D', 1);
  return ohlcv[0]?.close || BASE_PRICES[symbol] || 50000;
}
