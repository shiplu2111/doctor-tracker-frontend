import { test } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/screenshots');

test.describe('Automated Screenshots Generator', () => {
  test('capture desktop screenshots (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Login
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('admin@example.com');
    await page.locator('#password').fill('ChangeMe-12345');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard');

    // 2. Dashboard screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop-dashboard.png'), fullPage: false });

    // 3. Doctors list screenshot
    await page.goto('/doctors');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop-doctors.png'), fullPage: false });

    // 4. Doctor detail page screenshot
    const doctorLink = page.locator('tbody tr a').first();
    const href = await doctorLink.getAttribute('href');
    if (href) {
      await page.goto(href);
    } else {
      await doctorLink.click();
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop-doctor-detail.png'), fullPage: false });

    // 5. Patients list screenshot
    await page.goto('/patients');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop-patients.png'), fullPage: false });
  });

  test('capture mobile screenshots (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // 1. Mobile Login
    await page.goto('/login');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile-login.png'), fullPage: false });

    // Fill credentials & sign in
    await page.getByLabel(/email address/i).fill('admin@example.com');
    await page.locator('#password').fill('ChangeMe-12345');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard');

    // 2. Mobile Dashboard
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile-dashboard.png'), fullPage: false });

    // 3. Mobile Doctors
    await page.goto('/doctors');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile-doctors.png'), fullPage: false });

    // 4. Mobile Patients
    await page.goto('/patients');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile-patients.png'), fullPage: false });
  });
});
