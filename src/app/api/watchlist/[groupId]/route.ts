import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateGroupSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  order: z.number().int().min(0).optional(),
});

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

// GET /api/watchlist/[groupId] - 특정 그룹 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { groupId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const group = await db.watchlistGroup.findFirst({
    where: {
      id: groupId,
      userId: session.user.id,
    },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  return NextResponse.json(group);
}

// PUT /api/watchlist/[groupId] - 그룹 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { groupId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  // 그룹 소유권 확인
  const existingGroup = await db.watchlistGroup.findFirst({
    where: {
      id: groupId,
      userId: session.user.id,
    },
  });

  if (!existingGroup) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const group = await db.watchlistGroup.update({
    where: { id: groupId },
    data: parsed.data,
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return NextResponse.json(group);
}

// DELETE /api/watchlist/[groupId] - 그룹 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { groupId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 그룹 소유권 확인
  const existingGroup = await db.watchlistGroup.findFirst({
    where: {
      id: groupId,
      userId: session.user.id,
    },
  });

  if (!existingGroup) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  await db.watchlistGroup.delete({
    where: { id: groupId },
  });

  return NextResponse.json({ success: true });
}
