import { NextRequest, NextResponse } from 'next/server';
import { getDefaultThemeProvider } from '@/lib/api/theme-provider-factory';
import { calculateMomentumScores, getTopMomentumStocks } from '@/lib/api/momentum-calculator';

/**
 * GET /api/themes/[themeId]/stocks
 * 테마 내 종목 목록 조회 (모멘텀 점수 포함)
 *
 * Query params:
 * - top: 상위 N개만 조회 (기본: 전체)
 * - withScore: 모멘텀 점수 포함 여부 (기본: true)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  try {
    const { themeId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const top = searchParams.get('top');
    const withScore = searchParams.get('withScore') !== 'false';

    const provider = getDefaultThemeProvider();
    const stocks = await provider.getThemeStocks(themeId);

    if (stocks.length === 0) {
      return NextResponse.json(
        { error: '테마 종목을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 모멘텀 점수 계산
    let result;
    if (top) {
      const topN = parseInt(top, 10);
      result = getTopMomentumStocks(stocks, topN);
    } else if (withScore) {
      result = calculateMomentumScores(stocks);
    } else {
      result = stocks;
    }

    return NextResponse.json({
      stocks: result,
      total: stocks.length,
      themeId,
    });
  } catch (error) {
    console.error('테마 종목 조회 오류:', error);
    return NextResponse.json(
      { error: '테마 종목 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
