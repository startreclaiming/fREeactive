import { test, expect, mobileDevice } from './fixtures';

test.use({ ...mobileDevice });

test.describe('Ubiquitous Capture Hub', () => {
  test('scanning a document reaches a confirmation with working completion actions', async ({ page, consoleErrors }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'bill.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });

    await expect(page.getByText('Reclaim AI')).toBeVisible({ timeout: 10_000 });
    // The mocked scan-bill response has verdict "vampire" — the confirmation
    // must offer a real next step, not dead-end.
    await expect(page.getByRole('button', { name: 'Fight this charge' })).toBeVisible();
    // CompletionPrompt should render after a scan result.
    await expect(page.getByText('Share this with your block')).toBeVisible();
    await expect(page.getByText('Contribute to ongoing development')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('typing a problem routes to a confirmation without dead-ending', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Type your question or describe a problem', { exact: false }).click();
    const input = page.getByPlaceholder(/water heater is leaking/);
    await input.fill('My landlord sent me an eviction notice');
    await input.press('Enter');
    await expect(page.getByText('Reclaim AI')).toBeVisible();
    await expect(page.getByRole('button', { name: /Understand my rights/ })).toBeVisible();
  });
});
