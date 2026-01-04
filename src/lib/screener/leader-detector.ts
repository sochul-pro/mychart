/**
 * 주도주 발굴 로직
 * 5개 순위 API 데이터를 교집합하여 주도주 선정
 */

import type {
  RankingItem,
  RankingResult,
  RankingType,
  RankingWeights,
  SelectedRankings,
  LeaderStock,
  ScreenerSignal,
} from '@/types';
import { DEFAULT_RANKING_WEIGHTS as defaultWeights, DEFAULT_SELECTED_RANKINGS } from '@/types/screener';

// 순위 기준값 (50위까지 점수 부여)
const RANK_BASE = 50;

/**
 * 순위별 점수 계산
 * 공식: (50 - 순위) * 가중치
 * 예) 순위 1위, 가중치 25 → (50 - 1) * 25 = 1225점
 * 예) 순위 30위, 가중치 25 → (50 - 30) * 25 = 500점
 * 예) 순위 50위 이상 → 0점
 */
export function calculateRankScore(
  rank: number | undefined,
  weight: number
): number {
  if (rank === undefined || rank <= 0) return 0;
  if (rank >= RANK_BASE) return 0;

  // 점수 = (50 - 순위) * 가중치
  return (RANK_BASE - rank) * weight;
}

/**
 * 초기 LeaderStock 객체 생성
 */
function initLeaderStock(item: RankingItem): LeaderStock {
  return {
    symbol: item.symbol,
    name: item.name,
    market: item.market,
    rankingCount: 0,
    price: item.price,
    changePercent: item.changePercent,
    volume: item.volume,
    amount: item.amount,
    score: 0,
    signals: [],
  };
}

/**
 * 순위 정보 업데이트
 */
function updateRankInfo(
  stock: LeaderStock,
  type: RankingType,
  item: RankingItem
): void {
  // 시세 정보 업데이트 (더 최신 데이터로)
  stock.price = item.price || stock.price;
  stock.changePercent = item.changePercent || stock.changePercent;
  stock.volume = item.volume || stock.volume;
  if (item.amount) stock.amount = item.amount;

  // 순위 정보 업데이트
  switch (type) {
    case 'change':
      if (!stock.changeRank) {
        stock.changeRank = item.rank;
        stock.rankingCount++;
      }
      break;
    case 'turnover':
      if (!stock.turnoverRank) {
        stock.turnoverRank = item.rank;
        stock.rankingCount++;
      }
      break;
    case 'amount':
      if (!stock.amountRank) {
        stock.amountRank = item.rank;
        stock.rankingCount++;
      }
      break;
    case 'foreign':
      if (!stock.foreignRank) {
        stock.foreignRank = item.rank;
        stock.rankingCount++;
      }
      break;
    case 'popularity':
      if (!stock.popularityRank) {
        stock.popularityRank = item.rank;
        stock.rankingCount++;
      }
      break;
  }
}

/**
 * 종합 점수 계산
 * 공식: 항목별 점수의 합 (선택된 순위 조건만 계산)
 * 항목별 점수 = (50 - 순위) * 가중치
 *
 * 예시 (기본 가중치 20):
 * - 등락률 1위, 거래량 5위, 거래대금 10위, 인기도 3위, 외인 미포함
 * - (50-1)*20 + (50-5)*20 + (50-10)*20 + (50-3)*20 + 0 = 980 + 900 + 800 + 940 = 3620점
 */
export function calculateTotalScore(
  stock: LeaderStock,
  weights: RankingWeights = defaultWeights,
  selectedRankings: SelectedRankings = DEFAULT_SELECTED_RANKINGS
): number {
  // 개별 순위 점수 (선택된 순위만 계산)
  const changeScore = selectedRankings.change
    ? calculateRankScore(stock.changeRank, weights.changeWeight)
    : 0;
  const turnoverScore = selectedRankings.turnover
    ? calculateRankScore(stock.turnoverRank, weights.turnoverWeight)
    : 0;
  const amountScore = selectedRankings.amount
    ? calculateRankScore(stock.amountRank, weights.amountWeight)
    : 0;
  const foreignScore = selectedRankings.foreign
    ? calculateRankScore(stock.foreignRank, weights.foreignWeight)
    : 0;
  const popularityScore = selectedRankings.popularity
    ? calculateRankScore(stock.popularityRank, weights.popularityWeight)
    : 0;

  // 최종 점수 = 선택된 항목별 점수의 합
  return changeScore + turnoverScore + amountScore + foreignScore + popularityScore;
}

/**
 * 선택된 순위 조건 기준 rankingCount 계산
 */
export function calculateRankingCount(
  stock: LeaderStock,
  selectedRankings: SelectedRankings = DEFAULT_SELECTED_RANKINGS
): number {
  let count = 0;
  if (selectedRankings.change && stock.changeRank) count++;
  if (selectedRankings.turnover && stock.turnoverRank) count++;
  if (selectedRankings.amount && stock.amountRank) count++;
  if (selectedRankings.foreign && stock.foreignRank) count++;
  if (selectedRankings.popularity && stock.popularityRank) count++;
  return count;
}

/**
 * 주도주 신호 생성
 */
export function generateLeaderSignals(stock: LeaderStock): ScreenerSignal[] {
  const signals: ScreenerSignal[] = [];

  // 다중 순위 신호 (가장 강력한 신호) - 5개 순위 기준
  if (stock.rankingCount >= 5) {
    signals.push({
      type: 'multi_rank',
      message: '5개 순위 상위',
      strength: 'strong',
    });
  } else if (stock.rankingCount >= 4) {
    signals.push({
      type: 'multi_rank',
      message: '4개 순위 상위',
      strength: 'strong',
    });
  } else if (stock.rankingCount >= 3) {
    signals.push({
      type: 'multi_rank',
      message: '3개 순위 상위',
      strength: 'strong',
    });
  } else if (stock.rankingCount >= 2) {
    signals.push({
      type: 'multi_rank',
      message: '2개 순위 상위',
      strength: 'medium',
    });
  }

  // 등락률 순위 신호
  if (stock.changeRank && stock.changeRank <= 10) {
    signals.push({
      type: 'price',
      message: `등락률 ${stock.changeRank}위`,
      strength: stock.changeRank <= 5 ? 'strong' : 'medium',
    });
  }

  // 거래대금 순위 신호
  if (stock.amountRank && stock.amountRank <= 10) {
    signals.push({
      type: 'volume',
      message: `거래대금 ${stock.amountRank}위`,
      strength: stock.amountRank <= 5 ? 'strong' : 'medium',
    });
  }

  // 외인/기관 순매수 신호
  if (stock.foreignRank && stock.foreignRank <= 10) {
    signals.push({
      type: 'foreign',
      message: `외인/기관 ${stock.foreignRank}위`,
      strength: stock.foreignRank <= 5 ? 'strong' : 'medium',
    });
  }

  // 인기도 순위 신호 (회전율 기반)
  if (stock.popularityRank && stock.popularityRank <= 10) {
    signals.push({
      type: 'volume', // 인기도 신호도 volume 타입으로 표시
      message: `인기도 ${stock.popularityRank}위`,
      strength: stock.popularityRank <= 5 ? 'strong' : 'medium',
    });
  }

  return signals;
}

/**
 * 주도주 발굴 메인 함수
 * 5개 순위 데이터를 교집합하여 점수 기반으로 주도주 선정
 */
export function detectLeaderStocks(
  rankings: Map<RankingType, RankingResult>,
  weights: RankingWeights = defaultWeights,
  selectedRankings: SelectedRankings = DEFAULT_SELECTED_RANKINGS
): LeaderStock[] {
  // 종목별 정보 병합
  const stockMap = new Map<string, LeaderStock>();

  // 선택된 순위 데이터만 처리
  for (const [type, result] of rankings) {
    // 선택되지 않은 순위는 건너뜀
    if (!selectedRankings[type]) continue;

    for (const item of result.items) {
      let stock = stockMap.get(item.symbol);
      if (!stock) {
        stock = initLeaderStock(item);
        stockMap.set(item.symbol, stock);
      }
      updateRankInfo(stock, type, item);
    }
  }

  // 점수 계산 및 신호 생성
  const leaders = Array.from(stockMap.values())
    .map((stock) => {
      // 선택된 순위 기준으로 rankingCount 재계산
      stock.rankingCount = calculateRankingCount(stock, selectedRankings);
      stock.score = calculateTotalScore(stock, weights, selectedRankings);
      stock.signals = generateLeaderSignals(stock);
      return stock;
    })
    // 점수가 0 이상인 것만 필터링 (선택된 순위에 하나도 등장하지 않으면 제외)
    .filter((stock) => stock.score > 0)
    // 점수 기준 내림차순 정렬
    .sort((a, b) => {
      // 1차: 점수
      if (b.score !== a.score) return b.score - a.score;
      // 2차: 순위 등장 횟수
      if (b.rankingCount !== a.rankingCount) return b.rankingCount - a.rankingCount;
      // 3차: 등락률
      return b.changePercent - a.changePercent;
    });

  return leaders;
}

/**
 * 필터 적용
 */
export function filterLeaderStocks(
  stocks: LeaderStock[],
  options: {
    market?: 'KOSPI' | 'KOSDAQ' | 'all';
    minRankingCount?: number;
    minScore?: number;
  } = {}
): LeaderStock[] {
  return stocks.filter((stock) => {
    // 시장 필터
    if (options.market && options.market !== 'all') {
      if (stock.market !== options.market) return false;
    }

    // 최소 순위 등장 횟수 필터
    if (options.minRankingCount && stock.rankingCount < options.minRankingCount) {
      return false;
    }

    // 최소 점수 필터
    if (options.minScore && stock.score < options.minScore) {
      return false;
    }

    return true;
  });
}
