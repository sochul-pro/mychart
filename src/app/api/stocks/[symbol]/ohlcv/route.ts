import { NextRequest, NextResponse } from 'next/server';
import { stockProvider } from '@/lib/api/provider-factory';
import { validateLimit, normalizeSymbol } from '@/lib/validation';
import type { TimeFrame } from '@/types';

/**
 * OHLCV 차트 데이터 조회
 * GET /api/stocks/[symbol]/ohlcv?timeFrame=D&limit=100
 *
 * @param symbol - 종목코드 (6자리 또는 12자리)
 * @param timeFrame - 시간 프레임 ('D' | 'W' | 'M'), 기본값: 'D'
 * @param limit - 조회 개수 (1-500), 기본값: 100
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: rawSymbol } = await params;
    const symbol = normalizeSymbol(rawSymbol);
    const { searchParams } = new URL(request.url);

    const timeFrame = (searchParams.get('timeFrame') || 'D') as TimeFrame;
    // limit 범위 검증 (1 ~ 500)
    const limit = validateLimit(searchParams.get('limit'), {
      defaultValue: 100,
      min: 1,
      max: 500,
    });

    const ohlcv = await stockProvider.getOHLCV(symbol, timeFrame, limit);

    return NextResponse.json({
      symbol,
      timeFrame,
      data: ohlcv,
      provider: stockProvider.name,
    });
  } catch (error) {
    console.error('OHLCV API error:', error);
    return NextResponse.json(
      { error: '차트 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
