import { NextRequest, NextResponse } from 'next/server';
import { getNewsProvider } from '@/lib/api/news-provider-factory';

/**
 * 뉴스 조회 API
 * GET /api/news?symbol=005930
 * GET /api/news?symbols=005930,000660
 * GET /api/news?query=반도체
 * GET /api/news (최신 뉴스)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const symbols = searchParams.get('symbols');
  const query = searchParams.get('query');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

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
