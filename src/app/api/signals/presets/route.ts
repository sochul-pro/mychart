import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getPresetStrategies } from '@/lib/signals/presets';

// 조건 스키마 (간단한 유효성 검사)
const conditionSchema = z.object({
  type: z.enum(['single', 'crossover', 'and', 'or']),
}).passthrough();

const createPresetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  buyRules: conditionSchema,
  sellRules: conditionSchema,
});

// GET /api/signals/presets - 프리셋 목록 조회
export async function GET() {
  const session = await auth();

  // 기본 프리셋은 항상 반환
  const strategies = getPresetStrategies();
  const defaultPresets = strategies.map((strategy) => ({
    id: strategy.id,
    name: strategy.name,
    description: strategy.description,
    buyRules: strategy.buyCondition,
    sellRules: strategy.sellCondition,
    isDefault: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  if (!session?.user?.id) {
    return NextResponse.json({
      presets: [],
      defaultPresets,
    });
  }

  // 사용자 프리셋 조회
  const userPresets = await db.signalPreset.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    presets: userPresets,
    defaultPresets,
  });
}

// POST /api/signals/presets - 프리셋 생성
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPresetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const preset = await db.signalPreset.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      buyRules: parsed.data.buyRules,
      sellRules: parsed.data.sellRules,
      userId: session.user.id,
    },
  });

  return NextResponse.json(preset, { status: 201 });
}
