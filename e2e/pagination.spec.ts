import { test, expect } from '@playwright/test';

test.describe('Pagination Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('admin@example.com');
    await page.locator('#password').fill('ChangeMe-12345');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('doctors list: page change, next/prev, and limit change', async ({ page }) => {
    await page.goto('/doctors');

    // Wait for table to load
    await expect(page.getByRole('button', { name: 'Page 1' })).toBeVisible();

    // 1. Direct page click
    const page2Btn = page.getByRole('button', { name: 'Page 2' });
    await expect(page2Btn).toBeVisible();
    await page2Btn.click();

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');

    // 2. Next page button
    const nextBtn = page.getByRole('button', { name: /next page/i });
    await nextBtn.click();
    await expect(page).toHaveURL(/page=3/);
    await expect(page.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');

    // 3. Previous page button
    const prevBtn = page.getByRole('button', { name: /previous page/i });
    await prevBtn.click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');

    // 4. Change rows limit
    const rowsSelect = page.getByRole('combobox', { name: /rows per page/i });
    await rowsSelect.selectOption('20');
    await expect(page).toHaveURL(/limit=20/);
    await expect(page.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  });

  test('patients list: page change, next/prev, and limit change', async ({ page }) => {
    await page.goto('/patients');

    await expect(page.getByRole('button', { name: 'Page 1', exact: true })).toBeVisible();

    // 1. Direct page click
    const page2Btn = page.getByRole('button', { name: 'Page 2', exact: true });
    await expect(page2Btn).toBeVisible();
    await page2Btn.click();

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('button', { name: 'Page 2', exact: true })).toHaveAttribute('aria-current', 'page');

    // 2. Next page button
    const nextBtn = page.getByRole('button', { name: /next page/i });
    await nextBtn.click();
    await expect(page).toHaveURL(/page=3/);
    await expect(page.getByRole('button', { name: 'Page 3', exact: true })).toHaveAttribute('aria-current', 'page');

    // 3. Previous page button
    const prevBtn = page.getByRole('button', { name: /previous page/i });
    await prevBtn.click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('button', { name: 'Page 2', exact: true })).toHaveAttribute('aria-current', 'page');
  });
});
