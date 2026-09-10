import { test, expect, mobileDevice } from './fixtures';

test.use({ ...mobileDevice });

test.describe('Pricing / PROactive upgrade', () => {
  test('the tier matrix renders and Upgrade opens checkout without crashing the app', async ({ page, consoleErrors }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Pricing' }).click();
    await expect(page.getByRole('heading', { name: 'FREEactive vs. PROactive' })).toBeVisible();

    for (const domain of ['Reclaim Home', 'Reclaim Money', 'Reclaim Resolve', 'Reclaim Community']) {
      await expect(page.getByText(domain)).toBeVisible();
    }

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('link', { name: 'Upgrade to PROactive' }).click(),
    ]);
    expect(popup.url()).toContain('buy.stripe.com');
    expect(consoleErrors).toEqual([]);
  });
});
