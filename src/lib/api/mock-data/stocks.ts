import type { StockInfo } from '@/types';

/** 주요 종목 마스터 데이터 */
export const MOCK_STOCKS: StockInfo[] = [
  // 대형주
  { symbol: '005930', name: '삼성전자', market: 'KOSPI', sector: '전기전자' },
  { symbol: '000660', name: 'SK하이닉스', market: 'KOSPI', sector: '전기전자' },
  { symbol: '373220', name: 'LG에너지솔루션', market: 'KOSPI', sector: '전기전자' },
  { symbol: '207940', name: '삼성바이오로직스', market: 'KOSPI', sector: '의약품' },
  { symbol: '005380', name: '현대차', market: 'KOSPI', sector: '운수장비' },
  { symbol: '006400', name: '삼성SDI', market: 'KOSPI', sector: '전기전자' },
  { symbol: '051910', name: 'LG화학', market: 'KOSPI', sector: '화학' },
  { symbol: '035420', name: 'NAVER', market: 'KOSPI', sector: '서비스업' },
  { symbol: '000270', name: '기아', market: 'KOSPI', sector: '운수장비' },
  { symbol: '035720', name: '카카오', market: 'KOSPI', sector: '서비스업' },

  // 코스닥
  { symbol: '247540', name: '에코프로비엠', market: 'KOSDAQ', sector: '화학' },
  { symbol: '086520', name: '에코프로', market: 'KOSDAQ', sector: '화학' },
  { symbol: '028300', name: 'HLB', market: 'KOSDAQ', sector: '의약품' },
  { symbol: '323410', name: '카카오뱅크', market: 'KOSPI', sector: '금융업' },
  { symbol: '352820', name: '하이브', market: 'KOSPI', sector: '서비스업' },

  // 추가 종목
  { symbol: '003670', name: '포스코퓨처엠', market: 'KOSPI', sector: '철강금속' },
  { symbol: '066570', name: 'LG전자', market: 'KOSPI', sector: '전기전자' },
  { symbol: '012330', name: '현대모비스', market: 'KOSPI', sector: '운수장비' },
  { symbol: '055550', name: '신한지주', market: 'KOSPI', sector: '금융업' },
  { symbol: '105560', name: 'KB금융', market: 'KOSPI', sector: '금융업' },
];

/** 종목 코드로 검색 */
export function findStockBySymbol(symbol: string): StockInfo | undefined {
  return MOCK_STOCKS.find((s) => s.symbol === symbol);
}

/** 종목명/코드로 검색 */
export function searchStocks(query: string): StockInfo[] {
  const q = query.toLowerCase();
  return MOCK_STOCKS.filter(
    (s) => s.symbol.includes(q) || s.name.toLowerCase().includes(q)
  );
}
