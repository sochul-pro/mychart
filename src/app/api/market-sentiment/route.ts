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

// 지수 백오프로 fetch 재시도 (429 에러 대응)
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // 429 에러 시 백오프 후 재시도
      if (response.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1초, 2초, 4초
        console.log(`[Retry] 429 error, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // 네트워크 에러 시에도 백오프 후 재시도
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Retry] Network error, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
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

// 네이버 금융에서 한국 시장 지수 가져오기 (KOSPI, KOSDAQ)
async function fetchNaverIndex(indexCode: string, name: string): Promise<IndexData | null> {
  const cacheKey = `naver_index_${indexCode}`;
  const cached = getFromCache<IndexData>(cacheKey);
  if (cached) {
    console.log(`[Cache] ${name} hit`);
    return cached;
  }

  try {
    // 기본 정보 API
    const basicResponse = await fetch(
      `https://m.stock.naver.com/api/index/${indexCode}/basic`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
        },
        cache: 'no-store',
      }
    );

    if (!basicResponse.ok) {
      console.error(`Naver ${name} basic API error:`, basicResponse.status);
      return null;
    }

    const basicData = await basicResponse.json();

    // 차트 데이터 API (30일)
    const priceResponse = await fetch(
      `https://m.stock.naver.com/api/index/${indexCode}/price?pageSize=30&page=1`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
        },
        cache: 'no-store',
      }
    );

    let history: number[] = [];
    if (priceResponse.ok) {
      const priceData = await priceResponse.json();
      // 가격 데이터에서 종가 추출 (최신순 -> 과거순으로 정렬)
      history = (priceData || [])
        .map((item: { closePrice?: string }) => parseFloat((item.closePrice || '0').replace(/,/g, '')))
        .filter((price: number) => price > 0)
        .reverse();
    }

    const currentPrice = parseFloat((basicData.closePrice || '0').replace(/,/g, ''));
    const change = parseFloat((basicData.compareToPreviousClosePrice || '0').replace(/,/g, ''));
    const changePercent = parseFloat((basicData.fluctuationsRatio || '0').replace(/,/g, ''));

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
    const response = await fetchWithRetry(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1mo',
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
        },
        cache: 'no-store',
      },
      3 // 최대 3회 재시도
    );

    if (!response.ok) {
      console.error('Yahoo Finance VIX API error:', response.status);
      return null;
    }

    const data = await response.json();
    const quote = data.chart?.result?.[0];

    if (!quote) {
      console.error('Invalid VIX data structure');
      return null;
    }

    const meta = quote.meta;
    const indicators = quote.indicators?.quote?.[0];

    // 30일 종가 히스토리
    const history: number[] = (indicators?.close || [])
      .filter((price: number | null) => price !== null)
      .map((price: number) => Number(price.toFixed(2)));

    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

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
    // KOSPI/KOSDAQ: 네이버 금융, VIX: Yahoo Finance
    const [kospi, kosdaq, fearGreed, vix] = await Promise.all([
      fetchNaverIndex('KOSPI', 'KOSPI'),
      fetchNaverIndex('KOSDAQ', 'KOSDAQ'),
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
