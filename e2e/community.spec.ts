import { test, expect, mobileDevice, navigateMobile } from './fixtures';

test.use({ ...mobileDevice });

test.describe('Reclaim Community', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await navigateMobile(page, 'Community');
    await expect(page.getByText('Your community, woven by you.')).toBeVisible();
  });

  test('the full Anchor -> Boundary -> Activate -> Dashboard flow completes', async ({ page, consoleErrors }) => {
    await page.getByText('Anchor your block', { exact: false }).click();
    await page.getByPlaceholder('e.g. Shaun').fill('Jordan');
    await page.getByPlaceholder('e.g. Maple Street').fill('Maple Street');
    await page.getByPlaceholder('e.g. 94601').fill('94601');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Set Trusted Boundary step — non-negotiable guarantees, not a dead end.
    await expect(page.getByText('Coordination, not surveillance.')).toBeVisible();
    await page.getByRole('button', { name: 'Create network' }).click();

    // Activate Block Circle — the invite code must actually appear.
    await expect(page.getByText('Maple Street is ready.')).toBeVisible();
    await expect(page.getByText('Invite code')).toBeVisible();
    await page.getByRole('button', { name: /Continue to your Fabric Dashboard/ }).click();

    // Fabric Dashboard
    await expect(page.getByRole('heading', { name: 'Maple Street' })).toBeVisible();
    await expect(page.getByText('Local unclaimed wealth', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: /Emergency Alert/ })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('an emergency alert actually posts to the feed', async ({ page }) => {
    await page.getByText('Anchor your block', { exact: false }).click();
    await page.getByPlaceholder('e.g. Shaun').fill('Jordan');
    await page.getByPlaceholder('e.g. Maple Street').fill('Maple Street');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Create network' }).click();
    await page.getByRole('button', { name: /Continue to your Fabric Dashboard/ }).click();

    await page.getByRole('button', { name: /Emergency Alert/ }).click();
    await page.getByPlaceholder(/outage, safety concern/).fill('Power out on Maple St since 6pm.');
    await page.getByRole('button', { name: /Send alert to/ }).click();

    // Scope to the actual feed post (not the composer's "Alert" kind-chip button,
    // which has the same exact text) by finding the post containing our message.
    const post = page.locator('.rcn-post').filter({ hasText: 'Power out on Maple St since 6pm.' });
    await expect(post).toBeVisible();
    // The badge text is "Alert" in the DOM — CSS uppercases it visually via text-transform,
    // which Playwright correctly does not treat as changing the actual text.
    await expect(post.getByText('Alert', { exact: true })).toBeVisible();
  });

  test('the Board tab is reachable from the dashboard', async ({ page }) => {
    await page.getByText('Anchor your block', { exact: false }).click();
    await page.getByPlaceholder('e.g. Shaun').fill('Jordan');
    await page.getByPlaceholder('e.g. Maple Street').fill('Maple Street');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Create network' }).click();
    await page.getByRole('button', { name: /Continue to your Fabric Dashboard/ }).click();

    await page.getByRole('button', { name: 'Board', exact: true }).click();
    await expect(page.getByPlaceholder('Title (e.g. Lend my pressure washer)')).toBeVisible();
  });

  test('joining with an unknown code fails gracefully, not silently', async ({ page }) => {
    await page.getByText('Join with a code', { exact: false }).click();
    await page.getByPlaceholder('e.g. Dana').fill('Dana');
    await page.getByPlaceholder('6-character code').fill('ZZZZZZ');
    await page.getByRole('button', { name: 'Join network' }).click();
    await expect(page.getByText('No network found for that code', { exact: false })).toBeVisible();
  });
});
