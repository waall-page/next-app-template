import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
    test.beforeEach(async ({ page }) => {
        // 全てのテストの前にトップページ（または適当なリフレッシュ）を実行
        await page.goto('/');
    });

    test('未ログインユーザーはダッシュボードから /login にリダイレクトされること', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/login/);
    });

    test('一般ユーザーが正しい情報でログインし、ダッシュボードに遷移できること', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[name="email"]', 'user@example.com');
        await page.fill('input[name="password"]', 'Template2026!');

        await page.click('button:has-text("ログイン")');

        // ダッシュボード遷移を確認（URLやコンテンツのチェック）
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('一般ユーザーが誤った情報でログインを試みた場合、エラーが表示されること', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[name="email"]', 'user@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');

        await page.click('button:has-text("ログイン")');

        // エラーメッセージが表示されていることを確認
        const errorMessage = page.locator('p.text-red-500');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('メールアドレスまたはパスワードが正しくありません。');
    });

    test('管理者ユーザーが正しい情報でログインし、管理ダッシュボードに遷移できること', async ({ page }) => {
        await page.goto('/admin/login');

        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'Template2026!');

        await page.click('button:has-text("Login")');

        // 管理者ダッシュボード遷移を確認 (/admin)
        await expect(page).toHaveURL(/\/admin/);
    });

    test('ログインしていないユーザーは管理者ダッシュボードから管理者ログイン画面にリダイレクトされること', async ({ page }) => {
        await page.goto('/admin');
        // 未ログインでアクセスすると /admin/login にリダイレクトされる
        await expect(page).toHaveURL(/\/admin\/login/);
    });

    test('ログイン後の一般ユーザーがログアウトボタンを押してログアウトできること', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'user@example.com');
        await page.fill('input[name="password"]', 'Template2026!');
        await page.click('button:has-text("ログイン")');
        await expect(page).toHaveURL(/\/dashboard/);

        // ヘッダーにログアウトボタンが表示されていることを確認
        const logoutButton = page.locator('button:has-text("ログアウト"), button:has-text("Logout")');
        await expect(logoutButton).toBeVisible();

        // ログアウトを実行
        await logoutButton.click();

        // ログイン画面へリダイレクトされることを確認
        await expect(page).toHaveURL(/\/login/);

        // ダッシュボードに再アクセスしても、未ログインなので /login に弾かれることを確認
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/login/);
    });
});
