/**
 * 종목 마스터 데이터
 * 종목 검색에 사용되는 기본 종목 정보
 * - 정적 마스터: 기본 80+ 종목
 * - 동적 마스터: API로 조회된 종목 자동 추가
 */

import type { StockInfo } from '@/types';
import * as fs from 'fs';
import * as path from 'path';

// 동적 종목 저장 파일 경로
const DYNAMIC_STOCKS_PATH = path.join(process.cwd(), 'data', 'dynamic-stocks.json');

// 메모리 캐시 (동적 종목)
let dynamicStocksCache: StockInfo[] | null = null;

/** 주요 종목 마스터 데이터 (80+ 종목) */
export const STOCK_MASTER: StockInfo[] = [
  // 전기전자 (ELEC) - 반도체, 디스플레이, 전자부품
  { symbol: '005930', name: '삼성전자', market: 'KOSPI', sector: '전기전자' },
  { symbol: '000660', name: 'SK하이닉스', market: 'KOSPI', sector: '전기전자' },
  { symbol: '373220', name: 'LG에너지솔루션', market: 'KOSPI', sector: '전기전자' },
  { symbol: '006400', name: '삼성SDI', market: 'KOSPI', sector: '전기전자' },
  { symbol: '066570', name: 'LG전자', market: 'KOSPI', sector: '전기전자' },
  { symbol: '009150', name: '삼성전기', market: 'KOSPI', sector: '전기전자' },
  { symbol: '402340', name: 'SK스퀘어', market: 'KOSPI', sector: '전기전자' },
  { symbol: '000990', name: 'DB하이텍', market: 'KOSPI', sector: '전기전자' },
  { symbol: '042700', name: '한미반도체', market: 'KOSDAQ', sector: '전기전자' },

  // 화학 (CHEM) - 석유화학, 2차전지 소재
  { symbol: '051910', name: 'LG화학', market: 'KOSPI', sector: '화학' },
  { symbol: '247540', name: '에코프로비엠', market: 'KOSDAQ', sector: '화학' },
  { symbol: '086520', name: '에코프로', market: 'KOSDAQ', sector: '화학' },
  { symbol: '003670', name: '포스코퓨처엠', market: 'KOSPI', sector: '화학' },
  { symbol: '034730', name: 'SK', market: 'KOSPI', sector: '화학' },
  { symbol: '010950', name: 'S-Oil', market: 'KOSPI', sector: '화학' },
  { symbol: '011170', name: '롯데케미칼', market: 'KOSPI', sector: '화학' },
  { symbol: '011780', name: '금호석유', market: 'KOSPI', sector: '화학' },

  // 의약품/바이오 (PHARMA)
  { symbol: '207940', name: '삼성바이오로직스', market: 'KOSPI', sector: '의약품' },
  { symbol: '028300', name: 'HLB', market: 'KOSDAQ', sector: '의약품' },
  { symbol: '068270', name: '셀트리온', market: 'KOSPI', sector: '의약품' },
  { symbol: '091990', name: '셀트리온헬스케어', market: 'KOSDAQ', sector: '의약품' },
  { symbol: '326030', name: 'SK바이오팜', market: 'KOSPI', sector: '의약품' },
  { symbol: '145020', name: '휴젤', market: 'KOSDAQ', sector: '의약품' },
  { symbol: '196170', name: '알테오젠', market: 'KOSDAQ', sector: '의약품' },
  { symbol: '141080', name: '레고켐바이오', market: 'KOSDAQ', sector: '의약품' },
  { symbol: '000100', name: '유한양행', market: 'KOSPI', sector: '의약품' },
  { symbol: '128940', name: '한미약품', market: 'KOSPI', sector: '의약품' },

  // 운수장비/자동차 (AUTO)
  { symbol: '005380', name: '현대차', market: 'KOSPI', sector: '운수장비' },
  { symbol: '000270', name: '기아', market: 'KOSPI', sector: '운수장비' },
  { symbol: '012330', name: '현대모비스', market: 'KOSPI', sector: '운수장비' },
  { symbol: '018880', name: '한온시스템', market: 'KOSPI', sector: '운수장비' },
  { symbol: '161390', name: '한국타이어앤테크놀로지', market: 'KOSPI', sector: '운수장비' },
  { symbol: '011210', name: '현대위아', market: 'KOSPI', sector: '운수장비' },

  // 철강금속 (STEEL)
  { symbol: '005490', name: 'POSCO홀딩스', market: 'KOSPI', sector: '철강금속' },
  { symbol: '004020', name: '현대제철', market: 'KOSPI', sector: '철강금속' },
  { symbol: '103140', name: '풍산', market: 'KOSPI', sector: '철강금속' },

  // 금융업 (FINANCE)
  { symbol: '323410', name: '카카오뱅크', market: 'KOSPI', sector: '금융업' },
  { symbol: '055550', name: '신한지주', market: 'KOSPI', sector: '금융업' },
  { symbol: '105560', name: 'KB금융', market: 'KOSPI', sector: '금융업' },
  { symbol: '086790', name: '하나금융지주', market: 'KOSPI', sector: '금융업' },
  { symbol: '316140', name: '우리금융지주', market: 'KOSPI', sector: '금융업' },
  { symbol: '024110', name: '기업은행', market: 'KOSPI', sector: '금융업' },
  { symbol: '005830', name: 'DB손해보험', market: 'KOSPI', sector: '금융업' },
  { symbol: '000810', name: '삼성화재', market: 'KOSPI', sector: '금융업' },
  { symbol: '032830', name: '삼성생명', market: 'KOSPI', sector: '금융업' },
  { symbol: '006800', name: '미래에셋증권', market: 'KOSPI', sector: '금융업' },

  // 서비스업 (SERVICE) - 인터넷, 플랫폼
  { symbol: '035420', name: 'NAVER', market: 'KOSPI', sector: '서비스업' },
  { symbol: '035720', name: '카카오', market: 'KOSPI', sector: '서비스업' },
  { symbol: '036570', name: '엔씨소프트', market: 'KOSPI', sector: '서비스업' },
  { symbol: '251270', name: '넷마블', market: 'KOSPI', sector: '서비스업' },
  { symbol: '259960', name: '크래프톤', market: 'KOSPI', sector: '서비스업' },

  // 미디어/엔터 (MEDIA)
  { symbol: '352820', name: '하이브', market: 'KOSPI', sector: '서비스업' },
  { symbol: '041510', name: 'SM', market: 'KOSDAQ', sector: '서비스업' },
  { symbol: '122870', name: 'YG엔터테인먼트', market: 'KOSDAQ', sector: '서비스업' },
  { symbol: '035900', name: 'JYP Ent.', market: 'KOSDAQ', sector: '서비스업' },
  { symbol: '034120', name: 'SBS', market: 'KOSPI', sector: '서비스업' },

  // 건설업 (CONSTRUCT)
  { symbol: '000720', name: '현대건설', market: 'KOSPI', sector: '건설업' },
  { symbol: '047040', name: '대우건설', market: 'KOSPI', sector: '건설업' },
  { symbol: '006360', name: 'GS건설', market: 'KOSPI', sector: '건설업' },
  { symbol: '028050', name: '삼성엔지니어링', market: 'KOSPI', sector: '건설업' },

  // 통신업 (TELECOM)
  { symbol: '017670', name: 'SK텔레콤', market: 'KOSPI', sector: '통신업' },
  { symbol: '030200', name: 'KT', market: 'KOSPI', sector: '통신업' },
  { symbol: '032640', name: 'LG유플러스', market: 'KOSPI', sector: '통신업' },

  // 유통업 (RETAIL)
  { symbol: '139480', name: '이마트', market: 'KOSPI', sector: '유통업' },
  { symbol: '004170', name: '신세계', market: 'KOSPI', sector: '유통업' },
  { symbol: '023530', name: '롯데쇼핑', market: 'KOSPI', sector: '유통업' },
  { symbol: '069960', name: '현대백화점', market: 'KOSPI', sector: '유통업' },

  // 음식료품 (FOOD)
  { symbol: '097950', name: 'CJ제일제당', market: 'KOSPI', sector: '음식료품' },
  { symbol: '271560', name: '오리온', market: 'KOSPI', sector: '음식료품' },
  { symbol: '007310', name: '오뚜기', market: 'KOSPI', sector: '음식료품' },
  { symbol: '005180', name: '빙그레', market: 'KOSPI', sector: '음식료품' },

  // IT/소프트웨어 (IT)
  { symbol: '034220', name: 'LG디스플레이', market: 'KOSPI', sector: '전기전자' },
  { symbol: '263750', name: '펄어비스', market: 'KOSDAQ', sector: '서비스업' },
  { symbol: '112040', name: '위메이드', market: 'KOSDAQ', sector: '서비스업' },

  // 기계 (MACHINE) - 조선, 방산
  { symbol: '010140', name: '삼성중공업', market: 'KOSPI', sector: '기계' },
  { symbol: '042660', name: '한화오션', market: 'KOSPI', sector: '기계' },
  { symbol: '009540', name: '한국조선해양', market: 'KOSPI', sector: '기계' },
  { symbol: '329180', name: '현대중공업', market: 'KOSPI', sector: '기계' },
  { symbol: '012450', name: '한화에어로스페이스', market: 'KOSPI', sector: '기계' },
  { symbol: '047810', name: '한국항공우주', market: 'KOSPI', sector: '기계' },

  // 전기가스업 (UTILITY)
  { symbol: '015760', name: '한국전력', market: 'KOSPI', sector: '전기가스업' },
  { symbol: '036460', name: '한국가스공사', market: 'KOSPI', sector: '전기가스업' },
];

/**
 * 동적 종목 데이터 로드
 */
function loadDynamicStocks(): StockInfo[] {
  if (dynamicStocksCache !== null) {
    return dynamicStocksCache;
  }

  try {
    if (fs.existsSync(DYNAMIC_STOCKS_PATH)) {
      const data = fs.readFileSync(DYNAMIC_STOCKS_PATH, 'utf-8');
      dynamicStocksCache = JSON.parse(data);
      return dynamicStocksCache || [];
    }
  } catch (error) {
    console.error('Failed to load dynamic stocks:', error);
  }

  dynamicStocksCache = [];
  return [];
}

/**
 * 동적 종목 데이터 저장
 */
function saveDynamicStocks(stocks: StockInfo[]): void {
  try {
    // data 디렉토리 생성
    const dataDir = path.dirname(DYNAMIC_STOCKS_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(DYNAMIC_STOCKS_PATH, JSON.stringify(stocks, null, 2), 'utf-8');
    dynamicStocksCache = stocks;
  } catch (error) {
    console.error('Failed to save dynamic stocks:', error);
  }
}

/**
 * 전체 종목 목록 (정적 + 동적)
 */
export function getAllStocks(): StockInfo[] {
  const dynamicStocks = loadDynamicStocks();

  // 중복 제거 (정적 마스터 우선)
  const staticSymbols = new Set(STOCK_MASTER.map((s) => s.symbol));
  const uniqueDynamicStocks = dynamicStocks.filter((s) => !staticSymbols.has(s.symbol));

  return [...STOCK_MASTER, ...uniqueDynamicStocks];
}

/**
 * 종목 검색
 * 종목명 또는 종목코드로 검색 (대소문자 무시)
 */
export function searchStocks(query: string, limit: number = 10): StockInfo[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const q = query.toLowerCase().trim();
  const allStocks = getAllStocks();

  // 정확히 일치하는 것 우선, 그다음 포함하는 것
  const exactMatches: StockInfo[] = [];
  const partialMatches: StockInfo[] = [];

  for (const stock of allStocks) {
    const symbolMatch = stock.symbol.toLowerCase() === q;
    const nameMatch = stock.name.toLowerCase() === q;

    if (symbolMatch || nameMatch) {
      exactMatches.push(stock);
    } else if (
      stock.symbol.toLowerCase().includes(q) ||
      stock.name.toLowerCase().includes(q)
    ) {
      partialMatches.push(stock);
    }
  }

  return [...exactMatches, ...partialMatches].slice(0, limit);
}

/**
 * 종목코드로 종목 정보 조회
 */
export function findStockBySymbol(symbol: string): StockInfo | undefined {
  return getAllStocks().find((s) => s.symbol === symbol);
}

/**
 * 동적 종목 추가 (API로 조회된 종목)
 * 이미 존재하는 종목은 추가하지 않음
 */
export function addDynamicStock(stock: StockInfo): boolean {
  const allStocks = getAllStocks();

  // 이미 존재하는지 확인
  if (allStocks.some((s) => s.symbol === stock.symbol)) {
    return false;
  }

  const dynamicStocks = loadDynamicStocks();
  dynamicStocks.push(stock);
  saveDynamicStocks(dynamicStocks);

  return true;
}

/**
 * 여러 동적 종목 추가
 */
export function addDynamicStocks(stocks: StockInfo[]): number {
  const allStocks = getAllStocks();
  const existingSymbols = new Set(allStocks.map((s) => s.symbol));

  const newStocks = stocks.filter((s) => !existingSymbols.has(s.symbol));

  if (newStocks.length === 0) {
    return 0;
  }

  const dynamicStocks = loadDynamicStocks();
  dynamicStocks.push(...newStocks);
  saveDynamicStocks(dynamicStocks);

  return newStocks.length;
}

/**
 * 마스터에 종목이 있는지 확인
 */
export function hasStock(symbol: string): boolean {
  return getAllStocks().some((s) => s.symbol === symbol);
}

/**
 * 전체 종목 수
 */
export function getTotalStockCount(): number {
  return getAllStocks().length;
}

/**
 * 동적 종목 수
 */
export function getDynamicStockCount(): number {
  return loadDynamicStocks().length;
}
