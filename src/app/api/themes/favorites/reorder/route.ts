import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * PUT /api/themes/favorites/reorder
 * 관심 테마 순서 변경
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: '정렬된 ID 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    // 모든 관심 테마가 현재 사용자 소유인지 확인
    const favorites = await db.favoriteTheme.findMany({
      where: {
        id: { in: orderedIds },
        userId: session.user.id,
      },
    });

    if (favorites.length !== orderedIds.length) {
      return NextResponse.json(
        { error: '일부 관심 테마를 찾을 수 없거나 권한이 없습니다.' },
        { status: 400 }
      );
    }

    // 순서 업데이트
    await db.$transaction(
      orderedIds.map((id: string, index: number) =>
        db.favoriteTheme.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('관심 테마 순서 변경 실패:', error);
    return NextResponse.json(
      { error: '관심 테마 순서 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
