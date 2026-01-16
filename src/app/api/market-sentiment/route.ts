import { NextResponse } from 'next/server';

// 메모리 캐시 (5분 TTL)
const CACHE_TTL = 5 * 60 * 1000; // 5분
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache: Map<string, CacheEntry<unknown>> = new Map();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setToCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface FearGreedData {
  score: number;
  rating: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  previous: number;
  weekAgo: number;
  monthAgo: number;
  yearAgo: number;
}

export interface VixData {
  value: number;
  change: number;
  changePercent: number;
  history: number[]; // 30일 종가 히스토리
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  history: number[]; // 30일 종가 히스토리
}

export interface MarketSentimentResponse {
  kospi: IndexData | null;
  kosdaq: IndexData | null;
  fearGreed: FearGreedData | null;
  vix: VixData | null;
  updatedAt: number;
}

// 랜덤 User-Agent 생성
function getRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 점수에 따른 등급 반환
function getRating(score: number): FearGreedData['rating'] {
  if (score <= 25) return 'Extreme Fear';
  if (score <= 45) return 'Fear';
  if (score <= 55) return 'Neutral';
  if (score <= 75) return 'Greed';
  return 'Extreme Greed';
}

// CNN Fear & Greed Index 가져오기
async function fetchFearGreedIndex(): Promise<FearGreedData | null> {
  const cacheKey = 'fearGreed';
  const cached = getFromCache<FearGreedData>(cacheKey);
  if (cached) {
    console.log('[Cache] Fear & Greed Index hit');
    return cached;
  }

  try {
    const response = await fetch(
      'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error('CNN Fear & Greed API error:', response.status);
      return null;
    }

    const data = await response.json();
    const fgData = data.fear_and_greed;

    if (!fgData) {
      console.error('Invalid Fear & Greed data structure');
      return null;
    }

    const result: FearGreedData = {
      score: Math.round(fgData.score),
      rating: getRating(fgData.score),
      previous: Math.round(fgData.previous_close || fgData.score),
      weekAgo: Math.round(fgData.previous_1_week || fgData.score),
      monthAgo: Math.round(fgData.previous_1_month || fgData.score),
      yearAgo: Math.round(fgData.previous_1_year || fgData.score),
    };

    setToCache(cacheKey, result);
    console.log('[Cache] Fear & Greed Index stored');
    return result;
  } catch (error) {
    console.error('Failed to fetch Fear & Greed Index:', error);
    return null;
  }
}

// Yahoo Finance에서 시장 지수 가져오기 (30일 히스토리 포함)
async function fetchMarketIndex(symbol: string, name: string): Promise<IndexData | null> {
  const cacheKey = `index_${symbol}`;
  const cached = getFromCache<IndexData>(cacheKey);
  if (cached) {
    console.log(`[Cache] ${name} hit`);
    return cached;
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error(`Yahoo Finance ${name} API error:`, response.status);
      return null;
    }

    const data = await response.json();
    const chartResult = data.chart?.result?.[0];

    if (!chartResult) {
      console.error(`Invalid ${name} data structure`);
      return null;
    }

    const meta = chartResult.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // 종가 히스토리 추출
    const closePrices = chartResult.indicators?.quote?.[0]?.close || [];
    const history = closePrices
      .filter((price: number | null) => price !== null)
      .map((price: number) => Number(price.toFixed(2)));

    const result: IndexData = {
      name,
      value: Number(currentPrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      history,
    };

    setToCache(cacheKey, result);
    console.log(`[Cache] ${name} stored`);
    return result;
  } catch (error) {
    console.error(`Failed to fetch ${name}:`, error);
    return null;
  }
}

// Yahoo Finance에서 VIX 지수 가져오기 (30일 히스토리 포함)
async function fetchVixIndex(): Promise<VixData | null> {
  const cacheKey = 'vix';
  const cached = getFromCache<VixData>(cacheKey);
  if (cached) {
    console.log('[Cache] VIX hit');
    return cached;
  }

  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1mo',
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error('Yahoo Finance VIX API error:', response.status);
      return null;
    }

    const data = await response.json();
    const chartResult = data.chart?.result?.[0];

    if (!chartResult) {
      console.error('Invalid VIX data structure');
      return null;
    }

    const meta = chartResult.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // 종가 히스토리 추출
    const closePrices = chartResult.indicators?.quote?.[0]?.close || [];
    const history = closePrices
      .filter((price: number | null) => price !== null)
      .map((price: number) => Number(price.toFixed(2)));

    const result: VixData = {
      value: Number(currentPrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      history,
    };

    setToCache(cacheKey, result);
    console.log('[Cache] VIX stored');
    return result;
  } catch (error) {
    console.error('Failed to fetch VIX Index:', error);
    return null;
  }
}

// GET /api/market-sentiment - 시장 심리 지표 조회
export async function GET() {
  try {
    // 병렬로 모든 API 호출
    const [kospi, kosdaq, fearGreed, vix] = await Promise.all([
      fetchMarketIndex('^KS11', 'KOSPI'),
      fetchMarketIndex('^KQ11', 'KOSDAQ'),
      fetchFearGreedIndex(),
      fetchVixIndex(),
    ]);

    const response: MarketSentimentResponse = {
      kospi,
      kosdaq,
      fearGreed,
      vix,
      updatedAt: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Market sentiment error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market sentiment' },
      { status: 500 }
    );
  }
}
