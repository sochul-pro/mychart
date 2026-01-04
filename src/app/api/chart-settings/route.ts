import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// 지표 설정 스키마
const indicatorConfigSchema = z.object({
  type: z.enum(['sma', 'ema', 'bollinger', 'rsi', 'macd', 'stochastic', 'obv', 'atr']),
  enabled: z.boolean(),
  color: z.string().optional(),
  period: z.number().optional(),
  stdDev: z.number().optional(),
  overbought: z.number().optional(),
  oversold: z.number().optional(),
  fastPeriod: z.number().optional(),
  slowPeriod: z.number().optional(),
  signalPeriod: z.number().optional(),
  kPeriod: z.number().optional(),
  dPeriod: z.number().optional(),
});

const updateSettingsSchema = z.object({
  defaultInterval: z.enum(['D', 'W', 'M']).optional(),
  indicators: z.array(indicatorConfigSchema).optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

// GET /api/chart-settings - 차트 설정 조회
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await db.chartSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    // 기본 설정 반환
    return NextResponse.json({
      defaultInterval: 'D',
      indicators: getDefaultIndicators(),
      theme: 'light',
    });
  }

  return NextResponse.json({
    defaultInterval: settings.defaultInterval,
    indicators: settings.indicators,
    theme: settings.theme,
  });
}

// PUT /api/chart-settings - 차트 설정 저장
export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { defaultInterval, indicators, theme } = parsed.data;

  // upsert: 있으면 업데이트, 없으면 생성
  const settings = await db.chartSettings.upsert({
    where: { userId: session.user.id },
    update: {
      ...(defaultInterval && { defaultInterval }),
      ...(indicators && { indicators }),
      ...(theme && { theme }),
    },
    create: {
      userId: session.user.id,
      defaultInterval: defaultInterval || 'D',
      indicators: indicators || getDefaultIndicators(),
      theme: theme || 'light',
    },
  });

  return NextResponse.json({
    defaultInterval: settings.defaultInterval,
    indicators: settings.indicators,
    theme: settings.theme,
  });
}

// 기본 지표 설정
function getDefaultIndicators() {
  return [
    { type: 'sma', period: 5, color: '#2196F3', enabled: false },
    { type: 'sma', period: 10, color: '#FF9800', enabled: false },
    { type: 'sma', period: 20, color: '#4CAF50', enabled: true },
    { type: 'sma', period: 60, color: '#E91E63', enabled: true },
    { type: 'sma', period: 120, color: '#9C27B0', enabled: false },
    { type: 'bollinger', period: 20, stdDev: 2, color: '#9C27B0', enabled: false },
    { type: 'rsi', period: 14, overbought: 70, oversold: 30, color: '#E91E63', enabled: false },
    { type: 'macd', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, color: '#00BCD4', enabled: false },
    { type: 'stochastic', kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20, color: '#4CAF50', enabled: false },
  ];
}
