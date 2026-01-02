import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/api/provider-factory';
import type { TimeFrame } from '@/types';

/**
 * OHLCV 차트 데이터 조회
 * GET /api/stocks/[symbol]/ohlcv?timeFrame=D&limit=100
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);

    const timeFrame = (searchParams.get('timeFrame') || 'D') as TimeFrame;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const provider = getProvider();
    const ohlcv = await provider.getOHLCV(symbol, timeFrame, limit);

    return NextResponse.json({
      symbol,
      timeFrame,
      data: ohlcv,
      provider: provider.name,
    });
  } catch (error) {
    console.error('OHLCV API error:', error);
    return NextResponse.json(
      { error: '차트 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
