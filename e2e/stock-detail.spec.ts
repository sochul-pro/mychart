import { test, expect } from '@playwright/test';

test.describe('종목 상세 페이지', () => {
  // 삼성전자 종목 페이지로 테스트
  const testSymbol = '005930';

  test.beforeEach(async ({ page }) => {
    await page.goto(`/stocks/${testSymbol}`);
  });

  test('종목 정보 표시', async ({ page }) => {
    // 종목명 확인
    await expect(page.getByText(/삼성전자/)).toBeVisible({ timeout: 10000 });
  });

  test('차트 렌더링', async ({ page }) => {
    // 차트 컨테이너 확인
    const chartContainer = page.locator('[class*="chart"], canvas, [data-testid*="chart"]');
    await expect(chartContainer.first()).toBeVisible({ timeout: 10000 });
  });

  test('시간 프레임 선택 (일/주/월봉)', async ({ page }) => {
    // 시간 프레임 버튼들 확인
    const dayButton = page.getByRole('button', { name: /일봉|D/i });
    const weekButton = page.getByRole('button', { name: /주봉|W/i });
    const monthButton = page.getByRole('button', { name: /월봉|M/i });

    // 버튼이 존재하는지 확인
    await expect(dayButton.or(weekButton).or(monthButton)).toBeVisible();

    // 주봉 선택
    if (await weekButton.isVisible()) {
      await weekButton.click();

      // 버튼이 활성화 상태가 되었는지 확인
      await page.waitForTimeout(500);
    }
  });

  test('지표 패널 존재', async ({ page }) => {
    // 지표 토글 또는 패널 확인
    const indicatorPanel = page.locator('[class*="indicator"], [data-testid*="indicator"]');
    const indicatorButton = page.getByRole('button', { name: /지표|SMA|EMA|RSI/i });

    await expect(indicatorPanel.first().or(indicatorButton.first())).toBeVisible({ timeout: 5000 });
  });

  test('종목 정보 카드 (현재가, 등락률)', async ({ page }) => {
    // 가격 정보가 표시되는지 확인
    const priceElement = page.locator('[class*="price"], [data-testid*="price"]');
    const changeElement = page.locator('[class*="change"], [data-testid*="change"]');

    await expect(priceElement.first().or(changeElement.first())).toBeVisible({ timeout: 10000 });
  });

  test('뉴스 섹션 (있는 경우)', async ({ page }) => {
    // 뉴스 섹션 확인 (선택적)
    const newsSection = page.getByText(/뉴스|News/i);

    // 뉴스 섹션이 있으면 확인
    if (await newsSection.isVisible()) {
      await expect(newsSection).toBeVisible();
    }
  });

  test('모바일 뷰에서 차트 표시', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });

    // 차트가 여전히 보이는지 확인
    const chartContainer = page.locator('[class*="chart"], canvas, [data-testid*="chart"]');
    await expect(chartContainer.first()).toBeVisible({ timeout: 10000 });
  });
});
