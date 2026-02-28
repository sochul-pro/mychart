import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_INDICES, PERIOD_LIMITS, isIndexCode } from '@/types/comparison';
import type { ComparePeriod } from '@/types/comparison';
import type { OHLCV } from '@/types';

/**
 * 지수 OHLCV 데이터 조회
 * GET /api/indices/[code]/ohlcv?period=6M
 *
 * @param code - 지수 코드 (KOSPI, KOSDAQ, KS200, KQ150)
 * @param period - 기간 ('1M' | '3M' | '6M' | '1Y' | '2Y'), 기본값: '6M'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '6M') as ComparePeriod;

    // 지수 코드 검증
    if (!isIndexCode(code)) {
      return NextResponse.json(
        { error: '지원하지 않는 지수입니다.' },
        { status: 400 }
      );
    }

    // 기간 검증
    if (!PERIOD_LIMITS[period]) {
      return NextResponse.json(
        { error: '유효하지 않은 기간입니다.' },
        { status: 400 }
      );
    }

    const indexInfo = SUPPORTED_INDICES.find((idx) => idx.code === code);
    const limit = PERIOD_LIMITS[period];

    // Mock 데이터 생성 (추후 KIS API 연동 시 실제 데이터로 교체)
    const ohlcv = generateMockIndexOHLCV(code, limit);

    return NextResponse.json({
      code,
      name: indexInfo?.name || code,
      period,
      data: ohlcv,
      provider: 'MockIndexProvider',
    });
  } catch (error) {
    console.error('Index OHLCV API error:', error);
    return NextResponse.json(
      { error: '지수 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * Mock 지수 OHLCV 데이터 생성
 * 지수별로 다른 시작 가격과 변동성을 적용
 */
function generateMockIndexOHLCV(code: string, limit: number): OHLCV[] {
  const now = new Date();
  const data: OHLCV[] = [];

  // 지수별 기본 설정
  const indexConfig: Record<string, { basePrice: number; volatility: number; trend: number }> = {
    KOSPI: { basePrice: 2500, volatility: 0.012, trend: 0.0003 },
    KOSDAQ: { basePrice: 750, volatility: 0.015, trend: 0.0004 },
    KS200: { basePrice: 330, volatility: 0.013, trend: 0.0003 },
    KQ150: { basePrice: 1100, volatility: 0.016, trend: 0.0004 },
  };

  const config = indexConfig[code] || { basePrice: 1000, volatility: 0.01, trend: 0 };
  let price = config.basePrice;

  // 과거 날짜부터 생성
  for (let i = limit - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // 주말 제외
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // 가격 변동 (랜덤 + 트렌드)
    const change = (Math.random() - 0.5) * 2 * config.volatility + config.trend;
    price = price * (1 + change);

    // 일중 변동
    const dayRange = price * config.volatility;
    const open = price + (Math.random() - 0.5) * dayRange * 0.3;
    const close = price;
    const high = Math.max(open, close) + Math.random() * dayRange * 0.5;
    const low = Math.min(open, close) - Math.random() * dayRange * 0.5;

    // 거래량 (지수는 거래량이 없지만 형식 맞추기 위해 0)
    const volume = 0;

    data.push({
      time: date.setHours(15, 30, 0, 0), // 장 마감 시간
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
  }

  return data;
}
