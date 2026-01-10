import { NextRequest, NextResponse } from 'next/server';
import { getDefaultThemeProvider } from '@/lib/api/theme-provider-factory';
import type { Theme, ThemeFilter, ThemeListResponse } from '@/types';
import { validateLimit } from '@/lib/validation';

/**
 * 테마 필터링
 */
function filterThemes(themes: Theme[], filter: Partial<ThemeFilter>): Theme[] {
  let result = [...themes];

  // 상승/하락 필터
  if (filter.type === 'advance') {
    result = result.filter((t) => t.changePercent > 0);
  } else if (filter.type === 'decline') {
    result = result.filter((t) => t.changePercent < 0);
  }

  // 검색어 필터
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    result = result.filter((t) => t.name.toLowerCase().includes(searchLower));
  }

  return result;
}

/**
 * 테마 정렬
 */
function sortThemes(themes: Theme[], sortBy: string, sortOrder: string): Theme[] {
  const result = [...themes];

  result.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'change':
        comparison = a.changePercent - b.changePercent;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name, 'ko');
        break;
      case 'stockCount':
        comparison = a.stockCount - b.stockCount;
        break;
      default:
        comparison = a.changePercent - b.changePercent;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return result;
}

/**
 * GET /api/themes
 * 테마 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터 파싱
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = validateLimit(searchParams.get('pageSize'), { defaultValue: 20, min: 1, max: 50 });
    const type = (searchParams.get('type') || 'all') as 'all' | 'advance' | 'decline';
    const sortBy = searchParams.get('sortBy') || 'change';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || undefined;

    const provider = getDefaultThemeProvider();

    // 전체 테마 가져오기
    const allThemes = await provider.getAllThemes();

    // 필터링
    const filtered = filterThemes(allThemes, { type, search });

    // 정렬
    const sorted = sortThemes(filtered, sortBy, sortOrder);

    // 페이지네이션
    const total = sorted.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedThemes = sorted.slice(start, end);

    // 주도주가 없는 테마에 대해 상세 조회 (병렬 처리)
    const themes = await Promise.all(
      pagedThemes.map(async (theme) => {
        if (theme.leadingStocks.length === 0) {
          const detailed = await provider.getThemeById(theme.id);
          if (detailed) {
            return detailed;
          }
        }
        return theme;
      })
    );

    // 요약 정보
    const summary = await provider.getThemeSummary();

    const response: ThemeListResponse = {
      themes,
      summary,
      total,
      page,
      pageSize,
      updatedAt: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('테마 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '테마 목록을 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
