import type {
  OHLCV,
  StockInfo,
  Quote,
  Orderbook,
  TimeFrame,
  SectorCode,
  Sector,
  SectorSummary,
  HotStock,
  RankingItem,
  RankingResult,
  RankingType,
} from '@/types';
import { SECTORS, SECTOR_CODES } from '@/types/sector';
import type { StockDataProvider } from './stock-provider';
import { getStocksBySector as getStockSymbolsBySector, getAllMappedSymbols } from './sector-master';
import {
  getFromMemory,
  setToMemory,
  getOHLCVFromCache,
  setOHLCVToCache,
  CacheKeys,
  CACHE_TTL,
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
        symbol: symbol.slice(-6), // 항상 6자리 종목코드 사용
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
   * OHLCV 차트 데이터 조회 (파일 캐시 적용, 페이지네이션 지원)
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

    const formatDate = (d: Date) =>
      d.toISOString().slice(0, 10).replace(/-/g, '');

    // API는 한 번에 약 100개 데이터만 반환하므로 페이지네이션 필요
    const BATCH_SIZE = 100;
    const allData: OHLCV[] = [];

    try {
      let currentEndDate = new Date();
      let remainingLimit = limit;

      // 필요한 만큼 반복 호출 (최대 5회로 제한)
      for (let i = 0; i < 5 && remainingLimit > 0; i++) {
        // 날짜 범위 계산 (거래일 기준으로 약 1.5배 여유)
        const daysToFetch = Math.min(remainingLimit, BATCH_SIZE);
        const startDate = new Date(currentEndDate);

        switch (timeFrame) {
          case 'D':
            startDate.setDate(startDate.getDate() - Math.ceil(daysToFetch * 1.5));
            break;
          case 'W':
            startDate.setDate(startDate.getDate() - daysToFetch * 7);
            break;
          case 'M':
            startDate.setMonth(startDate.getMonth() - daysToFetch);
            break;
        }

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
            FID_INPUT_DATE_2: formatDate(currentEndDate),
            FID_PERIOD_DIV_CODE: periodMap[timeFrame],
            FID_ORG_ADJ_PRC: '0',
          },
          'FHKST03010100'
        );

        const batchData = (data.output2 || [])
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
          });

        if (batchData.length === 0) break;

        // 데이터 추가 (중복 제거)
        for (const item of batchData) {
          if (!allData.some(d => d.time === item.time)) {
            allData.push(item);
          }
        }

        remainingLimit = limit - allData.length;

        // 다음 조회를 위해 가장 오래된 날짜의 하루 전으로 설정
        const oldestDate = Math.min(...batchData.map(d => d.time));
        currentEndDate = new Date(oldestDate - 24 * 60 * 60 * 1000);

        // API 호출 간격 (Rate limit 대응)
        if (remainingLimit > 0) {
          await this.delay(500);
        }
      }

      // 시간순 정렬 후 최신 limit개 반환
      const result = allData
        .sort((a, b) => a.time - b.time)
        .slice(-limit);

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
          stck_prpr: string; // 현재가
          prdy_vrss: string; // 전일대비
          prdy_ctrt: string; // 전일대비율
          acml_vol: string; // 누적거래량
          stck_hgpr: string; // 당일고가
          stck_lwpr: string; // 당일저가
          stck_oprc: string; // 시가
          stck_sdpr: string; // 전일종가
          stck_mxpr: string; // 52주 최고가
          stck_llam: string; // 52주 최저가
          hts_avls: string; // 시가총액 (억원)
          per: string; // PER
          pbr: string; // PBR
          eps: string; // EPS
          bps: string; // BPS
          hts_frgn_ehrt: string; // 외국인소진율
          acml_tr_pbmn: string; // 누적거래대금
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
        price: parseInt(data.output.stck_prpr) || 0,
        change: parseInt(data.output.prdy_vrss) || 0,
        changePercent: parseFloat(data.output.prdy_ctrt) || 0,
        volume: parseInt(data.output.acml_vol) || 0,
        high: parseInt(data.output.stck_hgpr) || 0,
        low: parseInt(data.output.stck_lwpr) || 0,
        open: parseInt(data.output.stck_oprc) || 0,
        prevClose: parseInt(data.output.stck_sdpr) || 0,
        timestamp: Date.now(),
        // 확장 정보
        high52w: parseInt(data.output.stck_mxpr) || undefined,
        low52w: parseInt(data.output.stck_llam) || undefined,
        marketCap: parseInt(data.output.hts_avls) || undefined,
        per: parseFloat(data.output.per) || undefined,
        pbr: parseFloat(data.output.pbr) || undefined,
        eps: parseInt(data.output.eps) || undefined,
        bps: parseInt(data.output.bps) || undefined,
        foreignHoldingRate: parseFloat(data.output.hts_frgn_ehrt) || undefined,
        tradingValue: parseInt(data.output.acml_tr_pbmn) || undefined,
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
   * Rate limiting 대응: 순차 처리 + 딜레이
   * KIS API 제한: 실전 초당 20회, 모의 2회
   */
  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const quotes: Quote[] = [];

    // 순차 처리 (Rate Limit 대응)
    for (let i = 0; i < symbols.length; i++) {
      const quote = await this.getQuote(symbols[i]);
      if (quote) {
        quotes.push(quote);
      }

      // 다음 요청 전 딜레이 (초당 10회 이하로 제한)
      if (i < symbols.length - 1) {
        await this.delay(120);
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

  // ============================================
  // 순위 조회 API (주도주 발굴용)
  // ============================================

  /**
   * 등락률 순위 조회
   * TR_ID: FHPST01700000
   * 참고: https://apiportal.koreainvestment.com/apiservice/apiservice-domestic-stock-ranking
   * HTS [0170] 등락률 순위 화면
   */
  async getChangeRanking(
    market: 'KOSPI' | 'KOSDAQ',
    limit: number = 30
  ): Promise<RankingResult> {
    const cacheKey = CacheKeys.ranking('change', market);
    const cached = getFromMemory<RankingResult>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<{
        output: Array<{
          stck_shrn_iscd: string; // 종목코드
          hts_kor_isnm: string; // 종목명
          stck_prpr: string; // 현재가
          prdy_vrss: string; // 전일대비
          prdy_vrss_sign: string; // 전일대비 부호
          prdy_ctrt: string; // 등락률
          acml_vol: string; // 누적거래량
          acml_tr_pbmn: string; // 누적거래대금
        }>;
      }>(
        '/uapi/domestic-stock/v1/ranking/fluctuation',
        {
          fid_cond_mrkt_div_code: market === 'KOSPI' ? 'J' : 'Q',
          fid_cond_scr_div_code: '20170', // 등락률 순위
          fid_input_iscd: '0000', // 전체
          fid_rank_sort_cls_code: '0', // 상승률 순
          fid_input_cnt_1: '0',
          fid_prc_cls_code: '0',
          fid_input_price_1: '',
          fid_input_price_2: '',
          fid_vol_cnt: '',
          fid_trgt_cls_code: '0',
          fid_trgt_exls_cls_code: '0',
          fid_div_cls_code: '0',
          fid_rsfl_rate1: '',
          fid_rsfl_rate2: '',
        },
        'FHPST01700000'
      );

      const items: RankingItem[] = (data.output || []).slice(0, limit).map((item, idx) => ({
        symbol: item.stck_shrn_iscd,
        name: item.hts_kor_isnm,
        market,
        rank: idx + 1,
        price: parseInt(item.stck_prpr) || 0,
        changePercent: parseFloat(item.prdy_ctrt) || 0,
        volume: parseInt(item.acml_vol) || 0,
        amount: parseInt(item.acml_tr_pbmn) || 0,
      }));

      const result: RankingResult = {
        type: 'change',
        market,
        items,
        fetchedAt: Date.now(),
      };

      setToMemory(cacheKey, result, CACHE_TTL.RANKING);
      return result;
    } catch (error) {
      console.error(`[KIS] getChangeRanking(${market}) 실패:`, error);
      return { type: 'change', market, items: [], fetchedAt: Date.now() };
    }
  }

  /**
   * 거래량 순위 조회 (회전율 대신 거래량 기반)
   * TR_ID: FHPST01710000
   * 참고: https://apiportal.koreainvestment.com/apiservice/apiservice-domestic-stock-ranking
   */
  async getTurnoverRanking(
    market: 'KOSPI' | 'KOSDAQ',
    limit: number = 30
  ): Promise<RankingResult> {
    const cacheKey = CacheKeys.ranking('turnover', market);
    const cached = getFromMemory<RankingResult>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<{
        output: Array<{
          mksc_shrn_iscd: string; // 종목코드
          hts_kor_isnm: string; // 종목명
          stck_prpr: string; // 현재가
          prdy_vrss: string; // 전일대비
          prdy_vrss_sign: string; // 전일대비 부호
          prdy_ctrt: string; // 등락률
          acml_vol: string; // 누적거래량
          acml_tr_pbmn: string; // 누적거래대금
          vol_tnrt: string; // 거래량회전율
        }>;
      }>(
        '/uapi/domestic-stock/v1/quotations/volume-rank',
        {
          FID_COND_MRKT_DIV_CODE: market === 'KOSPI' ? 'J' : 'Q',
          FID_COND_SCR_DIV_CODE: '20171', // 거래량순
          FID_INPUT_ISCD: '0000', // 전체
          FID_DIV_CLS_CODE: '0', // 전체
          FID_BLNG_CLS_CODE: '0', // 전체
          FID_TRGT_CLS_CODE: '111111111', // 전체
          FID_TRGT_EXLS_CLS_CODE: '000000', // 제외없음
          FID_INPUT_PRICE_1: '', // 가격 시작
          FID_INPUT_PRICE_2: '', // 가격 끝
          FID_VOL_CNT: '', // 거래량
          FID_INPUT_DATE_1: '', // 날짜
        },
        'FHPST01710000'
      );

      const items: RankingItem[] = (data.output || []).slice(0, limit).map((item, idx) => ({
        symbol: item.mksc_shrn_iscd,
        name: item.hts_kor_isnm,
        market,
        rank: idx + 1,
        price: parseInt(item.stck_prpr) || 0,
        changePercent: parseFloat(item.prdy_ctrt) || 0,
        volume: parseInt(item.acml_vol) || 0,
        amount: parseInt(item.acml_tr_pbmn) || 0,
        turnoverRate: parseFloat(item.vol_tnrt) || 0,
      }));

      const result: RankingResult = {
        type: 'turnover',
        market,
        items,
        fetchedAt: Date.now(),
      };

      setToMemory(cacheKey, result, CACHE_TTL.RANKING);
      return result;
    } catch (error) {
      console.error(`[KIS] getTurnoverRanking(${market}) 실패:`, error);
      return { type: 'turnover', market, items: [], fetchedAt: Date.now() };
    }
  }

  /**
   * 거래대금 순위 조회
   * 참고: KIS OpenAPI에서 직접 제공하지 않음
   * 대안: 거래량 순위 API의 거래대금 정보 활용
   */
  async getAmountRanking(
    market: 'KOSPI' | 'KOSDAQ',
    limit: number = 30
  ): Promise<RankingResult> {
    // 거래량 순위 API에서 거래대금 정보도 포함되므로, 해당 데이터를 거래대금 순으로 재정렬
    const volumeRanking = await this.getTurnoverRanking(market, 50);

    const items = [...volumeRanking.items]
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, limit)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    return {
      type: 'amount',
      market,
      items,
      fetchedAt: Date.now(),
    };
  }

  /**
   * 외인/기관 순매수 순위 조회
   * 참고: KIS OpenAPI에서 직접 제공하지 않음 (추후 추가 예정)
   * 현재는 빈 결과 반환
   */
  async getForeignInstRanking(
    market: 'KOSPI' | 'KOSDAQ',
    _limit: number = 30
  ): Promise<RankingResult> {
    // KIS OpenAPI에서 외인/기관 순매수 순위 API가 직접 제공되지 않음
    // 추후 종목조건검색 API 또는 다른 방법으로 구현 예정
    console.log(`[KIS] getForeignInstRanking(${market}): 현재 미지원 API`);
    return { type: 'foreign', market, items: [], fetchedAt: Date.now() };
  }

  /**
   * HTS 조회상위20종목 API 호출
   * TR_ID: HHMCM000100C0
   * 참고: 한국투자 HTS(eFriend Plus) > [0158] 조회종목상위 화면
   *
   * 응답: 시장구분(mrkt_div_cls_code), 종목코드(mksc_shrn_iscd)만 반환
   * 종목명, 현재가 등은 별도 API 호출 필요
   */
  async getViewRanking(limit: number = 20): Promise<RankingResult> {
    const cacheKey = CacheKeys.ranking('popularity', 'ALL');
    const cached = getFromMemory<RankingResult>(cacheKey);
    if (cached) return cached;

    try {
      console.log('[KIS] HTS 조회상위 API 호출...');

      // HTS 조회상위 API 호출 (종목코드 목록만 반환)
      const data = await this.request<{
        rt_cd: string;
        msg_cd: string;
        msg1: string;
        output1: Array<{
          mrkt_div_cls_code: string; // 시장구분 (J: 코스피, Q: 코스닥)
          mksc_shrn_iscd: string; // 종목코드
        }>;
      }>(
        '/uapi/domestic-stock/v1/ranking/hts-top-view',
        {},
        'HHMCM000100C0'
      );

      if (data.rt_cd !== '0') {
        console.error('[KIS] HTS 조회상위 API 오류:', data.msg1);
        throw new Error(data.msg1);
      }

      const stockCodes = (data.output1 || []).slice(0, limit);
      console.log(`[KIS] HTS 조회상위 ${stockCodes.length}개 종목 조회됨`);

      if (stockCodes.length === 0) {
        return { type: 'popularity', market: 'KOSPI', items: [], fetchedAt: Date.now() };
      }

      // 각 종목의 시세 정보 조회 (배치 처리)
      const symbols = stockCodes.map((s) => s.mksc_shrn_iscd);
      const quotes = await this.getQuotes(symbols);

      // 종목코드 -> 시장구분 매핑
      const marketMap = new Map(
        stockCodes.map((s) => [s.mksc_shrn_iscd, s.mrkt_div_cls_code])
      );

      // RankingItem 생성
      const items: RankingItem[] = quotes.map((quote, idx) => {
        const marketCode = marketMap.get(quote.symbol) || 'J';
        return {
          symbol: quote.symbol,
          name: '', // 종목명은 getStockInfo에서 가져와야 함
          market: marketCode === 'J' ? 'KOSPI' : 'KOSDAQ',
          rank: idx + 1,
          price: quote.price,
          changePercent: quote.changePercent,
          volume: quote.volume,
          amount: quote.tradingValue || 0,
        };
      });

      // 종목명 조회 (순차 처리 - Rate Limit 대응)
      for (let i = 0; i < items.length; i++) {
        const stockInfo = await this.getStockInfo(items[i].symbol);
        if (stockInfo) {
          items[i].name = stockInfo.name;
        }
        // 캐시 미스 시 API 호출이 발생하므로 딜레이 추가
        if (i < items.length - 1) {
          await this.delay(100);
        }
      }

      const result: RankingResult = {
        type: 'popularity',
        market: 'KOSPI', // 전체 시장 (KOSPI/KOSDAQ 혼합)
        items,
        fetchedAt: Date.now(),
      };

      setToMemory(cacheKey, result, CACHE_TTL.RANKING);
      console.log('[KIS] HTS 조회상위 데이터 캐싱 완료');
      return result;
    } catch (error) {
      console.error('[KIS] getViewRanking 실패:', error);
      throw error;
    }
  }

  /**
   * HTS 조회상위 종목 순위 조회 (인기도)
   * TR_ID: HHMCM000100C0
   * 참고: 한국투자 HTS(eFriend Plus) > [0158] 조회종목상위 화면
   *
   * HTS 조회상위 API 실패 시 거래량 순위 API로 대체
   */
  async getPopularityRanking(
    market: 'KOSPI' | 'KOSDAQ',
    limit: number = 30
  ): Promise<RankingResult> {
    const cacheKey = CacheKeys.ranking('popularity', market);
    const cached = getFromMemory<RankingResult>(cacheKey);
    if (cached) return cached;

    try {
      // 1. HTS 조회상위 API 시도
      const viewRanking = await this.getViewRanking(limit);

      // 시장별 필터링
      const filteredItems = viewRanking.items.filter(
        (item) => item.market === market
      );

      // 순위 재부여
      const items = filteredItems.map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

      const result: RankingResult = {
        type: 'popularity',
        market,
        items,
        fetchedAt: Date.now(),
      };

      setToMemory(cacheKey, result, CACHE_TTL.RANKING);
      return result;
    } catch (error) {
      console.warn('[KIS] HTS 조회상위 API 실패, 거래량 순위로 대체:', error);

      // 2. 대체: 거래량 순위 API (회전율 기준)
      return this.getFallbackPopularityRanking(market, limit);
    }
  }

  /**
   * 인기도 순위 대체 (거래량 순위 API 활용)
   * HTS 조회상위 API 실패 시 사용
   */
  private async getFallbackPopularityRanking(
    market: 'KOSPI' | 'KOSDAQ',
    limit: number
  ): Promise<RankingResult> {
    try {
      const data = await this.request<{
        output: Array<{
          mksc_shrn_iscd: string;
          hts_kor_isnm: string;
          stck_prpr: string;
          prdy_ctrt: string;
          acml_vol: string;
          acml_tr_pbmn: string;
          vol_tnrt: string;
        }>;
      }>(
        '/uapi/domestic-stock/v1/quotations/volume-rank',
        {
          FID_COND_MRKT_DIV_CODE: market === 'KOSPI' ? 'J' : 'Q',
          FID_COND_SCR_DIV_CODE: '20171',
          FID_INPUT_ISCD: '0000',
          FID_DIV_CLS_CODE: '0',
          FID_BLNG_CLS_CODE: '0',
          FID_TRGT_CLS_CODE: '111111111',
          FID_TRGT_EXLS_CLS_CODE: '000000',
          FID_INPUT_PRICE_1: '',
          FID_INPUT_PRICE_2: '',
          FID_VOL_CNT: '',
          FID_INPUT_DATE_1: '',
        },
        'FHPST01710000'
      );

      // 회전율 기준 정렬
      const sortedItems = (data.output || [])
        .map((item) => ({
          ...item,
          turnoverRate: parseFloat(item.vol_tnrt) || 0,
        }))
        .sort((a, b) => b.turnoverRate - a.turnoverRate)
        .slice(0, limit);

      const items: RankingItem[] = sortedItems.map((item, idx) => ({
        symbol: item.mksc_shrn_iscd,
        name: item.hts_kor_isnm,
        market,
        rank: idx + 1,
        price: parseInt(item.stck_prpr) || 0,
        changePercent: parseFloat(item.prdy_ctrt) || 0,
        volume: parseInt(item.acml_vol) || 0,
        amount: parseInt(item.acml_tr_pbmn) || 0,
        turnoverRate: item.turnoverRate,
      }));

      const result: RankingResult = {
        type: 'popularity',
        market,
        items,
        fetchedAt: Date.now(),
      };

      const cacheKey = CacheKeys.ranking('popularity', market);
      setToMemory(cacheKey, result, CACHE_TTL.RANKING);
      return result;
    } catch (error) {
      console.error(`[KIS] getFallbackPopularityRanking(${market}) 실패:`, error);
      return { type: 'popularity', market, items: [], fetchedAt: Date.now() };
    }
  }

  /**
   * 모든 순위 데이터 통합 조회 (캐시 활용, 병렬 호출)
   */
  async getAllRankings(
    market: 'KOSPI' | 'KOSDAQ' | 'ALL',
    limit: number = 30
  ): Promise<Map<RankingType, RankingResult>> {
    const cacheKey = CacheKeys.allRankings(market);
    const cached = getFromMemory<Map<RankingType, RankingResult>>(cacheKey);
    if (cached) return cached;

    const results = new Map<RankingType, RankingResult>();
    const markets: ('KOSPI' | 'KOSDAQ')[] = market === 'ALL' ? ['KOSPI', 'KOSDAQ'] : [market];

    // 각 시장별로 5개 API 병렬 호출
    for (const mkt of markets) {
      const [change, turnover, amount, foreign, popularity] = await Promise.all([
        this.getChangeRanking(mkt, limit),
        this.getTurnoverRanking(mkt, limit),
        this.getAmountRanking(mkt, limit),
        this.getForeignInstRanking(mkt, limit),
        this.getPopularityRanking(mkt, limit),
      ]);

      // ALL인 경우 두 시장 결과를 병합
      if (market === 'ALL') {
        this.mergeRankingResults(results, 'change', change);
        this.mergeRankingResults(results, 'turnover', turnover);
        this.mergeRankingResults(results, 'amount', amount);
        this.mergeRankingResults(results, 'foreign', foreign);
        this.mergeRankingResults(results, 'popularity', popularity);
      } else {
        results.set('change', change);
        results.set('turnover', turnover);
        results.set('amount', amount);
        results.set('foreign', foreign);
        results.set('popularity', popularity);
      }
    }

    setToMemory(cacheKey, results, CACHE_TTL.RANKING);
    return results;
  }

  /**
   * 두 시장의 순위 결과 병합
   */
  private mergeRankingResults(
    results: Map<RankingType, RankingResult>,
    type: RankingType,
    newResult: RankingResult
  ): void {
    const existing = results.get(type);
    if (existing) {
      // 기존 결과에 새 항목 추가
      existing.items.push(...newResult.items);
      // 순위 재정렬 (등락률 기준)
      existing.items.sort((a, b) => b.changePercent - a.changePercent);
      existing.items = existing.items.slice(0, 30);
      // 순위 재할당
      existing.items.forEach((item, idx) => {
        item.rank = idx + 1;
      });
      existing.market = 'ALL';
    } else {
      results.set(type, { ...newResult, market: 'ALL' });
    }
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
