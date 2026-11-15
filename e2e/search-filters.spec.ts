import { test, expect } from '@playwright/test';

test.describe('Global Search Command Palette Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('admin@example.com');
    await page.locator('#password').fill('ChangeMe-12345');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('opens command palette with quick search button and queries results', async ({ page }) => {
    // Click quick search button in topbar
    const searchBtn = page.getByRole('button', { name: /quick search/i });
    await searchBtn.click();

    // Verify dialog appears
    const palette = page.getByRole('dialog', { name: /global search palette/i });
    await expect(palette).toBeVisible();

    // Type query
    const searchInput = palette.getByPlaceholder(/search doctors by name/i);
    await searchInput.fill('Ayesha');

    // Wait for search results
    await expect(palette.getByText(/doctors \(/i)).toBeVisible();
    const doctorButton = palette.getByRole('button', { name: /ayesha rahman cardiology/i });
    await expect(doctorButton).toBeVisible();

    // Click result
    await doctorButton.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/doctors\/[a-f0-9]{24}/);
  });
});
