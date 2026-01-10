import * as cheerio from 'cheerio';
import type { Theme, ThemeSummary, LeadingStock, ThemeStock } from '@/types';
import type { ThemeProvider } from './theme-provider';

/**
 * 테마 캐시 타입
 */
interface ThemeCache {
  themes: Theme[];
  timestamp: number;
}

/**
 * 네이버 금융 테마 Provider
 * 네이버 금융 테마 페이지를 크롤링하여 테마 데이터를 제공합니다.
 */
export class NaverThemeProvider implements ThemeProvider {
  readonly name = 'NaverThemeProvider';

  private baseUrl = 'https://finance.naver.com/sise/theme.naver';
  private detailUrl = 'https://finance.naver.com/sise/sise_group_detail.naver';

  // 캐시 설정 (5분 TTL)
  private cache: ThemeCache | null = null;
  private cacheTTL = 5 * 60 * 1000; // 5분

  // 필수 헤더 (크롤링 차단 대응)
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://finance.naver.com/',
  };

  /**
   * HTML 페이지 가져오기
   */
  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`네이버 테마 페이지 로드 실패: ${response.status}`);
    }

    // EUC-KR 인코딩 처리
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    return decoder.decode(buffer);
  }

  /**
   * 테마 목록 페이지 파싱
   */
  private parseThemeListPage(html: string): Theme[] {
    const $ = cheerio.load(html);
    const themes: Theme[] = [];

    // 테마 테이블 행 파싱
    $('table.type_1 tbody tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length < 6) return;

      // 테마명 및 ID 추출
      const themeLink = $row.find('td:first-child a');
      const themeName = themeLink.text().trim();
      const href = themeLink.attr('href') || '';
      const themeIdMatch = href.match(/no=(\d+)/);
      const themeId = themeIdMatch ? themeIdMatch[1] : '';

      if (!themeName || !themeId) return;

      // 등락률 추출
      const changeText = $(cells[1]).text().trim();
      const changePercent = this.parseChangePercent(changeText);

      // 상승/보합/하락 추출
      const advanceText = $(cells[2]).text().trim();
      const unchangedText = $(cells[3]).text().trim();
      const declineText = $(cells[4]).text().trim();

      const advanceCount = parseInt(advanceText, 10) || 0;
      const unchangedCount = parseInt(unchangedText, 10) || 0;
      const declineCount = parseInt(declineText, 10) || 0;
      const stockCount = advanceCount + unchangedCount + declineCount;

      // 주도주 추출 (테마 상세 페이지에서 가져올 예정, 우선 빈 배열)
      const leadingStocks: LeadingStock[] = [];

      themes.push({
        id: themeId,
        name: themeName,
        changePercent,
        stockCount,
        advanceCount,
        unchangedCount,
        declineCount,
        leadingStocks,
        updatedAt: Date.now(),
      });
    });

    return themes;
  }

  /**
   * 등락률 문자열 파싱
   */
  private parseChangePercent(text: string): number {
    // "+3.45%", "-1.23%", "0.00%" 형식
    const cleanText = text.replace(/[%,\s]/g, '');
    const value = parseFloat(cleanText);
    return isNaN(value) ? 0 : value;
  }

  /**
   * 테마 상세 페이지에서 주도주 파싱
   */
  private parseLeadingStocks(html: string): LeadingStock[] {
    const $ = cheerio.load(html);
    const stocks: LeadingStock[] = [];

    // 종목 테이블에서 상위 5개 추출
    $('table.type_5 tbody tr').each((index, row) => {
      if (index >= 5) return false; // 상위 5개만

      const $row = $(row);

      // 종목명 및 코드 추출 (td.name 안의 a 태그)
      const stockLink = $row.find('td.name a');
      const name = stockLink.text().trim();
      const href = stockLink.attr('href') || '';
      const symbolMatch = href.match(/code=(\d+)/);
      const symbol = symbolMatch ? symbolMatch[1] : '';

      if (!name || !symbol) return;

      // td.number 셀들에서 현재가, 등락률 추출
      const numberCells = $row.find('td.number');

      // 현재가 (첫 번째 td.number)
      const priceText = $(numberCells[0]).text().trim().replace(/,/g, '').replace(/[^\d]/g, '');
      const price = parseInt(priceText, 10) || 0;

      // 등락률 (세 번째 td.number)
      const changeText = $(numberCells[2]).text().trim();
      const changePercent = this.parseChangePercent(changeText);

      stocks.push({
        symbol,
        name,
        price,
        changePercent,
      });
    });

    return stocks;
  }

  /**
   * 테마 상세 페이지에서 전체 종목 파싱 (모멘텀 점수 계산용 상세 정보 포함)
   */
  private parseThemeStocks(html: string): ThemeStock[] {
    const $ = cheerio.load(html);
    const stocks: ThemeStock[] = [];

    // 종목 테이블에서 전체 종목 추출
    $('table.type_5 tbody tr').each((_, row) => {
      const $row = $(row);

      // 종목명 및 코드 추출
      const stockLink = $row.find('td.name a');
      const name = stockLink.text().trim();
      const href = stockLink.attr('href') || '';
      const symbolMatch = href.match(/code=(\d+)/);
      const symbol = symbolMatch ? symbolMatch[1] : '';

      if (!name || !symbol) return;

      // td.number 셀들에서 정보 추출
      const numberCells = $row.find('td.number');

      // 현재가 (첫 번째 td.number)
      const priceText = $(numberCells[0]).text().trim().replace(/,/g, '').replace(/[^\d]/g, '');
      const price = parseInt(priceText, 10) || 0;

      // 등락률 (세 번째 td.number)
      const changeText = $(numberCells[2]).text().trim();
      const changePercent = this.parseChangePercent(changeText);

      // 거래량 (네 번째 td.number) - 천 단위로 표시되기도 함
      const volumeText = $(numberCells[3]).text().trim().replace(/,/g, '').replace(/[^\d]/g, '');
      const volume = parseInt(volumeText, 10) || 0;

      // 거래대금 추정 (현재가 * 거래량 / 1,000,000) - 백만원 단위
      const tradingValue = Math.round((price * volume) / 1000000);

      // 시가총액 - 테마 상세 페이지에서는 직접 제공되지 않음
      // 추후 종목 상세 조회로 보완 가능, 우선 기본값 사용
      const marketCap = 0;

      stocks.push({
        symbol,
        name,
        price,
        changePercent,
        volume,
        tradingValue,
        marketCap,
      });
    });

    return stocks;
  }

  /**
   * 전체 테마 목록 가져오기 (캐시 사용)
   */
  private async fetchAllThemes(): Promise<Theme[]> {
    // 캐시 확인
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheTTL) {
      return this.cache.themes;
    }

    const allThemes: Theme[] = [];
    let page = 1;
    let hasMore = true;

    // 최대 10페이지까지 가져오기 (너무 많은 요청 방지)
    while (hasMore && page <= 10) {
      try {
        const url = `${this.baseUrl}?page=${page}`;
        const html = await this.fetchPage(url);
        const themes = this.parseThemeListPage(html);

        if (themes.length === 0) {
          hasMore = false;
        } else {
          allThemes.push(...themes);
          page++;
        }

        // 요청 간 딜레이 (Rate Limit 대응)
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`테마 페이지 ${page} 로드 실패:`, error);
        hasMore = false;
      }
    }

    // 주도주 정보 가져오기 (상위 20개 테마만)
    const topThemes = allThemes.slice(0, 20);
    for (const theme of topThemes) {
      try {
        const detailUrl = `${this.detailUrl}?type=theme&no=${theme.id}`;
        const html = await this.fetchPage(detailUrl);
        theme.leadingStocks = this.parseLeadingStocks(html);

        // 요청 간 딜레이
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`테마 ${theme.id} 상세 로드 실패:`, error);
      }
    }

    // 캐시 업데이트
    this.cache = {
      themes: allThemes,
      timestamp: Date.now(),
    };

    return allThemes;
  }

  /**
   * 테마 목록 조회 (페이지별)
   */
  async getThemes(page: number = 1): Promise<Theme[]> {
    const allThemes = await this.fetchAllThemes();
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return allThemes.slice(start, end);
  }

  /**
   * 전체 테마 목록 조회
   */
  async getAllThemes(): Promise<Theme[]> {
    return this.fetchAllThemes();
  }

  /**
   * 테마 상세 조회
   */
  async getThemeById(themeId: string): Promise<Theme | null> {
    const allThemes = await this.fetchAllThemes();
    const theme = allThemes.find((t) => t.id === themeId);

    if (!theme) return null;

    // 주도주 정보가 없으면 상세 페이지에서 가져오기
    if (theme.leadingStocks.length === 0) {
      try {
        const detailUrl = `${this.detailUrl}?type=theme&no=${themeId}`;
        const html = await this.fetchPage(detailUrl);
        theme.leadingStocks = this.parseLeadingStocks(html);
      } catch (error) {
        console.error(`테마 ${themeId} 상세 로드 실패:`, error);
      }
    }

    return theme;
  }

  /**
   * 테마 요약 정보
   */
  async getThemeSummary(): Promise<ThemeSummary> {
    const allThemes = await this.fetchAllThemes();

    const sorted = [...allThemes].sort((a, b) => b.changePercent - a.changePercent);
    const advanceThemes = allThemes.filter((t) => t.changePercent > 0).length;
    const declineThemes = allThemes.filter((t) => t.changePercent < 0).length;

    // 핫 테마: 종목수가 가장 많은 테마
    const hotTheme = [...allThemes].sort((a, b) => b.stockCount - a.stockCount)[0] || null;

    return {
      hotTheme,
      topGainer: sorted[0] || null,
      topLoser: sorted[sorted.length - 1] || null,
      totalThemes: allThemes.length,
      advanceThemes,
      declineThemes,
    };
  }

  /**
   * 전체 테마 수
   */
  async getTotalThemeCount(): Promise<number> {
    const allThemes = await this.fetchAllThemes();
    return allThemes.length;
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * 테마 내 전체 종목 조회 (모멘텀 점수 계산용)
   */
  async getThemeStocks(themeId: string): Promise<ThemeStock[]> {
    try {
      const detailUrl = `${this.detailUrl}?type=theme&no=${themeId}`;
      const html = await this.fetchPage(detailUrl);
      return this.parseThemeStocks(html);
    } catch (error) {
      console.error(`테마 ${themeId} 종목 조회 실패:`, error);
      return [];
    }
  }
}

/**
 * 네이버 테마 Provider 싱글톤
 */
export const naverThemeProvider = new NaverThemeProvider();
