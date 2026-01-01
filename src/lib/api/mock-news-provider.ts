import type { News } from '@/types';
import type { NewsProvider } from './news-provider';
import { findStockBySymbol } from './mock-data/stocks';

/** Mock 뉴스 템플릿 */
const NEWS_TEMPLATES = [
  { title: '{name}, 실적 호조에 주가 상승', sentiment: 'positive' as const },
  { title: '{name} 신제품 출시 임박... 시장 기대감 고조', sentiment: 'positive' as const },
  { title: '{name}, 외국인 매수세 지속', sentiment: 'positive' as const },
  { title: '{name} 목표주가 상향 조정', sentiment: 'positive' as const },
  { title: '{name}, 글로벌 시장 점유율 확대', sentiment: 'positive' as const },
  { title: '{name} 실적 부진 우려... 주가 하락', sentiment: 'negative' as const },
  { title: '{name}, 경쟁 심화에 수익성 악화', sentiment: 'negative' as const },
  { title: '{name} 목표주가 하향 조정', sentiment: 'negative' as const },
  { title: '{name}, 기관 매도세 확대', sentiment: 'negative' as const },
  { title: '{name} 주주총회 개최 예정', sentiment: 'neutral' as const },
  { title: '{name}, 신규 사업 진출 검토', sentiment: 'neutral' as const },
  { title: '{name} CEO 인터뷰 "올해 성장 목표 달성할 것"', sentiment: 'neutral' as const },
];

const SOURCES = ['한국경제', '매일경제', '서울경제', '이데일리', '연합뉴스', '머니투데이'];

/**
 * Mock 뉴스 Provider
 */
export class MockNewsProvider implements NewsProvider {
  readonly name = 'MockNewsProvider';

  async getNewsBySymbol(symbol: string, limit: number = 10): Promise<News[]> {
    await this.delay();
    const stock = findStockBySymbol(symbol);
    if (!stock) return [];
    return this.generateNews(stock.name, limit);
  }

  async getNewsBySymbols(symbols: string[], limit: number = 20): Promise<News[]> {
    await this.delay();
    const allNews: News[] = [];

    for (const symbol of symbols) {
      const stock = findStockBySymbol(symbol);
      if (stock) {
        const news = this.generateNews(stock.name, Math.ceil(limit / symbols.length));
        allNews.push(...news);
      }
    }

    return allNews.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, limit);
  }

  async getLatestNews(limit: number = 20): Promise<News[]> {
    await this.delay();
    const stocks = ['삼성전자', 'SK하이닉스', 'NAVER', '카카오', '현대차'];
    const allNews: News[] = [];

    for (const name of stocks) {
      allNews.push(...this.generateNews(name, 4));
    }

    return allNews.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, limit);
  }

  async searchNews(query: string, limit: number = 20): Promise<News[]> {
    await this.delay();
    return this.generateNews(query, limit);
  }

  private generateNews(stockName: string, count: number): News[] {
    const news: News[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
      const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
      const hoursAgo = Math.floor(Math.random() * 72); // 0~72시간 전

      news.push({
        id: `news-${now}-${i}-${Math.random().toString(36).slice(2)}`,
        title: template.title.replace('{name}', stockName),
        summary: `${stockName} 관련 뉴스입니다. 자세한 내용은 본문을 확인하세요.`,
        url: `https://example.com/news/${Date.now()}`,
        source,
        publishedAt: now - hoursAgo * 60 * 60 * 1000,
        sentiment: template.sentiment,
      });
    }

    return news.sort((a, b) => b.publishedAt - a.publishedAt);
  }

  private delay(ms: number = 30): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/** 싱글톤 인스턴스 */
export const mockNewsProvider = new MockNewsProvider();
