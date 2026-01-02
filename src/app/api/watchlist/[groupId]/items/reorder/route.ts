import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const reorderSchema = z.object({
  itemIds: z.array(z.string()),
});

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

// PUT /api/watchlist/[groupId]/items/reorder - 종목 순서 변경
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { groupId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);

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

  const { itemIds } = parsed.data;

  // 모든 아이템이 해당 그룹에 속하는지 확인
  const items = await db.watchlistItem.findMany({
    where: {
      id: { in: itemIds },
      groupId,
    },
  });

  if (items.length !== itemIds.length) {
    return NextResponse.json(
      { error: 'Some items not found in this group' },
      { status: 400 }
    );
  }

  // 트랜잭션으로 순서 업데이트
  await db.$transaction(
    itemIds.map((id, index) =>
      db.watchlistItem.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
