import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  symbol: z.string().optional(),
  presetId: z.string().optional(),
  type: z.enum(['buy', 'sell']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const createHistorySchema = z.object({
  presetId: z.string(),
  symbol: z.string(),
  type: z.enum(['buy', 'sell']),
  price: z.number().positive(),
  signalAt: z.string(),
  reason: z.string().optional(),
  indicators: z.record(z.any()).optional(),
});

// GET /api/signals/history - 신호 이력 조회
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { symbol, presetId, type, startDate, endDate, limit, offset } = parsed.data;

  const where: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (symbol) where.symbol = symbol;
  if (presetId) where.presetId = presetId;
  if (type) where.type = type;

  if (startDate || endDate) {
    where.signalAt = {};
    if (startDate) (where.signalAt as Record<string, Date>).gte = new Date(startDate);
    if (endDate) (where.signalAt as Record<string, Date>).lte = new Date(endDate);
  }

  const [history, total] = await Promise.all([
    db.signalHistory.findMany({
      where,
      orderBy: { signalAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        preset: {
          select: { name: true },
        },
      },
    }),
    db.signalHistory.count({ where }),
  ]);

  return NextResponse.json({
    history,
    total,
    limit,
    offset,
    hasMore: offset + history.length < total,
  });
}

// POST /api/signals/history - 신호 이력 저장
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createHistorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  // 프리셋 소유권 확인
  const preset = await db.signalPreset.findFirst({
    where: { id: parsed.data.presetId, userId: session.user.id },
  });

  if (!preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
  }

  const history = await db.signalHistory.create({
    data: {
      presetId: parsed.data.presetId,
      symbol: parsed.data.symbol,
      type: parsed.data.type,
      price: parsed.data.price,
      signalAt: new Date(parsed.data.signalAt),
      reason: parsed.data.reason,
      indicators: parsed.data.indicators,
      userId: session.user.id,
    },
  });

  return NextResponse.json(history, { status: 201 });
}
