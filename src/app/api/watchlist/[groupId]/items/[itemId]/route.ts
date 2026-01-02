import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateItemSchema = z.object({
  memo: z.string().max(500).nullable().optional(),
  targetPrice: z.number().positive().nullable().optional(),
  buyPrice: z.number().positive().nullable().optional(),
  order: z.number().int().min(0).optional(),
});

type RouteParams = {
  params: Promise<{ groupId: string; itemId: string }>;
};

// PUT /api/watchlist/[groupId]/items/[itemId] - 관심종목 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { groupId, itemId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  // 그룹 소유권 확인
  const group = await db.watchlistGroup.findFirst({
    where: {
      id: groupId,
      userId: session.user.id,
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  // 아이템 존재 확인
  const existingItem = await db.watchlistItem.findFirst({
    where: {
      id: itemId,
      groupId,
    },
  });

  if (!existingItem) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const item = await db.watchlistItem.update({
    where: { id: itemId },
    data: parsed.data,
  });

  return NextResponse.json(item);
}

// DELETE /api/watchlist/[groupId]/items/[itemId] - 관심종목 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { groupId, itemId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 그룹 소유권 확인
  const group = await db.watchlistGroup.findFirst({
    where: {
      id: groupId,
      userId: session.user.id,
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  // 아이템 존재 확인
  const existingItem = await db.watchlistItem.findFirst({
    where: {
      id: itemId,
      groupId,
    },
  });

  if (!existingItem) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  await db.watchlistItem.delete({
    where: { id: itemId },
  });

  return NextResponse.json({ success: true });
}
