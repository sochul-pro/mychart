import { NextRequest, NextResponse } from 'next/server';
import { getDefaultThemeProvider } from '@/lib/api/theme-provider-factory';

interface Params {
  params: Promise<{
    themeId: string;
  }>;
}

/**
 * GET /api/themes/[themeId]
 * 테마 상세 조회
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { themeId } = await params;

    if (!themeId) {
      return NextResponse.json(
        { error: '테마 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const provider = getDefaultThemeProvider();
    const theme = await provider.getThemeById(themeId);

    if (!theme) {
      return NextResponse.json(
        { error: '테마를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(theme);
  } catch (error) {
    console.error('테마 상세 조회 실패:', error);
    return NextResponse.json(
      { error: '테마 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
