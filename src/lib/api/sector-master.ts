/**
 * 종목-섹터 매핑 마스터 데이터
 * KRX 업종 분류 기준
 */

import type { SectorCode } from '@/types/sector';
import { SECTORS, getSectorCodeByName } from '@/types/sector';

// 종목코드 → 섹터코드 매핑
export const STOCK_SECTOR_MAP: Record<string, SectorCode> = {
  // 전기전자 (ELEC) - 반도체, 디스플레이, 전자부품
  '005930': 'ELEC',  // 삼성전자
  '000660': 'ELEC',  // SK하이닉스
  '373220': 'ELEC',  // LG에너지솔루션
  '006400': 'ELEC',  // 삼성SDI
  '066570': 'ELEC',  // LG전자
  '009150': 'ELEC',  // 삼성전기
  '034730': 'ELEC',  // SK스퀘어
  '402340': 'ELEC',  // SK스퀘어 (가상 중복)
  '000990': 'ELEC',  // DB하이텍
  '042700': 'ELEC',  // 한미반도체

  // 화학 (CHEM) - 석유화학, 2차전지 소재
  '051910': 'CHEM',  // LG화학
  '247540': 'CHEM',  // 에코프로비엠
  '086520': 'CHEM',  // 에코프로
  '003670': 'CHEM',  // 포스코퓨처엠 (2차전지 소재)
  '006800': 'CHEM',  // 미래에셋대우 → 대림산업? 수정필요
  '010950': 'CHEM',  // S-Oil
  '011170': 'CHEM',  // 롯데케미칼
  '011780': 'CHEM',  // 금호석유

  // 의약품/바이오 (PHARMA)
  '207940': 'PHARMA', // 삼성바이오로직스
  '028300': 'PHARMA', // HLB
  '068270': 'PHARMA', // 셀트리온
  '091990': 'PHARMA', // 셀트리온헬스케어
  '326030': 'PHARMA', // SK바이오팜
  '145020': 'PHARMA', // 휴젤
  '196170': 'PHARMA', // 알테오젠
  '141080': 'PHARMA', // 레고켐바이오
  '000100': 'PHARMA', // 유한양행
  '128940': 'PHARMA', // 한미약품

  // 운수장비/자동차 (AUTO)
  '005380': 'AUTO',  // 현대차
  '000270': 'AUTO',  // 기아
  '012330': 'AUTO',  // 현대모비스
  '018880': 'AUTO',  // 한온시스템
  '161390': 'AUTO',  // 한국타이어앤테크놀로지
  '011210': 'AUTO',  // 현대위아

  // 철강금속 (STEEL)
  '005490': 'STEEL', // POSCO홀딩스
  '004020': 'STEEL', // 현대제철
  '103140': 'STEEL', // 풍산

  // 금융업 (FINANCE)
  '323410': 'FINANCE', // 카카오뱅크
  '055550': 'FINANCE', // 신한지주
  '105560': 'FINANCE', // KB금융
  '086790': 'FINANCE', // 하나금융지주
  '316140': 'FINANCE', // 우리금융지주
  '024110': 'FINANCE', // 기업은행
  '005830': 'FINANCE', // DB손해보험
  '000810': 'FINANCE', // 삼성화재
  '032830': 'FINANCE', // 삼성생명
  '139480': 'FINANCE', // 이마트

  // 서비스업 (SERVICE) - 인터넷, 플랫폼
  '035420': 'SERVICE', // NAVER
  '035720': 'SERVICE', // 카카오
  '036570': 'SERVICE', // 엔씨소프트
  '251270': 'SERVICE', // 넷마블
  '259960': 'SERVICE', // 크래프톤

  // 미디어/엔터 (MEDIA)
  '352820': 'MEDIA',   // 하이브
  '041510': 'MEDIA',   // SM
  '122870': 'MEDIA',   // YG엔터테인먼트
  '035900': 'MEDIA',   // JYP Ent.
  '034120': 'MEDIA',   // SBS

  // 건설업 (CONSTRUCT)
  '000720': 'CONSTRUCT', // 현대건설
  '047040': 'CONSTRUCT', // 대우건설
  '006360': 'CONSTRUCT', // GS건설
  '028050': 'CONSTRUCT', // 삼성엔지니어링

  // 통신업 (TELECOM)
  '017670': 'TELECOM', // SK텔레콤
  '030200': 'TELECOM', // KT
  '032640': 'TELECOM', // LG유플러스

  // 유통업 (RETAIL)
  '004170': 'RETAIL',  // 신세계
  '023530': 'RETAIL',  // 롯데쇼핑
  '069960': 'RETAIL',  // 현대백화점

  // 음식료품 (FOOD)
  '097950': 'FOOD',    // CJ제일제당
  '271560': 'FOOD',    // 오리온
  '007310': 'FOOD',    // 오뚜기
  '005180': 'FOOD',    // 빙그레

  // IT/소프트웨어 (IT)
  '034220': 'IT',      // LG디스플레이
  '263750': 'IT',      // 펄어비스
  '112040': 'IT',      // 위메이드

  // 기계 (MACHINE)
  '010140': 'MACHINE', // 삼성중공업
  '042660': 'MACHINE', // 한화오션
  '009540': 'MACHINE', // 한국조선해양
  '329180': 'MACHINE', // 현대중공업
  '012450': 'MACHINE', // 한화에어로스페이스
  '047810': 'MACHINE', // 한국항공우주

  // 전기가스업 (UTILITY)
  '015760': 'UTILITY', // 한국전력
  '036460': 'UTILITY', // 한국가스공사
};

// 한글 섹터명 → 섹터코드 변환 맵
const SECTOR_NAME_TO_CODE: Record<string, SectorCode> = {
  '전기전자': 'ELEC',
  '화학': 'CHEM',
  '의약품': 'PHARMA',
  '바이오': 'PHARMA',
  '운수장비': 'AUTO',
  '자동차': 'AUTO',
  '철강금속': 'STEEL',
  '금융업': 'FINANCE',
  '금융': 'FINANCE',
  '서비스업': 'SERVICE',
  '서비스': 'SERVICE',
  '건설업': 'CONSTRUCT',
  '건설': 'CONSTRUCT',
  '음식료품': 'FOOD',
  '음식료': 'FOOD',
  '유통업': 'RETAIL',
  '유통': 'RETAIL',
  '통신업': 'TELECOM',
  '통신': 'TELECOM',
  '전기가스업': 'UTILITY',
  '전기가스': 'UTILITY',
  '기계': 'MACHINE',
  '운수창고업': 'TRANSPORT',
  'IT': 'IT',
  '소프트웨어': 'IT',
  '미디어': 'MEDIA',
  '엔터테인먼트': 'MEDIA',
  '기타': 'ETC',
};

/**
 * 종목코드로 섹터코드 조회
 */
export function getSectorCode(symbol: string): SectorCode {
  return STOCK_SECTOR_MAP[symbol] || 'ETC';
}

/**
 * 종목코드로 섹터 정보 조회
 */
export function getSectorInfo(symbol: string) {
  const code = getSectorCode(symbol);
  return SECTORS[code];
}

/**
 * 한글 섹터명을 섹터코드로 변환
 */
export function convertSectorNameToCode(name: string): SectorCode {
  return SECTOR_NAME_TO_CODE[name] || getSectorCodeByName(name) || 'ETC';
}

/**
 * 섹터코드로 해당 섹터의 종목 목록 조회
 */
export function getStocksBySector(sectorCode: SectorCode): string[] {
  return Object.entries(STOCK_SECTOR_MAP)
    .filter(([, code]) => code === sectorCode)
    .map(([symbol]) => symbol);
}

/**
 * 모든 섹터별 종목 수 조회
 */
export function getSectorStockCounts(): Record<SectorCode, number> {
  const counts: Partial<Record<SectorCode, number>> = {};

  for (const code of Object.values(STOCK_SECTOR_MAP)) {
    counts[code] = (counts[code] || 0) + 1;
  }

  // 모든 섹터코드에 대해 0으로 초기화
  const result: Record<SectorCode, number> = {} as Record<SectorCode, number>;
  for (const code of Object.keys(SECTORS) as SectorCode[]) {
    result[code] = counts[code] || 0;
  }

  return result;
}

/**
 * 매핑된 전체 종목 수
 */
export function getTotalMappedStocks(): number {
  return Object.keys(STOCK_SECTOR_MAP).length;
}
