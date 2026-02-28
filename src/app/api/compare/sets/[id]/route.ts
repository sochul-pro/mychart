import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { MAX_COMPARISON_ITEMS } from '@/types/comparison';

const updateSetSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  symbols: z
    .array(z.string())
    .min(1)
    .max(MAX_COMPARISON_ITEMS)
    .optional(),
  period: z.enum(['1M', '3M', '6M', '1Y', '2Y']).optional(),
  order: z.number().int().min(0).optional(),
});

/**
 * 비교 세트 상세 조회
 * GET /api/compare/sets/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const set = await db.comparisonSet.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!set) {
    return NextResponse.json({ error: '세트를 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json(set);
}

/**
 * 비교 세트 수정
 * PUT /api/compare/sets/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  // 세트가 존재하고 사용자 소유인지 확인
  const existingSet = await db.comparisonSet.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existingSet) {
    return NextResponse.json({ error: '세트를 찾을 수 없습니다.' }, { status: 404 });
  }

  // 이름이 변경되는 경우 중복 확인
  if (parsed.data.name && parsed.data.name !== existingSet.name) {
    const duplicateSet = await db.comparisonSet.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: parsed.data.name,
        },
      },
    });

    if (duplicateSet) {
      return NextResponse.json(
        { error: '같은 이름의 세트가 이미 존재합니다.' },
        { status: 400 }
      );
    }
  }

  const updatedSet = await db.comparisonSet.update({
    where: { id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.symbols && { symbols: parsed.data.symbols }),
      ...(parsed.data.period && { period: parsed.data.period }),
      ...(parsed.data.order !== undefined && { order: parsed.data.order }),
    },
  });

  return NextResponse.json(updatedSet);
}

/**
 * 비교 세트 삭제
 * DELETE /api/compare/sets/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // 세트가 존재하고 사용자 소유인지 확인
  const existingSet = await db.comparisonSet.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existingSet) {
    return NextResponse.json({ error: '세트를 찾을 수 없습니다.' }, { status: 404 });
  }

  await db.comparisonSet.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
