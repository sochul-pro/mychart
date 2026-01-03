import type { OHLCV, StockInfo, Quote, Orderbook, TimeFrame, SectorCode, Sector, SectorSummary, HotStock } from '@/types';
import { SECTORS, SECTOR_CODES } from '@/types/sector';
import type { StockDataProvider } from './stock-provider';
import { getStocksBySector as getStockSymbolsBySector, getAllMappedSymbols } from './sector-master';
import {
  getFromMemory,
  setToMemory,
  getOHLCVFromCache,
  setOHLCVToCache,
  CacheKeys,
} from './cache';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 한국투자증권 OpenAPI 설정
 */
interface KISConfig {
  appKey: string;
  appSecret: string;
  accountNo: string;
  isProduction: boolean;
}

/**
 * 한국투자증권 토큰 정보
 */
interface KISToken {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
}

// 토큰 캐시 파일 경로
const TOKEN_CACHE_FILE = path.join(process.cwd(), '.kis-token.json');

/**
 * 한국투자증권 OpenAPI Provider
 * 실제 시세 데이터 조회
 */
export class KISProvider implements StockDataProvider {
  readonly name = 'KISProvider';

  private config: KISConfig;
  private token: KISToken | null = null;
  private baseUrl: string;
  private tokenPromise: Promise<void> | null = null; // 토큰 발급 중복 방지

  constructor(config: KISConfig) {
    this.config = config;
    this.baseUrl = config.isProduction
      ? 'https://openapi.koreainvestment.com:9443'
      : 'https://openapivts.koreainvestment.com:29443';

    // 시작 시 캐시된 토큰 로드
    this.loadCachedToken();
  }

  /**
   * 캐시된 토큰 로드
   */
  private loadCachedToken(): void {
    try {
      if (fs.existsSync(TOKEN_CACHE_FILE)) {
        const cached = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8'));
        // 만료 5분 전까지 유효하면 사용
        if (cached.expiresAt && Date.now() < cached.expiresAt - 5 * 60 * 1000) {
          this.token = cached;
          console.log('[KIS] 캐시된 토큰 로드 완료');
        }
      }
    } catch (error) {
      console.warn('[KIS] 토큰 캐시 로드 실패:', error);
    }
  }

  /**
   * 토큰 캐시 저장
   */
  private saveCachedToken(): void {
    try {
      fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(this.token, null, 2));
      console.log('[KIS] 토큰 캐시 저장 완료');
    } catch (error) {
      console.warn('[KIS] 토큰 캐시 저장 실패:', error);
    }
  }

  /**
   * OAuth 토큰 발급
   */
  async authenticate(): Promise<void> {
    console.log('[KIS] 토큰 발급 요청...');

    const response = await fetch(`${this.baseUrl}/oauth2/tokenP`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: this.config.appKey,
        appsecret: this.config.appSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[KIS] 토큰 발급 실패:', response.status, errorText);
      throw new Error(`KIS 인증 실패: ${response.status}`);
    }

    const data = await response.json();
    this.token = {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000, // 1분 여유
    };

    // 토큰 캐시 저장
    this.saveCachedToken();
    console.log('[KIS] 토큰 발급 완료, 만료:', new Date(this.token.expiresAt).toLocaleString());
  }

  /**
   * 토큰 유효성 확인 및 갱신
   * 동시 요청 시 중복 발급 방지
   */
  private async ensureToken(): Promise<string> {
    // 토큰이 유효하면 바로 반환
    if (this.token && Date.now() < this.token.expiresAt) {
      return this.token.accessToken;
    }

    // 이미 토큰 발급 중이면 기다림
    if (this.tokenPromise) {
      await this.tokenPromise;
      return this.token!.accessToken;
    }

    // 토큰 발급 시작
    this.tokenPromise = this.authenticate();
    try {
      await this.tokenPromise;
    } finally {
      this.tokenPromise = null;
    }

    return this.token!.accessToken;
  }

  /**
   * API 요청 헬퍼
   */
  private async request<T>(
    path: string,
    params: Record<string, string> = {},
    trId: string
  ): Promise<T> {
    const token = await this.ensureToken();
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${path}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
        appkey: this.config.appKey,
        appsecret: this.config.appSecret,
        tr_id: trId,
        custtype: 'P',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[KIS] API 요청 실패 (${path}):`, response.status, errorBody);
      throw new Error(`KIS API 요청 실패: ${response.status} - ${errorBody}`);
    }

    return response.json();
  }

  /**
   * 종목 정보 조회 (캐시 적용)
   */
  async getStockInfo(symbol: string): Promise<StockInfo | null> {
    // 캐시 확인
    const cacheKey = CacheKeys.stockInfo(symbol);
    const cached = getFromMemory<StockInfo>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<{
        output: {
          pdno: string;
          prdt_name: string;
          mket_id_cd: string;
          scty_grp_id_cd: string;
        };
      }>(
        '/uapi/domestic-stock/v1/quotations/search-stock-info',
        {
          PDNO: symbol,
          PRDT_TYPE_CD: '300',
        },
        'CTPF1002R'
      );

      if (!data.output) return null;

      const result: StockInfo = {
        symbol: data.output.pdno,
        name: data.output.prdt_name,
        market: data.output.mket_id_cd === 'STK' ? 'KOSPI' : 'KOSDAQ',
        sector: data.output.scty_grp_id_cd,
      };

      // 캐시 저장 (종목 정보는 5분 TTL)
      setToMemory(cacheKey, result, 5 * 60 * 1000);
      return result;
    } catch (error) {
      console.error(`[KIS] getStockInfo(${symbol}) 실패:`, error);
      return null;
    }
  }

  /**
   * 종목 검색
   */
  async searchStocks(query: string): Promise<StockInfo[]> {
    // 한국투자증권 API는 직접 검색 기능이 제한적이므로
    // 전체 종목에서 필터링하는 방식 사용
    const allStocks = await this.getAllStocks();
    const lowerQuery = query.toLowerCase();
    return allStocks.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(lowerQuery) ||
        stock.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 전체 종목 목록
   * sector-master에 매핑된 종목들 반환
   * KIS API 제한: 초당 20건 → 5개씩 배치, 500ms 딜레이
   */
  async getAllStocks(): Promise<StockInfo[]> {
    const allSymbols = getAllMappedSymbols();
    const stocks: StockInfo[] = [];

    // Rate limiting 대응: 5개씩 배치, 500ms 딜레이
    const batchSize = 5;
    for (let i = 0; i < allSymbols.length; i += batchSize) {
      const batch = allSymbols.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((symbol) => this.getStockInfo(symbol))
      );
      stocks.push(...batchResults.filter((s): s is StockInfo => s !== null));

      // 배치 간 딜레이 (API rate limit 대응)
      if (i + batchSize < allSymbols.length) {
        await this.delay(500);
      }
    }

    return stocks;
  }

  /**
   * API 요청 딜레이
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * OHLCV 차트 데이터 조회 (파일 캐시 적용)
   */
  async getOHLCV(
    symbol: string,
    timeFrame: TimeFrame,
    limit: number = 100
  ): Promise<OHLCV[]> {
    // 파일 캐시 확인
    const cached = getOHLCVFromCache<OHLCV[]>(symbol, timeFrame);
    if (cached && cached.length >= limit) {
      return cached.slice(0, limit);
    }

    const periodMap: Record<TimeFrame, string> = {
      D: 'D',
      W: 'W',
      M: 'M',
    };

    // 날짜 범위 계산
    const endDate = new Date();
    const startDate = new Date();

    switch (timeFrame) {
      case 'D':
        startDate.setDate(startDate.getDate() - limit);
        break;
      case 'W':
        startDate.setDate(startDate.getDate() - limit * 7);
        break;
      case 'M':
        startDate.setMonth(startDate.getMonth() - limit);
        break;
    }

    const formatDate = (d: Date) =>
      d.toISOString().slice(0, 10).replace(/-/g, '');

    try {
      const data = await this.request<{
        output2: Array<{
          stck_bsop_date: string;
          stck_oprc: string;
          stck_hgpr: string;
          stck_lwpr: string;
          stck_clpr: string;
          acml_vol: string;
        }>;
      }>(
        '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
        {
          FID_COND_MRKT_DIV_CODE: 'J',
          FID_INPUT_ISCD: symbol,
          FID_INPUT_DATE_1: formatDate(startDate),
          FID_INPUT_DATE_2: formatDate(endDate),
          FID_PERIOD_DIV_CODE: periodMap[timeFrame],
          FID_ORG_ADJ_PRC: '0',
        },
        'FHKST03010100'
      );

      const result = (data.output2 || [])
        .map((item) => {
          const dateStr = item.stck_bsop_date;
          const date = new Date(
            parseInt(dateStr.slice(0, 4)),
            parseInt(dateStr.slice(4, 6)) - 1,
            parseInt(dateStr.slice(6, 8))
          );

          return {
            time: date.getTime(),
            open: parseInt(item.stck_oprc),
            high: parseInt(item.stck_hgpr),
            low: parseInt(item.stck_lwpr),
            close: parseInt(item.stck_clpr),
            volume: parseInt(item.acml_vol),
          };
        })
        .reverse()
        .slice(0, limit);

      // 파일 캐시 저장
      if (result.length > 0) {
        setOHLCVToCache(symbol, timeFrame, result);
      }

      return result;
    } catch (error) {
      console.error(`[KIS] getOHLCV(${symbol}) 실패:`, error);
      // 캐시된 데이터가 있으면 반환
      if (cached) return cached.slice(0, limit);
      return [];
    }
  }

  /**
   * 현재가 조회 (캐시 적용)
   */
  async getQuote(symbol: string): Promise<Quote | null> {
    // 캐시 확인 (30초 TTL)
    const cacheKey = CacheKeys.quote(symbol);
    const cached = getFromMemory<Quote>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<{
        output: {
          stck_prpr: string;
          prdy_vrss: string;
          prdy_ctrt: string;
          acml_vol: string;
          stck_hgpr: string;
          stck_lwpr: string;
          stck_oprc: string;
          stck_sdpr: string;
        };
      }>(
        '/uapi/domestic-stock/v1/quotations/inquire-price',
        {
          FID_COND_MRKT_DIV_CODE: 'J',
          FID_INPUT_ISCD: symbol,
        },
        'FHKST01010100'
      );

      if (!data.output) return null;

      const result: Quote = {
        symbol,
        price: parseInt(data.output.stck_prpr),
        change: parseInt(data.output.prdy_vrss),
        changePercent: parseFloat(data.output.prdy_ctrt),
        volume: parseInt(data.output.acml_vol),
        high: parseInt(data.output.stck_hgpr),
        low: parseInt(data.output.stck_lwpr),
        open: parseInt(data.output.stck_oprc),
        prevClose: parseInt(data.output.stck_sdpr),
        timestamp: Date.now(),
      };

      // 캐시 저장 (30초 TTL)
      setToMemory(cacheKey, result, 30 * 1000);
      return result;
    } catch (error) {
      console.error(`[KIS] getQuote(${symbol}) 실패:`, error);
      return null;
    }
  }

  /**
   * 여러 종목 현재가 조회
   * Rate limiting 대응: 배치 처리
   */
  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const quotes: Quote[] = [];
    const batchSize = 10;

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((symbol) => this.getQuote(symbol))
      );
      quotes.push(...batchResults.filter((q): q is Quote => q !== null));

      if (i + batchSize < symbols.length) {
        await this.delay(100);
      }
    }

    return quotes;
  }

  /**
   * 호가 조회
   */
  async getOrderbook(symbol: string): Promise<Orderbook | null> {
    try {
      const data = await this.request<{
        output1: {
          askp1: string;
          askp2: string;
          askp3: string;
          askp4: string;
          askp5: string;
          askp6: string;
          askp7: string;
          askp8: string;
          askp9: string;
          askp10: string;
          askp_rsqn1: string;
          askp_rsqn2: string;
          askp_rsqn3: string;
          askp_rsqn4: string;
          askp_rsqn5: string;
          askp_rsqn6: string;
          askp_rsqn7: string;
          askp_rsqn8: string;
          askp_rsqn9: string;
          askp_rsqn10: string;
          bidp1: string;
          bidp2: string;
          bidp3: string;
          bidp4: string;
          bidp5: string;
          bidp6: string;
          bidp7: string;
          bidp8: string;
          bidp9: string;
          bidp10: string;
          bidp_rsqn1: string;
          bidp_rsqn2: string;
          bidp_rsqn3: string;
          bidp_rsqn4: string;
          bidp_rsqn5: string;
          bidp_rsqn6: string;
          bidp_rsqn7: string;
          bidp_rsqn8: string;
          bidp_rsqn9: string;
          bidp_rsqn10: string;
        };
      }>(
        '/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn',
        {
          FID_COND_MRKT_DIV_CODE: 'J',
          FID_INPUT_ISCD: symbol,
        },
        'FHKST01010200'
      );

      if (!data.output1) return null;

      const asks = [];
      const bids = [];

      for (let i = 1; i <= 10; i++) {
        const askPrice = parseInt(data.output1[`askp${i}` as keyof typeof data.output1]);
        const askQty = parseInt(data.output1[`askp_rsqn${i}` as keyof typeof data.output1]);
        const bidPrice = parseInt(data.output1[`bidp${i}` as keyof typeof data.output1]);
        const bidQty = parseInt(data.output1[`bidp_rsqn${i}` as keyof typeof data.output1]);

        if (askPrice > 0) {
          asks.push({ price: askPrice, quantity: askQty });
        }
        if (bidPrice > 0) {
          bids.push({ price: bidPrice, quantity: bidQty });
        }
      }

      return {
        symbol,
        asks,
        bids,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`[KIS] getOrderbook(${symbol}) 실패:`, error);
      return null;
    }
  }

  /**
   * 전체 섹터 목록 조회
   */
  async getSectors(): Promise<Sector[]> {
    return SECTOR_CODES.map((code) => SECTORS[code]);
  }

  /**
   * 섹터별 종목 조회
   * 종목 마스터 데이터 기반
   */
  async getStocksBySector(sectorCode: SectorCode): Promise<StockInfo[]> {
    const symbols = getStockSymbolsBySector(sectorCode);

    const stocks = await Promise.all(
      symbols.slice(0, 20).map((symbol) => this.getStockInfo(symbol))
    );

    return stocks
      .filter((s): s is StockInfo => s !== null)
      .map((stock) => ({
        ...stock,
        sector: SECTORS[sectorCode].name,
      }));
  }

  /**
   * 섹터별 시세 요약 조회
   */
  async getSectorSummary(sectorCode: SectorCode): Promise<SectorSummary | null> {
    const stocks = await this.getStocksBySector(sectorCode);
    if (stocks.length === 0) return null;

    const quotes = await this.getQuotes(stocks.map((s) => s.symbol));

    let advanceCount = 0;
    let declineCount = 0;
    let unchangedCount = 0;
    let totalVolume = 0;
    let totalChangePercent = 0;

    const stockScores: { symbol: string; name: string; quote: Quote; score: number }[] = [];

    for (const quote of quotes) {
      if (quote.changePercent > 0) advanceCount++;
      else if (quote.changePercent < 0) declineCount++;
      else unchangedCount++;

      totalVolume += quote.volume;
      totalChangePercent += quote.changePercent;

      const stock = stocks.find((s) => s.symbol === quote.symbol);
      stockScores.push({
        symbol: quote.symbol,
        name: stock?.name || quote.symbol,
        quote,
        score: quote.changePercent * 2 + Math.log10(quote.volume + 1),
      });
    }

    const hotStocks: HotStock[] = stockScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => ({
        symbol: s.symbol,
        name: s.name,
        price: s.quote.price,
        changePercent: s.quote.changePercent,
      }));

    return {
      sector: SECTORS[sectorCode],
      stockCount: stocks.length,
      avgChangePercent: quotes.length > 0 ? totalChangePercent / quotes.length : 0,
      advanceCount,
      declineCount,
      unchangedCount,
      totalVolume,
      hotStocks,
    };
  }

  /**
   * 전체 섹터 시세 요약 조회
   */
  async getAllSectorSummaries(): Promise<SectorSummary[]> {
    const summaries: SectorSummary[] = [];

    for (const code of SECTOR_CODES) {
      const summary = await this.getSectorSummary(code);
      if (summary && summary.stockCount > 0) {
        summaries.push(summary);
      }
    }

    return summaries.sort((a, b) => b.avgChangePercent - a.avgChangePercent);
  }
}

/**
 * 환경변수에서 KIS Provider 생성
 */
export function createKISProvider(): KISProvider | null {
  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;
  const accountNo = process.env.KIS_ACCOUNT_NO;
  const isProduction = process.env.KIS_PRODUCTION === 'true';

  if (!appKey || !appSecret || !accountNo) {
    console.warn('KIS API 환경변수가 설정되지 않았습니다.');
    return null;
  }

  return new KISProvider({
    appKey,
    appSecret,
    accountNo,
    isProduction,
  });
}

/**
 * 싱글톤 인스턴스 (환경변수 기반)
 */
export const kisProvider = createKISProvider();
