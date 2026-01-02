import { NextRequest, NextResponse } from 'next/server';
import { mockNewsProvider } from '@/lib/api/mock-news-provider';

// GET /api/news - 뉴스 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const symbols = searchParams.get('symbols');
  const query = searchParams.get('query');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  try {
    let news;

    if (symbol) {
      // 특정 종목 뉴스
      news = await mockNewsProvider.getNewsBySymbol(symbol, limit);
    } else if (symbols) {
      // 여러 종목 뉴스
      const symbolList = symbols.split(',');
      news = await mockNewsProvider.getNewsBySymbols(symbolList, limit);
    } else if (query) {
      // 검색
      news = await mockNewsProvider.searchNews(query, limit);
    } else {
      // 최신 뉴스
      news = await mockNewsProvider.getLatestNews(limit);
    }

    return NextResponse.json({
      news,
      total: news.length,
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
