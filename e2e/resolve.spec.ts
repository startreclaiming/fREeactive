import { test, expect, mobileDevice, navigateMobile } from './fixtures';

test.use({ ...mobileDevice });

test.describe('Reclaim Resolve', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await navigateMobile(page, 'Resolve');
    await expect(page.getByRole('heading', { name: 'Build Your Case' })).toBeVisible();
  });

  test('a full case reaches a packet with a real timeline, citation, and export actions', async ({ page, consoleErrors }) => {
    await page.getByText('Tenancy & Housing', { exact: false }).first().click();
    await expect(page.getByRole('heading', { name: 'Tenancy & Housing' })).toBeVisible();

    await page.getByPlaceholder('…or type what happened').fill('My landlord has not fixed the water heater.');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Structured Event Vault should populate from the (mocked) structuring call, not stay empty.
    await expect(page.getByText('Sent repair request')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Build Judicial Packet' }).click();
    await expect(page.getByText('Chronological Timeline')).toBeVisible();
    await expect(page.getByText('California Civil Code §1941.1', { exact: false })).toBeVisible();
    await expect(page.getByText('UD-105', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: /Print \/ Save as PDF/ })).toBeVisible();
    await expect(page.getByText('Contribute to ongoing development')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('Rights Library tab is reachable and never dead-ends the Case Builder', async ({ page }) => {
    await page.getByRole('button', { name: 'Rights Library' }).click();
    await expect(page.getByRole('heading', { name: 'Rights library' })).toBeVisible();
    await page.getByRole('button', { name: 'Case Builder' }).click();
    await expect(page.getByText('Start a case')).toBeVisible();
  });
});
