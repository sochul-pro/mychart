import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/api/provider-factory';

/**
 * 종목 정보 및 현재가 조회
 * GET /api/stocks/[symbol]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const provider = getProvider();

    const [info, quote] = await Promise.all([
      provider.getStockInfo(symbol),
      provider.getQuote(symbol),
    ]);

    if (!info) {
      return NextResponse.json(
        { error: '종목을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      info,
      quote,
      provider: provider.name,
    });
  } catch (error) {
    console.error('Stock API error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
