import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/themes/favorites/[id]
 * 관심 테마 삭제
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: '관심 테마 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 소유자 확인
    const favorite = await db.favoriteTheme.findUnique({
      where: { id },
    });

    if (!favorite) {
      return NextResponse.json(
        { error: '관심 테마를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (favorite.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 삭제
    await db.favoriteTheme.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('관심 테마 삭제 실패:', error);
    return NextResponse.json(
      { error: '관심 테마 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
