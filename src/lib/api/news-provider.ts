import type { News } from '@/types';

/**
 * 뉴스 데이터 Provider 인터페이스
 */
export interface NewsProvider {
  /** Provider 이름 */
  readonly name: string;

  /** 종목별 뉴스 조회 */
  getNewsBySymbol(symbol: string, limit?: number): Promise<News[]>;

  /** 여러 종목 뉴스 조회 */
  getNewsBySymbols(symbols: string[], limit?: number): Promise<News[]>;

  /** 최신 뉴스 조회 */
  getLatestNews(limit?: number): Promise<News[]>;

  /** 뉴스 검색 */
  searchNews(query: string, limit?: number): Promise<News[]>;
}

/** 현재 활성화된 Provider */
let currentProvider: NewsProvider | null = null;

/** Provider 설정 */
export function setNewsProvider(provider: NewsProvider): void {
  currentProvider = provider;
}

/** Provider 가져오기 */
export function getNewsProvider(): NewsProvider {
  if (!currentProvider) {
    throw new Error('NewsProvider가 설정되지 않았습니다. setNewsProvider()를 먼저 호출하세요.');
  }
  return currentProvider;
}
