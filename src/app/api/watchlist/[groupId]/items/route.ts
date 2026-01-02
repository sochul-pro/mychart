import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const addItemSchema = z.object({
  symbol: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  memo: z.string().max(500).optional(),
  targetPrice: z.number().positive().optional(),
  buyPrice: z.number().positive().optional(),
});

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

// POST /api/watchlist/[groupId]/items - 관심종목 추가
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const { groupId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = addItemSchema.safeParse(body);

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

  // 이미 같은 종목이 그룹에 있는지 확인
  const existingItem = await db.watchlistItem.findFirst({
    where: {
      groupId,
      symbol: parsed.data.symbol,
    },
  });

  if (existingItem) {
    return NextResponse.json(
      { error: 'Item already exists in this group' },
      { status: 409 }
    );
  }

  // 현재 그룹의 아이템 개수로 order 설정
  const itemCount = await db.watchlistItem.count({
    where: { groupId },
  });

  const item = await db.watchlistItem.create({
    data: {
      symbol: parsed.data.symbol,
      name: parsed.data.name,
      memo: parsed.data.memo,
      targetPrice: parsed.data.targetPrice,
      buyPrice: parsed.data.buyPrice,
      order: itemCount,
      groupId,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
