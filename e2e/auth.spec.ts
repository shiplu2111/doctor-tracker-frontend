import { test, expect } from '@playwright/test';

test.describe('Authentication & Session Flow', () => {
  test('unauthenticated visit to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    await expect(page.getByText(/sign in to your administrative account/i)).toBeVisible();
  });

  test('invalid login credentials displays error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('invalid@example.com');
    await page.locator('#password').fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('successful login redirects to /dashboard and displays topbar profile', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('admin@example.com');
    await page.locator('#password').fill('ChangeMe-12345');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Verify user profile button exists in topbar
    const profileBtn = page.getByRole('button', { name: /user profile menu/i });
    await expect(profileBtn).toBeVisible();
  });

  test('successful logout redirects to /login and prevents access to dashboard', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('admin@example.com');
    await page.locator('#password').fill('ChangeMe-12345');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Open user dropdown in topbar
    const profileBtn = page.getByRole('button', { name: /user profile menu/i });
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // 3. Click "Log out" button
    const logoutBtn = page.getByRole('button', { name: /log out/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // 4. Verify redirected to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/sign in to your administrative account/i)).toBeVisible();

    // 5. Verify attempting to navigate back to /dashboard redirects to /login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('clicking demo credentials auto-fills email and password inputs', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByLabel(/email address/i);
    const passwordInput = page.locator('#password');

    // Click Admin demo button
    await page.getByRole('button', { name: /admin full access/i }).click();
    await expect(emailInput).toHaveValue('admin@example.com');
    await expect(passwordInput).toHaveValue('ChangeMe-12345');

    // Click Viewer demo button
    await page.getByRole('button', { name: /viewer read only/i }).click();
    await expect(emailInput).toHaveValue('viewer@example.com');
    await expect(passwordInput).toHaveValue('ChangeMe-12345');
  });
});
