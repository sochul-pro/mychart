import { NextRequest, NextResponse } from 'next/server';
import { stockProvider } from '@/lib/api/provider-factory';
import { normalizeSymbol } from '@/lib/validation';
import {
  normalizeToReturn,
  calculateCurrentReturn,
  alignTimeSeries,
  getStartDateForPeriod,
  getToday,
} from '@/lib/comparison/normalize';
import type { ComparePeriod, ComparisonData, NormalizedDataPoint } from '@/types/comparison';
import { PERIOD_LIMITS, isIndexCode, SUPPORTED_INDICES, MAX_COMPARISON_ITEMS } from '@/types/comparison';

/**
 * 비교 차트 데이터 조회
 * GET /api/compare/data?symbols=005930,000660,KOSPI&period=6M
 *
 * @param symbols - 종목/지수 코드 (쉼표 구분)
 * @param period - 기간 ('1M' | '3M' | '6M' | '1Y' | '2Y'), 기본값: '6M'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 파라미터 파싱
    const symbolsParam = searchParams.get('symbols');
    const period = (searchParams.get('period') || '6M') as ComparePeriod;

    if (!symbolsParam) {
      return NextResponse.json(
        { error: '종목 코드를 입력해주세요.' },
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

    // 종목 코드 파싱 및 검증
    const symbols = symbolsParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (symbols.length === 0) {
      return NextResponse.json(
        { error: '최소 1개 이상의 종목을 선택해주세요.' },
        { status: 400 }
      );
    }

    if (symbols.length > MAX_COMPARISON_ITEMS) {
      return NextResponse.json(
        { error: `최대 ${MAX_COMPARISON_ITEMS}개까지 비교할 수 있습니다.` },
        { status: 400 }
      );
    }

    // 각 종목별로 OHLCV 데이터 조회
    const limit = PERIOD_LIMITS[period];
    const dataPromises = symbols.map(async (code) => {
      try {
        const isIndex = isIndexCode(code);

        if (isIndex) {
          // 지수는 별도 처리 (추후 구현)
          // 현재는 stockProvider를 통해 조회 시도
          const indexInfo = SUPPORTED_INDICES.find((idx) => idx.code === code);
          const ohlcv = await stockProvider.getOHLCV(code, 'D', limit);
          return {
            code,
            name: indexInfo?.name || code,
            type: 'index' as const,
            ohlcv,
          };
        } else {
          // 일반 종목
          const normalizedSymbol = normalizeSymbol(code);
          const [ohlcv, stockInfo] = await Promise.all([
            stockProvider.getOHLCV(normalizedSymbol, 'D', limit),
            stockProvider.getStockInfo(normalizedSymbol).catch(() => null),
          ]);
          return {
            code: normalizedSymbol,
            name: stockInfo?.name || normalizedSymbol,
            type: 'stock' as const,
            ohlcv,
          };
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${code}:`, error);
        return {
          code,
          name: code,
          type: 'stock' as const,
          ohlcv: [],
          error: true,
        };
      }
    });

    const results = await Promise.all(dataPromises);

    // 정규화 및 정렬
    const normalizedDatasets = new Map<string, NormalizedDataPoint[]>();
    const items: ComparisonData['items'] = {};

    results.forEach((result) => {
      if (result.ohlcv.length === 0) {
        // 데이터가 없는 경우 빈 배열로 처리
        items[result.code] = {
          name: result.name,
          type: result.type,
          values: [],
          currentReturn: 0,
        };
        return;
      }

      const normalized = normalizeToReturn(result.ohlcv, period);
      const currentReturn = calculateCurrentReturn(result.ohlcv, period);

      normalizedDatasets.set(result.code, normalized);
      items[result.code] = {
        name: result.name,
        type: result.type,
        values: normalized,
        currentReturn,
      };
    });

    // 시간축 정렬 - Forward Fill 방식으로 누락 데이터 채움
    const aligned = alignTimeSeries(normalizedDatasets);
    aligned.forEach((values, code) => {
      if (items[code]) {
        items[code].values = values;
      }
    });

    const response: ComparisonData = {
      period,
      startDate: getStartDateForPeriod(period),
      endDate: getToday(),
      items,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Compare data API error:', error);
    return NextResponse.json(
      { error: '비교 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
