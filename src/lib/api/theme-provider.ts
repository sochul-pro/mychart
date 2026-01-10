import type { Theme, ThemeSummary } from '@/types';

/**
 * 테마 데이터 Provider 인터페이스
 * 네이버 금융, Mock 등 다양한 구현체로 교체 가능
 */
export interface ThemeProvider {
  /** Provider 이름 */
  readonly name: string;

  /**
   * 테마 목록 조회 (페이지별)
   * @param page 페이지 번호 (1부터 시작)
   * @returns 테마 목록
   */
  getThemes(page?: number): Promise<Theme[]>;

  /**
   * 전체 테마 목록 조회
   * @returns 전체 테마 목록
   */
  getAllThemes(): Promise<Theme[]>;

  /**
   * 테마 상세 조회
   * @param themeId 테마 ID
   * @returns 테마 정보 (없으면 null)
   */
  getThemeById(themeId: string): Promise<Theme | null>;

  /**
   * 테마 요약 정보 조회 (핫 테마, 급등/급락 테마)
   * @returns 테마 요약 정보
   */
  getThemeSummary(): Promise<ThemeSummary>;

  /**
   * 전체 테마 수 조회
   * @returns 전체 테마 수
   */
  getTotalThemeCount(): Promise<number>;
}

/** 현재 활성화된 Provider */
let currentProvider: ThemeProvider | null = null;

/** Provider 설정 */
export function setThemeProvider(provider: ThemeProvider): void {
  currentProvider = provider;
}

/** Provider 가져오기 */
export function getThemeProvider(): ThemeProvider {
  if (!currentProvider) {
    throw new Error('ThemeProvider가 설정되지 않았습니다. setThemeProvider()를 먼저 호출하세요.');
  }
  return currentProvider;
}
