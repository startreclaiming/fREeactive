import { test, expect, mobileDevice, desktopDevice } from './fixtures';

test.describe('Mobile', () => {
  test.use({ ...mobileDevice });

  test('mobile visitors land directly in the Hub, no sign-up screen', async ({ page, consoleErrors }) => {
    await page.goto('/');
    // The Hub's own heading, not the marketing landing page's hero.
    await expect(page.getByRole('heading', { name: 'How can I help?' })).toBeVisible();
    await expect(page.getByText('Scan', { exact: true })).toBeVisible();
    await expect(page.getByText('Talk', { exact: true })).toBeVisible();
    await expect(page.getByText('Am I owed money?')).toBeVisible();
    // Never a forced auth wall.
    await expect(page.getByText('CREATE ACCOUNT')).not.toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});

test.describe('Desktop', () => {
  test.use({ ...desktopDevice });

  test('shows the marketing landing page with a working QR code', async ({ page, consoleErrors }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Take Aim. Reclaim' })).toBeVisible();
    await expect(page.getByAltText('Scan to open Reclaim on your phone')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('chooser offers guest entry and sign-in, never forces either', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Continue to Site', { exact: false }).first().click();
    await expect(page.getByText('Open the app — no account needed')).toBeVisible();
    await expect(page.getByText('Already have an account? Sign in')).toBeVisible();

    await page.getByText('Open the app', { exact: false }).first().click();
    await expect(page.getByRole('heading', { name: 'How can I help?' })).toBeVisible();
  });

  test('pricing page is reachable without an account', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Continue to Site', { exact: false }).first().click();
    await page.getByText('Open the app', { exact: false }).first().click();
    await page.getByRole('button', { name: 'Pricing' }).click();
    await expect(page.getByRole('heading', { name: 'FREEactive vs. PROactive' })).toBeVisible();
  });
});
