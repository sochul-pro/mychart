import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// 조건 스키마 (간단한 유효성 검사)
const conditionSchema = z
  .object({
    type: z.enum(['single', 'crossover', 'and', 'or']),
  })
  .passthrough();

const updatePresetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  buyRules: conditionSchema.optional(),
  sellRules: conditionSchema.optional(),
  isActive: z.boolean().optional(),
});

// GET /api/signals/presets/[id] - 단일 프리셋 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const preset = await db.signalPreset.findUnique({
    where: { id },
  });

  if (!preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
  }

  // 다른 사용자의 프리셋은 조회 불가
  if (preset.userId && preset.userId !== session?.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(preset);
}

// PUT /api/signals/presets/[id] - 프리셋 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 프리셋 소유권 확인
  const existing = await db.signalPreset.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 기본 프리셋은 수정 불가
  if (existing.isDefault) {
    return NextResponse.json(
      { error: 'Cannot modify default preset' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = updatePresetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined)
    updateData.description = parsed.data.description;
  if (parsed.data.buyRules !== undefined)
    updateData.buyRules = parsed.data.buyRules;
  if (parsed.data.sellRules !== undefined)
    updateData.sellRules = parsed.data.sellRules;
  if (parsed.data.isActive !== undefined)
    updateData.isActive = parsed.data.isActive;

  const preset = await db.signalPreset.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(preset);
}

// DELETE /api/signals/presets/[id] - 프리셋 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 프리셋 소유권 확인
  const existing = await db.signalPreset.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 기본 프리셋은 삭제 불가
  if (existing.isDefault) {
    return NextResponse.json(
      { error: 'Cannot delete default preset' },
      { status: 400 }
    );
  }

  await db.signalPreset.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
