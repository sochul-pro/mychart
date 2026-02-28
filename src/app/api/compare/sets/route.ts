import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { MAX_COMPARISON_SETS, MAX_COMPARISON_ITEMS } from '@/types/comparison';

const createSetSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.').max(50, '이름은 50자 이하로 입력해주세요.'),
  symbols: z
    .array(z.string())
    .min(1, '최소 1개 이상의 종목을 선택해주세요.')
    .max(MAX_COMPARISON_ITEMS, `최대 ${MAX_COMPARISON_ITEMS}개까지 선택할 수 있습니다.`),
  period: z.enum(['1M', '3M', '6M', '1Y', '2Y']).optional().default('6M'),
});

/**
 * 비교 세트 목록 조회
 * GET /api/compare/sets
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sets = await db.comparisonSet.findMany({
    where: { userId: session.user.id },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(sets);
}

/**
 * 비교 세트 생성
 * POST /api/compare/sets
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  // 현재 사용자의 세트 개수 확인
  const setCount = await db.comparisonSet.count({
    where: { userId: session.user.id },
  });

  if (setCount >= MAX_COMPARISON_SETS) {
    return NextResponse.json(
      { error: `최대 ${MAX_COMPARISON_SETS}개까지 저장할 수 있습니다.` },
      { status: 400 }
    );
  }

  // 같은 이름의 세트가 있는지 확인
  const existingSet = await db.comparisonSet.findUnique({
    where: {
      userId_name: {
        userId: session.user.id,
        name: parsed.data.name,
      },
    },
  });

  if (existingSet) {
    return NextResponse.json(
      { error: '같은 이름의 세트가 이미 존재합니다.' },
      { status: 400 }
    );
  }

  const set = await db.comparisonSet.create({
    data: {
      name: parsed.data.name,
      symbols: parsed.data.symbols,
      period: parsed.data.period,
      order: setCount,
      userId: session.user.id,
    },
  });

  return NextResponse.json(set, { status: 201 });
}
