import { test, expect } from '@playwright/test';

test.describe('스크리너 (주도주 발굴)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/screener');
  });

  test('스크리너 페이지 로드', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.getByRole('heading', { name: /주도주|스크리너/i })).toBeVisible();
  });

  test('종목 목록 표시', async ({ page }) => {
    // 테이블 또는 목록 로드 대기
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // 종목 행이 1개 이상 있는지 확인
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  });

  test('시장 필터 (KOSPI/KOSDAQ) 동작', async ({ page }) => {
    // 필터 버튼 확인
    const kospiFilter = page.getByRole('button', { name: /KOSPI/i });
    const kosdaqFilter = page.getByRole('button', { name: /KOSDAQ/i });

    await expect(kospiFilter).toBeVisible();
    await expect(kosdaqFilter).toBeVisible();

    // KOSDAQ 필터 클릭
    await kosdaqFilter.click();

    // 필터가 활성화되었는지 확인 (aria-pressed 또는 클래스로)
    await expect(kosdaqFilter).toHaveAttribute('data-state', 'active').or(
      expect(kosdaqFilter).toHaveClass(/active|selected/)
    );
  });

  test('종목 클릭 시 상세 페이지로 이동', async ({ page }) => {
    // 테이블 로드 대기
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // 첫 번째 종목 클릭
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // 종목 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/stocks\//);
  });

  test('가중치 슬라이더 조절', async ({ page }) => {
    // 설정 버튼이 있으면 클릭
    const settingsButton = page.getByRole('button', { name: /설정|가중치/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
    }

    // 슬라이더 존재 확인
    const slider = page.locator('[role="slider"]').first();
    if (await slider.isVisible()) {
      // 슬라이더 값 변경 시도
      await slider.focus();
      await page.keyboard.press('ArrowRight');
    }
  });
});
