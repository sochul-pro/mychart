import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getProvider } from '@/lib/api/provider-factory';
import { BacktestEngine } from '@/lib/signals/backtest-engine';
import { getPresetStrategy } from '@/lib/signals/presets';
import type { TradingStrategy } from '@/lib/signals/types';

const backtestSchema = z.object({
  symbol: z.string().min(1).max(12),
  presetId: z.string().optional(),
  strategy: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      buyCondition: z.record(z.any()),
      sellCondition: z.record(z.any()),
    })
    .optional(),
  config: z.object({
    startDate: z.string(),
    endDate: z.string(),
    initialCapital: z.number().min(1000000).max(10000000000),
    commission: z.number().min(0).max(1),
    slippage: z.number().min(0).max(5),
  }),
});

// POST /api/signals/backtest - 백테스트 실행
export async function POST(request: NextRequest) {
  const session = await auth();
  const body = await request.json();
  const parsed = backtestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { symbol, presetId, strategy: customStrategy, config } = parsed.data;

  // 전략 결정
  let strategy: TradingStrategy | undefined = customStrategy as TradingStrategy | undefined;

  if (!strategy && presetId) {
    // 기본 프리셋 확인
    const builtIn = getPresetStrategy(presetId as Parameters<typeof getPresetStrategy>[0]);
    if (builtIn) {
      strategy = builtIn;
    } else if (session?.user?.id) {
      // 사용자 프리셋 조회
      const userPreset = await db.signalPreset.findFirst({
        where: { id: presetId, userId: session.user.id },
      });
      if (userPreset) {
        strategy = {
          id: userPreset.id,
          name: userPreset.name,
          description: userPreset.description || undefined,
          buyCondition: userPreset.buyRules as unknown as TradingStrategy['buyCondition'],
          sellCondition: userPreset.sellRules as unknown as TradingStrategy['sellCondition'],
        };
      }
    }
  }

  if (!strategy) {
    return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
  }

  try {
    // OHLCV 데이터 조회
    const provider = getProvider();
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    // 지표 계산을 위한 여유 데이터 포함
    const limit = Math.min(daysDiff + 100, 500);
    const ohlcv = await provider.getOHLCV(symbol, 'D', limit);

    if (ohlcv.length < 30) {
      return NextResponse.json(
        { error: '백테스트에 필요한 데이터가 부족합니다.' },
        { status: 400 }
      );
    }

    // 백테스트 실행
    const engine = new BacktestEngine(
      {
        symbol,
        startDate,
        endDate,
        initialCapital: config.initialCapital,
        commission: config.commission,
        slippage: config.slippage,
        positionSizing: 'percent',
        positionSize: 100, // 100% 투자
      },
      strategy
    );

    const result = engine.run(ohlcv);

    // 결과 저장 (로그인 사용자 + presetId가 있는 경우)
    let runId: string | undefined;
    if (session?.user?.id && presetId && !getPresetStrategy(presetId as Parameters<typeof getPresetStrategy>[0])) {
      try {
        const savedRun = await db.backtestRun.create({
          data: {
            presetId,
            symbol,
            startDate,
            endDate,
            initialCapital: config.initialCapital,
            commission: config.commission,
            slippage: config.slippage,
            totalTrades: result.totalTrades,
            winningTrades: result.winningTrades,
            losingTrades: result.losingTrades,
            winRate: result.winRate,
            totalReturn: result.totalReturn,
            annualizedReturn: result.annualizedReturn,
            maxDrawdown: result.maxDrawdown,
            sharpeRatio: result.sharpeRatio,
            sortinoRatio: result.sortinoRatio,
            avgWinPct: result.avgWinPct,
            avgLossPct: result.avgLossPct,
            profitFactor: result.profitFactor,
            avgHoldingDays: result.avgHoldingDays,
            trades: result.trades as unknown as object,
            equityCurve: result.equityCurve as unknown as object,
            userId: session.user.id,
          },
        });
        runId = savedRun.id;

        // 프리셋 성능 메타 업데이트
        await db.signalPreset.update({
          where: { id: presetId },
          data: {
            lastBacktestAt: new Date(),
            winRate: result.winRate,
            totalReturn: result.totalReturn,
            maxDrawdown: result.maxDrawdown,
            sharpeRatio: result.sharpeRatio,
          },
        });
      } catch (dbError) {
        console.error('Failed to save backtest result:', dbError);
        // DB 저장 실패해도 결과는 반환
      }
    }

    return NextResponse.json({ result, runId });
  } catch (error) {
    console.error('Backtest error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '백테스트 실행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
