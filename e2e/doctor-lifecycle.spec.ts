import { test, expect } from '@playwright/test';

test.describe('Doctor Directory & Patient Roster Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('admin@example.com');
    await page.locator('#password').fill('ChangeMe-12345');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('navigate to doctors list, search, and view doctor profile', async ({ page }) => {
    await page.goto('/doctors');
    await expect(page.getByRole('heading', { name: /doctors directory/i })).toBeVisible();

    // Verify seeded doctors appear
    const searchInput = page.getByPlaceholder(/search by doctor name/i);
    await searchInput.fill('Ayesha');

    // Wait for search debounce and table update
    await expect(page).toHaveURL(/search=Ayesha/);
    const doctorLink = page.getByRole('link', { name: 'Dr. Ayesha Rahman' }).first();
    await expect(doctorLink).toBeVisible();

    // Click doctor name to navigate to details
    await doctorLink.click();

    // Verify detail page
    await expect(page).toHaveURL(/\/doctors\/[a-f0-9]{24}/);
    await expect(page.getByText('Cardiology')).toBeVisible();
    await expect(page.getByText('Dhaka Central Hospital')).toBeVisible();
  });
});
