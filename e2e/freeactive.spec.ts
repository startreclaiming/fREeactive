import { test, expect, mobileDevice } from './fixtures';

test.use({ ...mobileDevice });

test.describe('FREEactive Hub', () => {
  test('scanning a photo reaches an AI response with a real completion action', async ({ page, consoleErrors }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'plate.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });

    await expect(page.getByText('Mocked AI response.')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: "That answers it — I'm done" }).click();
    await expect(page.getByText('Contribute to ongoing development')).toBeVisible();
    await expect(page.getByText('Share this with your block')).toBeVisible();

    await page.getByRole('button', { name: 'Back to start' }).click();
    await expect(page.getByRole('heading', { name: 'How can I help?' })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('typing a problem gets a response without dead-ending', async ({ page, consoleErrors }) => {
    await page.goto('/');
    await page.getByText('Type', { exact: true }).click();
    const input = page.getByPlaceholder('What do you need help with?');
    await input.fill('My landlord sent me an eviction notice');
    await input.press('Enter');

    await expect(page.getByText('Mocked AI response.')).toBeVisible({ timeout: 10_000 });
    expect(consoleErrors).toEqual([]);
  });

  test('a follow-up reply continues the same conversation', async ({ page, consoleErrors }) => {
    await page.goto('/');
    await page.getByText('Type', { exact: true }).click();
    const input = page.getByPlaceholder('What do you need help with?');
    await input.fill('My water heater is leaking');
    await input.press('Enter');
    await expect(page.getByText('Mocked AI response.')).toBeVisible({ timeout: 10_000 });

    const replyInput = page.getByPlaceholder('Type a reply…');
    await replyInput.fill('It started this morning');
    await replyInput.press('Enter');
    await expect(page.getByText('My water heater is leaking')).toBeVisible();
    await expect(page.getByText('It started this morning')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('starting over clears the conversation and returns to the main screen', async ({ page, consoleErrors }) => {
    await page.goto('/');
    await page.getByText('Type', { exact: true }).click();
    const input = page.getByPlaceholder('What do you need help with?');
    await input.fill('My bank charged me twice');
    await input.press('Enter');
    await expect(page.getByText('Mocked AI response.')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByRole('heading', { name: 'How can I help?' })).toBeVisible();
    await expect(page.getByText('My bank charged me twice')).not.toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('"Am I owed money?" reaches the unclaimed-property search without a dead link', async ({ page, consoleErrors }) => {
    await page.goto('/');
    await page.getByText('Am I owed money?').click();
    await expect(page.getByText('Search the Ledger')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
