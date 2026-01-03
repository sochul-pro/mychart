import { NextRequest, NextResponse } from 'next/server';
import { stockProvider } from '@/lib/api/provider-factory';
import {
  createScreenerResult,
  applyFilters,
  sortResults,
} from '@/lib/screener';
import type { ScreenerFilter, ScreenerResponse, ScreenerResult } from '@/types';

// GET /api/screener - 주도주 스크리너
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // 필터 파라미터 파싱
  const filter: ScreenerFilter = {
    market: (searchParams.get('market') as 'KOSPI' | 'KOSDAQ' | 'all') || 'all',
    sector: searchParams.get('sector') || undefined,
    minVolumeRatio: searchParams.get('minVolumeRatio')
      ? parseFloat(searchParams.get('minVolumeRatio')!)
      : undefined,
    minChangePercent: searchParams.get('minChangePercent')
      ? parseFloat(searchParams.get('minChangePercent')!)
      : undefined,
    maxChangePercent: searchParams.get('maxChangePercent')
      ? parseFloat(searchParams.get('maxChangePercent')!)
      : undefined,
    onlyNewHigh: searchParams.get('onlyNewHigh') === 'true',
  };

  const sortBy = (searchParams.get('sortBy') as 'score' | 'change_percent' | 'volume_ratio') || 'score';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    // 모든 종목 가져오기
    const stocks = await stockProvider.getAllStocks();

    // 각 종목의 시세와 OHLCV 데이터 가져오기
    const results: ScreenerResult[] = [];

    for (const stock of stocks) {
      const [quote, ohlcv] = await Promise.all([
        stockProvider.getQuote(stock.symbol),
        stockProvider.getOHLCV(stock.symbol, 'D', 252), // 1년치 데이터
      ]);

      if (quote && ohlcv.length > 0) {
        const result = createScreenerResult(stock, quote, ohlcv);
        results.push(result);
      }
    }

    // 필터 적용
    let filteredResults = applyFilters(results, filter);

    // 정렬
    filteredResults = sortResults(filteredResults, sortBy);

    // 상위 N개만 반환
    const limitedResults = filteredResults.slice(0, limit);

    const response: ScreenerResponse = {
      results: limitedResults,
      total: filteredResults.length,
      filter,
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
