import { NextRequest, NextResponse } from 'next/server';
import { stockProvider } from '@/lib/api/provider-factory';
import { KISProvider } from '@/lib/api/kis-provider';
import { detectLeaderStocks, filterLeaderStocks } from '@/lib/screener';
import { getFromMemory, setToMemory, CacheKeys, CACHE_TTL } from '@/lib/api/cache';
import type { ScreenerFilter, RankingWeights, LeaderStock } from '@/types';
import { DEFAULT_RANKING_WEIGHTS as defaultWeights } from '@/types/screener';

// 주도주 스크리너 응답 타입
interface LeaderScreenerResponse {
  results: LeaderStock[];
  total: number;
  filter: ScreenerFilter;
  weights: RankingWeights;
  updatedAt: number;
}

// GET /api/screener - 주도주 스크리너 (순위 기반)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // 필터 파라미터 파싱
  const filter: ScreenerFilter = {
    market: (searchParams.get('market') as 'KOSPI' | 'KOSDAQ' | 'all') || 'all',
  };

  // 가중치 파라미터 파싱
  const weights: RankingWeights = {
    changeWeight: parseFloat(searchParams.get('changeWeight') || '') || defaultWeights.changeWeight,
    turnoverWeight: parseFloat(searchParams.get('turnoverWeight') || '') || defaultWeights.turnoverWeight,
    amountWeight: parseFloat(searchParams.get('amountWeight') || '') || defaultWeights.amountWeight,
    foreignWeight: parseFloat(searchParams.get('foreignWeight') || '') || defaultWeights.foreignWeight,
  };

  // 추가 필터 옵션
  const minRankingCount = parseInt(searchParams.get('minRankingCount') || '0', 10);
  const minScore = parseInt(searchParams.get('minScore') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    // KIS Provider 확인
    if (!(stockProvider instanceof KISProvider)) {
      // Mock Provider인 경우 빈 결과 반환
      return NextResponse.json({
        results: [],
        total: 0,
        filter,
        weights,
        updatedAt: Date.now(),
        message: 'KIS Provider가 필요합니다. 환경변수를 확인하세요.',
      });
    }

    const kisProvider = stockProvider as KISProvider;

    // 시장 설정
    const marketParam = filter.market === 'all' ? 'ALL' : filter.market || 'ALL';

    // 캐시 확인
    const cacheKey = CacheKeys.leaderStocks(marketParam);
    let leaders = getFromMemory<LeaderStock[]>(cacheKey);

    if (!leaders) {
      // 순위 데이터 조회 (4개 API 병렬 호출)
      const rankings = await kisProvider.getAllRankings(
        marketParam as 'KOSPI' | 'KOSDAQ' | 'ALL',
        30
      );

      // 주도주 발굴
      leaders = detectLeaderStocks(rankings, weights);

      // 캐시 저장
      setToMemory(cacheKey, leaders, CACHE_TTL.LEADER_STOCKS);
    } else {
      // 캐시된 데이터에 가중치 재적용 (가중치가 변경된 경우)
      leaders = leaders.map((stock) => ({
        ...stock,
        score: calculateScoreWithWeights(stock, weights),
      })).sort((a, b) => b.score - a.score);
    }

    // 필터 적용
    const filteredLeaders = filterLeaderStocks(leaders, {
      market: filter.market === 'all' ? undefined : filter.market,
      minRankingCount: minRankingCount > 0 ? minRankingCount : undefined,
      minScore: minScore > 0 ? minScore : undefined,
    });

    // 상위 N개만 반환
    const limitedResults = filteredLeaders.slice(0, limit);

    const response: LeaderScreenerResponse = {
      results: limitedResults,
      total: filteredLeaders.length,
      filter,
      weights,
      updatedAt: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Screener error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screener data' },
      { status: 500 }
    );
  }
}

/**
 * 가중치를 적용한 점수 재계산
 * 공식: 항목별 점수의 합
 * 항목별 점수 = (50 - 순위) * 가중치
 */
function calculateScoreWithWeights(
  stock: LeaderStock,
  weights: RankingWeights
): number {
  const RANK_BASE = 50;

  const calcScore = (rank: number | undefined, weight: number) => {
    if (!rank || rank <= 0 || rank >= RANK_BASE) return 0;
    return (RANK_BASE - rank) * weight;
  };

  const changeScore = calcScore(stock.changeRank, weights.changeWeight);
  const turnoverScore = calcScore(stock.turnoverRank, weights.turnoverWeight);
  const amountScore = calcScore(stock.amountRank, weights.amountWeight);
  const foreignScore = calcScore(stock.foreignRank, weights.foreignWeight);

  // 최종 점수 = 항목별 점수의 합
  return changeScore + turnoverScore + amountScore + foreignScore;
}
