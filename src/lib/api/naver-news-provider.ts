import type { News } from '@/types';
import type { NewsProvider } from './news-provider';

/**
 * 네이버 뉴스 API 설정
 */
interface NaverNewsConfig {
  clientId: string;
  clientSecret: string;
}

/**
 * 네이버 뉴스 API 응답 항목
 */
interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

/**
 * 네이버 뉴스 API 응답
 */
interface NaverNewsResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverNewsItem[];
}

/**
 * 종목코드-종목명 매핑 (주요 종목)
 */
const SYMBOL_NAME_MAP: Record<string, string> = {
  '005930': '삼성전자',
  '000660': 'SK하이닉스',
  '035420': 'NAVER',
  '035720': '카카오',
  '005380': '현대차',
  '051910': 'LG화학',
  '006400': '삼성SDI',
  '068270': '셀트리온',
  '028260': '삼성물산',
  '105560': 'KB금융',
  '055550': '신한지주',
  '003550': 'LG',
  '000270': '기아',
  '012330': '현대모비스',
  '034730': 'SK',
  '066570': 'LG전자',
  '207940': '삼성바이오로직스',
  '096770': 'SK이노베이션',
  '017670': 'SK텔레콤',
  '030200': 'KT',
};

/**
 * HTML 태그 제거
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * 간단한 감정 분석 (키워드 기반)
 */
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveKeywords = [
    '상승', '호조', '성장', '신고가', '돌파', '급등',
    '호재', '강세', '매수', '목표가 상향', '실적 개선',
    '수주', '계약', '기대감', '확대', '호실적',
  ];

  const negativeKeywords = [
    '하락', '부진', '하향', '급락', '약세', '매도',
    '우려', '손실', '적자', '감소', '악화', '리스크',
    '위기', '폭락', '침체', '축소', '감산',
  ];

  const lowerText = text.toLowerCase();
  let score = 0;

  for (const keyword of positiveKeywords) {
    if (lowerText.includes(keyword)) score += 1;
  }

  for (const keyword of negativeKeywords) {
    if (lowerText.includes(keyword)) score -= 1;
  }

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

/**
 * 네이버 뉴스 검색 API Provider
 *
 * 네이버 개발자센터에서 발급받은 Client ID/Secret 필요
 * https://developers.naver.com/docs/serviceapi/search/news/news.md
 */
export class NaverNewsProvider implements NewsProvider {
  readonly name = 'NaverNewsProvider';

  private config: NaverNewsConfig;
  private baseUrl = 'https://openapi.naver.com/v1/search/news.json';

  constructor(config: NaverNewsConfig) {
    this.config = config;
  }

  /**
   * 네이버 뉴스 검색 API 호출
   */
  private async fetchNews(query: string, display: number = 10): Promise<NaverNewsItem[]> {
    const params = new URLSearchParams({
      query,
      display: String(Math.min(display, 100)),
      sort: 'date',
    });

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        'X-Naver-Client-Id': this.config.clientId,
        'X-Naver-Client-Secret': this.config.clientSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`네이버 뉴스 API 오류: ${response.status}`);
    }

    const data: NaverNewsResponse = await response.json();
    return data.items;
  }

  /**
   * NaverNewsItem을 News로 변환
   */
  private convertToNews(item: NaverNewsItem): News {
    const title = stripHtml(item.title);
    const summary = stripHtml(item.description);

    return {
      id: `naver-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      summary,
      url: item.originallink || item.link,
      source: '네이버뉴스',
      publishedAt: new Date(item.pubDate).getTime(),
      sentiment: analyzeSentiment(title + ' ' + summary),
    };
  }

  /**
   * 종목코드로 종목명 조회
   */
  private getStockName(symbol: string): string | null {
    return SYMBOL_NAME_MAP[symbol] || null;
  }

  /**
   * 종목별 뉴스 조회
   */
  async getNewsBySymbol(symbol: string, limit: number = 10): Promise<News[]> {
    const stockName = this.getStockName(symbol);
    if (!stockName) {
      // 종목명을 모르면 종목코드로 검색
      return this.searchNews(symbol, limit);
    }

    try {
      const items = await this.fetchNews(`${stockName} 주식`, limit);
      return items.map((item) => this.convertToNews(item));
    } catch {
      return [];
    }
  }

  /**
   * 여러 종목 뉴스 조회
   */
  async getNewsBySymbols(symbols: string[], limit: number = 20): Promise<News[]> {
    const newsPerSymbol = Math.ceil(limit / symbols.length);
    const allNews: News[] = [];

    for (const symbol of symbols) {
      const news = await this.getNewsBySymbol(symbol, newsPerSymbol);
      allNews.push(...news);
    }

    return allNews
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, limit);
  }

  /**
   * 최신 뉴스 조회 (증시 전반)
   */
  async getLatestNews(limit: number = 20): Promise<News[]> {
    try {
      const items = await this.fetchNews('증시 코스피 코스닥', limit);
      return items.map((item) => this.convertToNews(item));
    } catch {
      return [];
    }
  }

  /**
   * 뉴스 검색
   */
  async searchNews(query: string, limit: number = 20): Promise<News[]> {
    try {
      const items = await this.fetchNews(query, limit);
      return items.map((item) => this.convertToNews(item));
    } catch {
      return [];
    }
  }
}

/**
 * 환경변수에서 NaverNewsProvider 생성
 */
export function createNaverNewsProvider(): NaverNewsProvider | null {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('네이버 API 환경변수가 설정되지 않았습니다.');
    return null;
  }

  return new NaverNewsProvider({
    clientId,
    clientSecret,
  });
}

/**
 * 싱글톤 인스턴스 (환경변수 기반)
 */
export const naverNewsProvider = createNaverNewsProvider();
