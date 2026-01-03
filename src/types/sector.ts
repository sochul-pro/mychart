/**
 * KRX 표준 업종 분류 코드
 * KOSPI/KOSDAQ 공통 업종 분류 체계
 */

// 업종 코드 타입
export type SectorCode =
  | 'ELEC'      // 전기전자
  | 'CHEM'      // 화학
  | 'PHARMA'    // 의약품/바이오
  | 'AUTO'      // 운수장비/자동차
  | 'STEEL'     // 철강금속
  | 'FINANCE'   // 금융업
  | 'SERVICE'   // 서비스업
  | 'CONSTRUCT' // 건설업
  | 'FOOD'      // 음식료품
  | 'RETAIL'    // 유통업
  | 'TELECOM'   // 통신업
  | 'UTILITY'   // 전기가스업
  | 'MACHINE'   // 기계
  | 'TRANSPORT' // 운수창고업
  | 'IT'        // IT/소프트웨어
  | 'MEDIA'     // 미디어/엔터
  | 'ETC';      // 기타

// 업종 정보
export interface Sector {
  code: SectorCode;
  name: string;          // 한글명
  nameEn: string;        // 영문명
  description?: string;  // 설명
}

// 업종별 종목 그룹
export interface SectorGroup {
  sector: Sector;
  stockCount: number;
  stocks: string[];      // 종목 코드 배열
}

// 업종별 시세 요약
export interface SectorSummary {
  sector: Sector;
  stockCount: number;
  avgChangePercent: number;  // 평균 등락률
  advanceCount: number;      // 상승 종목 수
  declineCount: number;      // 하락 종목 수
  unchangedCount: number;    // 보합 종목 수
  totalVolume: number;       // 총 거래량
  hotStocks: string[];       // 핫 종목 (상위 5개)
}

// 업종 마스터 데이터
export const SECTORS: Record<SectorCode, Sector> = {
  ELEC: {
    code: 'ELEC',
    name: '전기전자',
    nameEn: 'Electronics',
    description: '반도체, 디스플레이, 전자부품, 가전',
  },
  CHEM: {
    code: 'CHEM',
    name: '화학',
    nameEn: 'Chemicals',
    description: '석유화학, 정밀화학, 2차전지 소재',
  },
  PHARMA: {
    code: 'PHARMA',
    name: '의약품',
    nameEn: 'Pharmaceuticals',
    description: '제약, 바이오, 헬스케어',
  },
  AUTO: {
    code: 'AUTO',
    name: '운수장비',
    nameEn: 'Automobiles',
    description: '완성차, 자동차부품',
  },
  STEEL: {
    code: 'STEEL',
    name: '철강금속',
    nameEn: 'Steel & Metal',
    description: '철강, 비철금속, 금속가공',
  },
  FINANCE: {
    code: 'FINANCE',
    name: '금융업',
    nameEn: 'Finance',
    description: '은행, 증권, 보험, 카드',
  },
  SERVICE: {
    code: 'SERVICE',
    name: '서비스업',
    nameEn: 'Services',
    description: '인터넷, 플랫폼, 교육',
  },
  CONSTRUCT: {
    code: 'CONSTRUCT',
    name: '건설업',
    nameEn: 'Construction',
    description: '건설, 건자재',
  },
  FOOD: {
    code: 'FOOD',
    name: '음식료품',
    nameEn: 'Food & Beverage',
    description: '식품, 음료, 주류',
  },
  RETAIL: {
    code: 'RETAIL',
    name: '유통업',
    nameEn: 'Retail',
    description: '백화점, 마트, 이커머스',
  },
  TELECOM: {
    code: 'TELECOM',
    name: '통신업',
    nameEn: 'Telecommunications',
    description: '통신서비스, 통신장비',
  },
  UTILITY: {
    code: 'UTILITY',
    name: '전기가스업',
    nameEn: 'Utilities',
    description: '전력, 가스, 에너지',
  },
  MACHINE: {
    code: 'MACHINE',
    name: '기계',
    nameEn: 'Machinery',
    description: '산업기계, 조선, 방산',
  },
  TRANSPORT: {
    code: 'TRANSPORT',
    name: '운수창고업',
    nameEn: 'Transportation',
    description: '해운, 항공, 물류',
  },
  IT: {
    code: 'IT',
    name: 'IT',
    nameEn: 'IT/Software',
    description: '소프트웨어, SI, 게임',
  },
  MEDIA: {
    code: 'MEDIA',
    name: '미디어',
    nameEn: 'Media & Entertainment',
    description: '방송, 엔터테인먼트, 광고',
  },
  ETC: {
    code: 'ETC',
    name: '기타',
    nameEn: 'Others',
    description: '기타 업종',
  },
};

// 업종 코드 배열
export const SECTOR_CODES = Object.keys(SECTORS) as SectorCode[];

// 업종명으로 코드 찾기
export function getSectorCodeByName(name: string): SectorCode | undefined {
  const entry = Object.entries(SECTORS).find(
    ([, sector]) => sector.name === name
  );
  return entry ? (entry[0] as SectorCode) : undefined;
}

// 업종 코드로 정보 가져오기
export function getSectorByCode(code: SectorCode): Sector {
  return SECTORS[code];
}
