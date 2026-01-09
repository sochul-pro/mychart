import { test, expect } from '@playwright/test';

test.describe('인증 플로우', () => {
  test('로그인 페이지 접근', async ({ page }) => {
    await page.goto('/login');

    // 로그인 폼 확인
    await expect(page.getByLabel('이메일')).toBeVisible();
    await expect(page.getByLabel('비밀번호')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('회원가입 페이지 접근', async ({ page }) => {
    await page.goto('/register');

    // 회원가입 폼 확인
    await expect(page.getByLabel('이메일')).toBeVisible();
    await expect(page.getByLabel('비밀번호')).toBeVisible();
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
  });

  test('잘못된 로그인 시도 시 에러 메시지 표시', async ({ page }) => {
    await page.goto('/login');

    // 잘못된 정보로 로그인 시도
    await page.getByLabel('이메일').fill('invalid@example.com');
    await page.getByLabel('비밀번호').fill('wrongpassword');
    await page.getByRole('button', { name: '로그인' }).click();

    // 에러 메시지 확인 (타임아웃 대기)
    await expect(page.getByText(/로그인 실패|이메일 또는 비밀번호/i)).toBeVisible({ timeout: 5000 });
  });

  test('비로그인 상태에서 보호된 페이지 접근 시 리다이렉트', async ({ page }) => {
    await page.goto('/watchlist');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/login/);
  });
});
