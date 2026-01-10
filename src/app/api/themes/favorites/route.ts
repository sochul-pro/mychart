import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { FavoriteThemeListResponse } from '@/types';

/**
 * GET /api/themes/favorites
 * 관심 테마 목록 조회
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const favorites = await db.favoriteTheme.findMany({
      where: { userId: session.user.id },
      orderBy: { order: 'asc' },
    });

    const response: FavoriteThemeListResponse = {
      favorites: favorites.map((f: { id: string; themeId: string; themeName: string; order: number; customStocks: string[]; createdAt: Date }) => ({
        id: f.id,
        themeId: f.themeId,
        themeName: f.themeName,
        order: f.order,
        customStocks: f.customStocks.length > 0 ? f.customStocks : null,
        createdAt: f.createdAt.getTime(),
      })),
      total: favorites.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('관심 테마 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '관심 테마 목록을 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/themes/favorites
 * 관심 테마 추가
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { themeId, themeName } = body;

    if (!themeId || !themeName) {
      return NextResponse.json(
        { error: '테마 ID와 테마명이 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미 추가된 테마인지 확인
    const existing = await db.favoriteTheme.findUnique({
      where: {
        userId_themeId: {
          userId: session.user.id,
          themeId: String(themeId),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: '이미 관심 테마에 추가되어 있습니다.' },
        { status: 409 }
      );
    }

    // 현재 최대 order 값 조회
    const maxOrder = await db.favoriteTheme.aggregate({
      where: { userId: session.user.id },
      _max: { order: true },
    });

    const newOrder = (maxOrder._max.order ?? -1) + 1;

    // 관심 테마 추가
    const favorite = await db.favoriteTheme.create({
      data: {
        themeId: String(themeId),
        themeName,
        order: newOrder,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      id: favorite.id,
      themeId: favorite.themeId,
      themeName: favorite.themeName,
      order: favorite.order,
      customStocks: favorite.customStocks.length > 0 ? favorite.customStocks : null,
      createdAt: favorite.createdAt.getTime(),
    });
  } catch (error) {
    console.error('관심 테마 추가 실패:', error);
    return NextResponse.json(
      { error: '관심 테마 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}
