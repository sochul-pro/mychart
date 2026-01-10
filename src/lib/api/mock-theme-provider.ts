import type { Theme, ThemeSummary, LeadingStock } from '@/types';
import type { ThemeProvider } from './theme-provider';

/**
 * Mock 테마 데이터
 */
const MOCK_THEMES: Theme[] = [
  {
    id: '1',
    name: '2차전지(소재/부품)',
    changePercent: 5.23,
    stockCount: 35,
    advanceCount: 28,
    unchangedCount: 3,
    declineCount: 4,
    leadingStocks: [
      { symbol: '373220', name: 'LG에너지솔루션', price: 420000, changePercent: 6.2 },
      { symbol: '006400', name: '삼성SDI', price: 450000, changePercent: 5.8 },
      { symbol: '247540', name: '에코프로비엠', price: 280000, changePercent: 4.5 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: 'AI(인공지능)',
    changePercent: 4.87,
    stockCount: 42,
    advanceCount: 35,
    unchangedCount: 4,
    declineCount: 3,
    leadingStocks: [
      { symbol: '005930', name: '삼성전자', price: 75300, changePercent: 3.2 },
      { symbol: '000660', name: 'SK하이닉스', price: 178500, changePercent: 4.8 },
      { symbol: '035420', name: 'NAVER', price: 215000, changePercent: 2.1 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '3',
    name: '반도체',
    changePercent: 3.45,
    stockCount: 28,
    advanceCount: 22,
    unchangedCount: 2,
    declineCount: 4,
    leadingStocks: [
      { symbol: '005930', name: '삼성전자', price: 75300, changePercent: 3.2 },
      { symbol: '000660', name: 'SK하이닉스', price: 178500, changePercent: 4.8 },
      { symbol: '042700', name: '한미반도체', price: 89200, changePercent: 5.3 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '4',
    name: '로봇',
    changePercent: 2.87,
    stockCount: 18,
    advanceCount: 14,
    unchangedCount: 2,
    declineCount: 2,
    leadingStocks: [
      { symbol: '108860', name: '셀바스AI', price: 8500, changePercent: 6.1 },
      { symbol: '298040', name: '효성중공업', price: 185000, changePercent: 3.2 },
      { symbol: '090460', name: '비에이치', price: 23500, changePercent: 2.8 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '5',
    name: '바이오/제약',
    changePercent: 1.45,
    stockCount: 65,
    advanceCount: 40,
    unchangedCount: 10,
    declineCount: 15,
    leadingStocks: [
      { symbol: '207940', name: '삼성바이오로직스', price: 850000, changePercent: 1.8 },
      { symbol: '068270', name: '셀트리온', price: 165000, changePercent: 2.1 },
      { symbol: '326030', name: '셀트리온헬스케어', price: 68500, changePercent: 1.5 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '6',
    name: '엔터테인먼트',
    changePercent: 0.87,
    stockCount: 22,
    advanceCount: 12,
    unchangedCount: 5,
    declineCount: 5,
    leadingStocks: [
      { symbol: '352820', name: '하이브', price: 285000, changePercent: 1.2 },
      { symbol: '122870', name: 'YG엔터테인먼트', price: 58000, changePercent: 0.8 },
      { symbol: '041510', name: 'SM', price: 95000, changePercent: 0.5 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '7',
    name: '게임',
    changePercent: -0.32,
    stockCount: 15,
    advanceCount: 6,
    unchangedCount: 3,
    declineCount: 6,
    leadingStocks: [
      { symbol: '251270', name: '넷마블', price: 52000, changePercent: 0.8 },
      { symbol: '263750', name: '펄어비스', price: 42500, changePercent: -1.2 },
      { symbol: '112040', name: '위메이드', price: 38000, changePercent: -0.5 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '8',
    name: '건설',
    changePercent: -1.23,
    stockCount: 25,
    advanceCount: 8,
    unchangedCount: 5,
    declineCount: 12,
    leadingStocks: [
      { symbol: '000720', name: '현대건설', price: 42000, changePercent: -0.8 },
      { symbol: '028260', name: '삼성물산', price: 128000, changePercent: -1.5 },
      { symbol: '047040', name: '대우건설', price: 4850, changePercent: -2.1 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '9',
    name: '조선',
    changePercent: -2.45,
    stockCount: 12,
    advanceCount: 3,
    unchangedCount: 2,
    declineCount: 7,
    leadingStocks: [
      { symbol: '009540', name: '한국조선해양', price: 125000, changePercent: -2.8 },
      { symbol: '010140', name: '삼성중공업', price: 8500, changePercent: -3.2 },
      { symbol: '042660', name: '대우조선해양', price: 28500, changePercent: -1.8 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '10',
    name: '자동차',
    changePercent: 1.12,
    stockCount: 30,
    advanceCount: 18,
    unchangedCount: 5,
    declineCount: 7,
    leadingStocks: [
      { symbol: '005380', name: '현대차', price: 215000, changePercent: 1.5 },
      { symbol: '000270', name: '기아', price: 92000, changePercent: 1.8 },
      { symbol: '012330', name: '현대모비스', price: 245000, changePercent: 0.8 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '11',
    name: '화장품',
    changePercent: 0.65,
    stockCount: 18,
    advanceCount: 10,
    unchangedCount: 4,
    declineCount: 4,
    leadingStocks: [
      { symbol: '090430', name: '아모레퍼시픽', price: 145000, changePercent: 0.9 },
      { symbol: '051900', name: 'LG생활건강', price: 425000, changePercent: 0.5 },
      { symbol: '285130', name: '클리오', price: 28500, changePercent: 1.2 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '12',
    name: '음식료',
    changePercent: -0.45,
    stockCount: 20,
    advanceCount: 7,
    unchangedCount: 6,
    declineCount: 7,
    leadingStocks: [
      { symbol: '097950', name: 'CJ제일제당', price: 385000, changePercent: -0.3 },
      { symbol: '004370', name: '농심', price: 425000, changePercent: -0.8 },
      { symbol: '005610', name: 'SPC삼립', price: 78500, changePercent: 0.2 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '13',
    name: '철강',
    changePercent: -0.78,
    stockCount: 15,
    advanceCount: 5,
    unchangedCount: 3,
    declineCount: 7,
    leadingStocks: [
      { symbol: '005490', name: 'POSCO홀딩스', price: 385000, changePercent: -0.5 },
      { symbol: '004020', name: '현대제철', price: 38500, changePercent: -1.2 },
      { symbol: '001230', name: '동국S&C', price: 12500, changePercent: -0.8 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '14',
    name: '금융',
    changePercent: 0.35,
    stockCount: 40,
    advanceCount: 20,
    unchangedCount: 10,
    declineCount: 10,
    leadingStocks: [
      { symbol: '105560', name: 'KB금융', price: 68500, changePercent: 0.5 },
      { symbol: '055550', name: '신한지주', price: 42500, changePercent: 0.3 },
      { symbol: '086790', name: '하나금융지주', price: 52000, changePercent: 0.2 },
    ],
    updatedAt: Date.now(),
  },
  {
    id: '15',
    name: '통신',
    changePercent: 0.12,
    stockCount: 8,
    advanceCount: 4,
    unchangedCount: 2,
    declineCount: 2,
    leadingStocks: [
      { symbol: '017670', name: 'SK텔레콤', price: 52000, changePercent: 0.2 },
      { symbol: '030200', name: 'KT', price: 38500, changePercent: 0.1 },
      { symbol: '032640', name: 'LG유플러스', price: 12500, changePercent: -0.1 },
    ],
    updatedAt: Date.now(),
  },
];

/**
 * 추가 Mock 테마 (페이지네이션 테스트용)
 */
function generateMoreThemes(): Theme[] {
  const additionalThemes: Theme[] = [];
  const themeNames = [
    '수소경제', '태양광', '풍력', '원자력', '방위산업',
    '우주항공', '메타버스', 'NFT', '블록체인', '클라우드',
    '5G', '자율주행', '드론', '스마트팩토리', 'ESG',
    '친환경차', '수소차', '전기차충전', '리튬', '희토류',
  ];

  themeNames.forEach((name, index) => {
    const changePercent = (Math.random() - 0.5) * 10;
    const stockCount = Math.floor(Math.random() * 30) + 10;
    const advanceCount = Math.floor(stockCount * (0.3 + Math.random() * 0.4));
    const declineCount = Math.floor((stockCount - advanceCount) * 0.7);
    const unchangedCount = stockCount - advanceCount - declineCount;

    additionalThemes.push({
      id: String(16 + index),
      name,
      changePercent: Number(changePercent.toFixed(2)),
      stockCount,
      advanceCount,
      unchangedCount,
      declineCount,
      leadingStocks: generateMockLeadingStocks(3),
      updatedAt: Date.now(),
    });
  });

  return additionalThemes;
}

/**
 * Mock 주도주 생성
 */
function generateMockLeadingStocks(count: number): LeadingStock[] {
  const stocks: LeadingStock[] = [];
  const names = ['삼성전자', 'SK하이닉스', 'LG에너지솔루션', 'NAVER', '카카오'];

  for (let i = 0; i < count; i++) {
    stocks.push({
      symbol: String(Math.floor(Math.random() * 900000) + 100000),
      name: names[i % names.length] || `종목${i + 1}`,
      price: Math.floor(Math.random() * 500000) + 10000,
      changePercent: Number(((Math.random() - 0.3) * 10).toFixed(2)),
    });
  }

  return stocks;
}

/**
 * Mock 테마 Provider
 * 개발 및 테스트용
 */
export class MockThemeProvider implements ThemeProvider {
  readonly name = 'MockThemeProvider';

  private allThemes: Theme[];
  private pageSize = 20;

  constructor() {
    this.allThemes = [...MOCK_THEMES, ...generateMoreThemes()];
  }

  /**
   * 테마 목록 조회 (페이지별)
   */
  async getThemes(page: number = 1): Promise<Theme[]> {
    // 약간의 지연 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 100));

    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;

    return this.allThemes.slice(start, end);
  }

  /**
   * 전체 테마 목록 조회
   */
  async getAllThemes(): Promise<Theme[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.allThemes;
  }

  /**
   * 테마 상세 조회
   */
  async getThemeById(themeId: string): Promise<Theme | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return this.allThemes.find((t) => t.id === themeId) || null;
  }

  /**
   * 테마 요약 정보
   */
  async getThemeSummary(): Promise<ThemeSummary> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const sorted = [...this.allThemes].sort((a, b) => b.changePercent - a.changePercent);
    const advanceThemes = this.allThemes.filter((t) => t.changePercent > 0).length;
    const declineThemes = this.allThemes.filter((t) => t.changePercent < 0).length;

    // 핫 테마: 종목수가 가장 많은 테마
    const hotTheme = [...this.allThemes].sort((a, b) => b.stockCount - a.stockCount)[0] || null;

    return {
      hotTheme,
      topGainer: sorted[0] || null,
      topLoser: sorted[sorted.length - 1] || null,
      totalThemes: this.allThemes.length,
      advanceThemes,
      declineThemes,
    };
  }

  /**
   * 전체 테마 수
   */
  async getTotalThemeCount(): Promise<number> {
    return this.allThemes.length;
  }
}

/**
 * Mock 테마 Provider 싱글톤
 */
export const mockThemeProvider = new MockThemeProvider();
