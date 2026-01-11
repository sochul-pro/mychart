import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createAlertSchema = z.object({
  presetId: z.string(),
  symbols: z.array(z.string()).default([]),
  emailEnabled: z.boolean().default(false),
  pushEnabled: z.boolean().default(true),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
});

// GET /api/signals/alerts - 알림 설정 조회
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const alerts = await db.signalAlert.findMany({
    where: { userId: session.user.id },
    include: {
      preset: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(alerts);
}

// POST /api/signals/alerts - 알림 설정 생성
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createAlertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  // 프리셋 존재 확인
  const preset = await db.signalPreset.findUnique({
    where: { id: parsed.data.presetId },
  });

  if (!preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
  }

  // 동일 프리셋에 대한 알림이 이미 있는지 확인
  const existing = await db.signalAlert.findFirst({
    where: {
      userId: session.user.id,
      presetId: parsed.data.presetId,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: '이미 해당 전략에 대한 알림 설정이 있습니다.' },
      { status: 409 }
    );
  }

  const alert = await db.signalAlert.create({
    data: {
      presetId: parsed.data.presetId,
      symbols: parsed.data.symbols,
      emailEnabled: parsed.data.emailEnabled,
      pushEnabled: parsed.data.pushEnabled,
      minPrice: parsed.data.minPrice,
      maxPrice: parsed.data.maxPrice,
      userId: session.user.id,
    },
    include: {
      preset: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(alert, { status: 201 });
}
