import { test, expect } from '@playwright/test';

test.describe('관심종목', () => {
  // 참고: 로그인이 필요한 기능이므로, 실제 테스트 시에는
  // 테스트용 계정으로 로그인하거나 인증을 모킹해야 합니다.

  test('관심종목 페이지 접근 (비로그인)', async ({ page }) => {
    await page.goto('/watchlist');

    // 로그인 페이지로 리다이렉트되어야 함
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('로그인 후 관심종목 기능', () => {
    test.beforeEach(async ({ page }) => {
      // 로그인 처리 (테스트 환경에 따라 조정 필요)
      // 실제 구현 시에는 테스트용 계정이나 세션 모킹 사용
      await page.goto('/login');

      // 테스트용 계정으로 로그인 시도
      // 환경 변수나 테스트 fixture에서 테스트 계정 정보를 가져올 수 있음
      const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
      const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

      await page.getByLabel('이메일').fill(testEmail);
      await page.getByLabel('비밀번호').fill(testPassword);
      await page.getByRole('button', { name: '로그인' }).click();

      // 로그인 성공 후 관심종목 페이지로 이동
      await page.goto('/watchlist');
    });

    test('관심종목 그룹 목록 표시', async ({ page }) => {
      // 그룹 목록 또는 빈 상태 메시지 확인
      const groupList = page.locator('[data-testid="watchlist-groups"]');
      const emptyState = page.getByText(/관심종목 그룹|그룹을 만들어/i);

      // 둘 중 하나가 보여야 함
      await expect(groupList.or(emptyState)).toBeVisible({ timeout: 5000 });
    });

    test('새 그룹 만들기 버튼 존재', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /그룹.*만들기|새.*그룹|추가/i });
      await expect(createButton).toBeVisible();
    });

    test('종목 검색 기능', async ({ page }) => {
      // 검색 입력 필드 찾기
      const searchInput = page.getByPlaceholder(/종목|검색/i);

      if (await searchInput.isVisible()) {
        // 검색어 입력
        await searchInput.fill('삼성전자');

        // 검색 결과 대기
        await page.waitForTimeout(1000);

        // 검색 결과에 삼성전자가 있는지 확인
        const result = page.getByText(/삼성전자/);
        await expect(result).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
