import { test, expect, mobileDevice, navigateMobile } from './fixtures';

test.use({ ...mobileDevice });

test.describe('Reclaim Money', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await navigateMobile(page, 'Money');
    await expect(page.getByRole('heading', { name: 'Recovery Tracker' })).toBeVisible();
  });

  test('a tracked charge can reach a dispute letter with real export actions', async ({ page, consoleErrors }) => {
    await page.getByPlaceholder('What is it? (e.g. broadband, gym, bank fee)').fill('PG&E rate spike');
    await page.getByPlaceholder('Company name (for the dispute letter)').fill('PG&E');
    await page.getByPlaceholder('Amount').fill('38.50');
    await page.getByRole('button', { name: 'Track this' }).click();

    await page.getByRole('button', { name: 'Letter', exact: true }).click();
    await expect(page.getByText('Dispute Letter', { exact: true })).toBeVisible();
    await expect(page.getByText('To Whom It May Concern at PG&E,')).toBeVisible();
    await expect(page.getByRole('button', { name: /Print \/ Save as PDF/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Send via email/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Route to Money Vault/ })).toBeVisible();
    await expect(page.getByText('Contribute to ongoing development')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('scanning a bill flags a disputable charge instead of dead-ending', async ({ page, consoleErrors }) => {
    await page.getByText('Scan a bill', { exact: false }).click();
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'bill.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });

    await expect(page.getByText('Possible issues to dispute')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Rate increase', { exact: false })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
