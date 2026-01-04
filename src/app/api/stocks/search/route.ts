import { NextRequest, NextResponse } from 'next/server';
import { searchStocks, addDynamicStock, hasStock } from '@/lib/api/stock-master';
import { stockProvider } from '@/lib/api/provider-factory';
import { KISProvider } from '@/lib/api/kis-provider';

/**
 * GET /api/stocks/search?q=삼성&limit=10&fallback=true
 * 종목 검색 API
 *
 * Parameters:
 * - q: 검색어 (종목명 또는 종목코드)
 * - limit: 결과 수 제한 (기본값: 10)
 * - fallback: 마스터에 없으면 KIS API로 검색 (기본값: true)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const fallback = searchParams.get('fallback') !== 'false';

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [], total: 0 });
  }

  // 1. 마스터 데이터에서 검색
  let results = searchStocks(query, limit);

  // 2. 결과가 없거나 부족하고, 종목코드 형식이면 KIS API로 검색
  if (fallback && results.length < limit && stockProvider instanceof KISProvider) {
    const kisProvider = stockProvider as KISProvider;
    const trimmedQuery = query.trim();

    // 종목코드 형식 체크 (6자리 숫자)
    const isSymbolFormat = /^\d{6}$/.test(trimmedQuery);

    if (isSymbolFormat && !hasStock(trimmedQuery)) {
      try {
        // KIS API로 종목 정보 조회
        const stockInfo = await kisProvider.getStockInfo(trimmedQuery);

        if (stockInfo) {
          // 마스터에 추가
          addDynamicStock(stockInfo);

          // 결과에 추가
          results = [stockInfo, ...results.filter((s) => s.symbol !== stockInfo.symbol)];
        }
      } catch (error) {
        console.error('KIS API search failed:', error);
      }
    }
  }

  return NextResponse.json({
    results: results.slice(0, limit),
    total: results.length,
    query,
    source: results.length > 0 ? 'master' : 'none',
  });
}

/**
 * POST /api/stocks/search
 * KIS API로 종목 검색 후 마스터에 추가
 *
 * Body:
 * - symbol: 종목코드
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const symbol = body.symbol?.trim();

    if (!symbol || !/^\d{6}$/.test(symbol)) {
      return NextResponse.json(
        { error: 'Invalid symbol format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // 이미 마스터에 있는지 확인
    if (hasStock(symbol)) {
      return NextResponse.json({
        success: true,
        message: 'Stock already exists in master',
        added: false,
      });
    }

    // KIS API로 종목 정보 조회
    if (!(stockProvider instanceof KISProvider)) {
      return NextResponse.json(
        { error: 'KIS Provider not available' },
        { status: 503 }
      );
    }

    const kisProvider = stockProvider as KISProvider;
    const stockInfo = await kisProvider.getStockInfo(symbol);

    if (!stockInfo) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // 마스터에 추가
    const added = addDynamicStock(stockInfo);

    return NextResponse.json({
      success: true,
      stock: stockInfo,
      added,
    });
  } catch (error) {
    console.error('POST /api/stocks/search error:', error);
    return NextResponse.json(
      { error: 'Failed to search stock' },
      { status: 500 }
    );
  }
}
