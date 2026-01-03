/**
 * API 데이터 캐시 유틸리티
 * - 메모리 캐시: Quote, StockInfo (30초 TTL)
 * - 파일 캐시: OHLCV (장 마감 후 갱신)
 */

import * as fs from 'fs';
import * as path from 'path';

// 캐시 설정
const MEMORY_CACHE_TTL = 30 * 1000; // 30초
const OHLCV_CACHE_DIR = path.join(process.cwd(), '.cache', 'ohlcv');

// 메모리 캐시 저장소
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * 메모리 캐시 조회
 */
export function getFromMemory<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() >= entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * 메모리 캐시 저장
 */
export function setToMemory<T>(key: string, data: T, ttl: number = MEMORY_CACHE_TTL): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * 메모리 캐시 삭제
 */
export function deleteFromMemory(key: string): void {
  memoryCache.delete(key);
}

/**
 * 메모리 캐시 전체 삭제
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
}

/**
 * 메모리 캐시 통계
 */
export function getMemoryCacheStats(): { size: number; keys: string[] } {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}

// OHLCV 파일 캐시
/**
 * OHLCV 캐시 디렉토리 확보
 */
function ensureOHLCVCacheDir(): void {
  if (!fs.existsSync(OHLCV_CACHE_DIR)) {
    fs.mkdirSync(OHLCV_CACHE_DIR, { recursive: true });
  }
}

/**
 * OHLCV 캐시 파일 경로
 */
function getOHLCVCachePath(symbol: string, timeFrame: string): string {
  return path.join(OHLCV_CACHE_DIR, `${symbol}_${timeFrame}.json`);
}

/**
 * OHLCV 캐시 유효성 검사
 * - 일봉: 당일 장 마감(15:30) 이후 데이터면 유효
 * - 주봉/월봉: 더 긴 유효기간
 */
function isOHLCVCacheValid(cachePath: string, timeFrame: string): boolean {
  try {
    if (!fs.existsSync(cachePath)) return false;

    const stat = fs.statSync(cachePath);
    const cacheTime = stat.mtime.getTime();
    const now = Date.now();

    // 캐시 유효 시간 (ms)
    const validDuration: Record<string, number> = {
      'D': 4 * 60 * 60 * 1000,   // 일봉: 4시간
      'W': 24 * 60 * 60 * 1000,  // 주봉: 24시간
      'M': 24 * 60 * 60 * 1000,  // 월봉: 24시간
    };

    const ttl = validDuration[timeFrame] || validDuration['D'];
    return (now - cacheTime) < ttl;
  } catch {
    return false;
  }
}

/**
 * OHLCV 캐시 조회
 */
export function getOHLCVFromCache<T>(symbol: string, timeFrame: string): T | null {
  const cachePath = getOHLCVCachePath(symbol, timeFrame);

  if (!isOHLCVCacheValid(cachePath, timeFrame)) {
    return null;
  }

  try {
    const content = fs.readFileSync(cachePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * OHLCV 캐시 저장
 */
export function setOHLCVToCache<T>(symbol: string, timeFrame: string, data: T): void {
  try {
    ensureOHLCVCacheDir();
    const cachePath = getOHLCVCachePath(symbol, timeFrame);
    fs.writeFileSync(cachePath, JSON.stringify(data));
  } catch (error) {
    console.warn('[Cache] OHLCV 캐시 저장 실패:', error);
  }
}

/**
 * OHLCV 캐시 삭제
 */
export function clearOHLCVCache(): void {
  try {
    if (fs.existsSync(OHLCV_CACHE_DIR)) {
      const files = fs.readdirSync(OHLCV_CACHE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(OHLCV_CACHE_DIR, file));
      }
    }
  } catch (error) {
    console.warn('[Cache] OHLCV 캐시 삭제 실패:', error);
  }
}

// 캐시 TTL 상수
export const CACHE_TTL = {
  QUOTE: 30 * 1000, // 30초
  STOCK_INFO: 5 * 60 * 1000, // 5분
  RANKING: 60 * 1000, // 1분
  LEADER_STOCKS: 30 * 1000, // 30초
};

// 캐시 키 생성 헬퍼
export const CacheKeys = {
  stockInfo: (symbol: string) => `stockInfo:${symbol}`,
  quote: (symbol: string) => `quote:${symbol}`,
  quotes: (symbols: string[]) => `quotes:${symbols.sort().join(',')}`,
  allStocks: () => 'allStocks',
  sectorSummary: (code: string) => `sectorSummary:${code}`,
  allSectorSummaries: () => 'allSectorSummaries',
  // 순위 데이터 캐시 키
  ranking: (type: string, market: string) => `ranking:${type}:${market}`,
  allRankings: (market: string) => `allRankings:${market}`,
  leaderStocks: (market: string) => `leaderStocks:${market}`,
};
