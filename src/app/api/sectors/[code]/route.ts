import { NextRequest, NextResponse } from 'next/server';
import { mockProvider } from '@/lib/api/mock-provider';
import { SECTORS } from '@/types/sector';
import type { SectorCode } from '@/types';

// GET /api/sectors/[code] - 특정 섹터 상세 정보
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const sectorCode = code.toUpperCase() as SectorCode;

  // 유효한 섹터 코드인지 확인
  if (!SECTORS[sectorCode]) {
    return NextResponse.json(
      { error: 'Invalid sector code' },
      { status: 400 }
    );
  }

  try {
    const [summary, stocks] = await Promise.all([
      mockProvider.getSectorSummary(sectorCode),
      mockProvider.getStocksBySector(sectorCode),
    ]);

    if (!summary) {
      return NextResponse.json(
        { error: 'Sector not found' },
        { status: 404 }
      );
    }

    // 종목별 시세 정보도 함께 반환
    const quotes = await mockProvider.getQuotes(stocks.map(s => s.symbol));

    const stocksWithQuotes = stocks.map(stock => {
      const quote = quotes.find(q => q.symbol === stock.symbol);
      return {
        ...stock,
        quote,
      };
    });

    // 등락률 순으로 정렬
    stocksWithQuotes.sort((a, b) => {
      const aChange = a.quote?.changePercent ?? 0;
      const bChange = b.quote?.changePercent ?? 0;
      return bChange - aChange;
    });

    return NextResponse.json({
      sector: SECTORS[sectorCode],
      summary,
      stocks: stocksWithQuotes,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Sector detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sector data' },
      { status: 500 }
    );
  }
}
