import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1).max(50),
});

// GET /api/watchlist - 사용자의 관심종목 그룹 목록 조회
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groups = await db.watchlistGroup.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(groups);
}

// POST /api/watchlist - 새 관심종목 그룹 생성
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  // 현재 사용자의 그룹 개수로 order 설정
  const groupCount = await db.watchlistGroup.count({
    where: { userId: session.user.id },
  });

  const group = await db.watchlistGroup.create({
    data: {
      name: parsed.data.name,
      order: groupCount,
      userId: session.user.id,
    },
    include: {
      items: true,
    },
  });

  return NextResponse.json(group, { status: 201 });
}
