import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateAlertSchema = z.object({
  symbols: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  minPrice: z.number().positive().nullable().optional(),
  maxPrice: z.number().positive().nullable().optional(),
});

// PUT /api/signals/alerts/[id] - 알림 설정 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 알림 소유권 확인
  const existing = await db.signalAlert.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateAlertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.symbols !== undefined) updateData.symbols = parsed.data.symbols;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.emailEnabled !== undefined) updateData.emailEnabled = parsed.data.emailEnabled;
  if (parsed.data.pushEnabled !== undefined) updateData.pushEnabled = parsed.data.pushEnabled;
  if (parsed.data.minPrice !== undefined) updateData.minPrice = parsed.data.minPrice;
  if (parsed.data.maxPrice !== undefined) updateData.maxPrice = parsed.data.maxPrice;

  const alert = await db.signalAlert.update({
    where: { id },
    data: updateData,
    include: {
      preset: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(alert);
}

// DELETE /api/signals/alerts/[id] - 알림 설정 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 알림 소유권 확인
  const existing = await db.signalAlert.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.signalAlert.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
