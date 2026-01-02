import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const reorderSchema = z.object({
  groupIds: z.array(z.string()),
});

// PUT /api/watchlist/reorder - 그룹 순서 변경
export async function PUT(request: NextRequest) {
  const session = await auth();

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

  const { groupIds } = parsed.data;

  // 모든 그룹이 현재 사용자 소유인지 확인
  const groups = await db.watchlistGroup.findMany({
    where: {
      id: { in: groupIds },
      userId: session.user.id,
    },
  });

  if (groups.length !== groupIds.length) {
    return NextResponse.json(
      { error: 'Some groups not found or not owned by user' },
      { status: 400 }
    );
  }

  // 트랜잭션으로 순서 업데이트
  await db.$transaction(
    groupIds.map((id, index) =>
      db.watchlistGroup.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
