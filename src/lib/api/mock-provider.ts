import type { OHLCV, StockInfo, Quote, Orderbook, TimeFrame, SectorCode, Sector, SectorSummary, HotStock } from '@/types';
import { SECTORS, SECTOR_CODES } from '@/types/sector';
import type { StockDataProvider } from './stock-provider';
import { MOCK_STOCKS, findStockBySymbol, searchStocks as searchMockStocks } from './mock-data/stocks';
import { generateOHLCV, getLatestPrice } from './mock-data/ohlcv';
import { getStocksBySector as getStockSymbolsBySector } from './sector-master';

/**
 * Mock 데이터 Provider
 * 개발 및 테스트용
 */
export class MockProvider implements StockDataProvider {
  readonly name = 'MockProvider';

  async getStockInfo(symbol: string): Promise<StockInfo | null> {
    await this.delay();
    return findStockBySymbol(symbol) || null;
  }

  async searchStocks(query: string): Promise<StockInfo[]> {
    await this.delay();
    return searchMockStocks(query);
  }

  async getAllStocks(): Promise<StockInfo[]> {
    await this.delay();
    return MOCK_STOCKS;
  }

  async getOHLCV(symbol: string, timeFrame: TimeFrame, limit: number = 100): Promise<OHLCV[]> {
    await this.delay();
    const stock = findStockBySymbol(symbol);
    if (!stock) return [];
    return generateOHLCV(symbol, timeFrame, limit);
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    await this.delay();
    const stock = findStockBySymbol(symbol);
    if (!stock) return null;

    const price = getLatestPrice(symbol);
    const prevClose = price * (1 - (Math.random() - 0.5) * 0.04);
    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;

    return {
      symbol,
      price,
      change: Math.round(change),
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 10000000),
      high: Math.round(price * 1.02),
      low: Math.round(price * 0.98),
      open: Math.round(prevClose * (1 + (Math.random() - 0.5) * 0.02)),
      prevClose: Math.round(prevClose),
      timestamp: Date.now(),
    };
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const quotes = await Promise.all(symbols.map((s) => this.getQuote(s)));
    return quotes.filter((q): q is Quote => q !== null);
  }

  async getOrderbook(symbol: string): Promise<Orderbook | null> {
    await this.delay();
    const stock = findStockBySymbol(symbol);
    if (!stock) return null;

    const price = getLatestPrice(symbol);
    const tickSize = price > 100000 ? 500 : price > 50000 ? 100 : 50;

    const asks = Array.from({ length: 10 }, (_, i) => ({
      price: price + tickSize * (i + 1),
      quantity: Math.floor(Math.random() * 10000) + 100,
    }));

    const bids = Array.from({ length: 10 }, (_, i) => ({
      price: price - tickSize * (i + 1),
      quantity: Math.floor(Math.random() * 10000) + 100,
    }));

    return {
      symbol,
      asks,
      bids,
      timestamp: Date.now(),
    };
  }

  /** 전체 섹터 목록 조회 */
  async getSectors(): Promise<Sector[]> {
    await this.delay();
    return SECTOR_CODES.map((code) => SECTORS[code]);
  }

  /** 섹터별 종목 조회 */
  async getStocksBySector(sectorCode: SectorCode): Promise<StockInfo[]> {
    await this.delay();
    const symbols = getStockSymbolsBySector(sectorCode);

    // Mock 데이터에 있는 종목만 반환
    const stocks: StockInfo[] = [];

    for (const symbol of symbols) {
      const stock = findStockBySymbol(symbol);
      if (stock) {
        stocks.push({
          ...stock,
          sector: SECTORS[sectorCode].name,
        });
      }
    }

    return stocks;
  }

  /** 섹터별 시세 요약 조회 */
  async getSectorSummary(sectorCode: SectorCode): Promise<SectorSummary | null> {
    await this.delay();
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
      // 간단한 핫 종목 점수 계산 (등락률 + 거래량 가중)
      stockScores.push({
        symbol: quote.symbol,
        name: stock?.name || quote.symbol,
        quote,
        score: quote.changePercent * 2 + Math.log10(quote.volume + 1),
      });
    }

    // 상위 5개 핫 종목 (종목명, 가격, 등락률 포함)
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

  /** 전체 섹터 시세 요약 조회 */
  async getAllSectorSummaries(): Promise<SectorSummary[]> {
    await this.delay();

    const summaries: SectorSummary[] = [];

    for (const code of SECTOR_CODES) {
      const summary = await this.getSectorSummary(code);
      if (summary && summary.stockCount > 0) {
        summaries.push(summary);
      }
    }

    // 평균 등락률 순으로 정렬
    return summaries.sort((a, b) => b.avgChangePercent - a.avgChangePercent);
  }

  /** 네트워크 지연 시뮬레이션 */
  private delay(ms: number = 50): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/** 싱글톤 인스턴스 */
export const mockProvider = new MockProvider();
