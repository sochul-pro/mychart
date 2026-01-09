import { NextRequest, NextResponse } from 'next/server';
import { getNewsProvider } from '@/lib/api/news-provider-factory';
import { validateLimit } from '@/lib/validation';

/**
 * 뉴스 조회 API
 * GET /api/news?symbol=005930
 * GET /api/news?symbols=005930,000660
 * GET /api/news?query=반도체
 * GET /api/news (최신 뉴스)
 *
 * @param symbol - 종목코드 (단일)
 * @param symbols - 종목코드 (복수, 쉼표 구분)
 * @param query - 검색어
 * @param limit - 조회 개수 (1-100), 기본값: 20
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const symbols = searchParams.get('symbols');
  const query = searchParams.get('query');
  // limit 범위 검증 (1 ~ 100)
  const limit = validateLimit(searchParams.get('limit'), {
    defaultValue: 20,
    min: 1,
    max: 100,
  });

  try {
    const provider = getNewsProvider();
    let news;

    if (symbol) {
      // 특정 종목 뉴스
      news = await provider.getNewsBySymbol(symbol, limit);
    } else if (symbols) {
      // 여러 종목 뉴스
      const symbolList = symbols.split(',');
      news = await provider.getNewsBySymbols(symbolList, limit);
    } else if (query) {
      // 검색
      news = await provider.searchNews(query, limit);
    } else {
      // 최신 뉴스
      news = await provider.getLatestNews(limit);
    }

    return NextResponse.json({
      news,
      total: news.length,
      provider: provider.name,
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
