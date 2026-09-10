import { test, expect, mobileDevice, navigateMobile } from './fixtures';

test.use({ ...mobileDevice });

test.describe('Reclaim Home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await navigateMobile(page, 'Home');
    await expect(page.getByRole('heading', { name: 'Household Inventory' })).toBeVisible();
  });

  test('adding an old appliance surfaces a health score and a recall banner', async ({ page, consoleErrors }) => {
    await page.getByPlaceholder('Name (e.g. Samsung oven)').fill('Dishwasher');
    await page.getByPlaceholder('Brand').fill('Whirlpool');
    await page.locator('input[type="date"]').fill('2012-05-01');
    await page.getByRole('button', { name: 'Add item' }).click();

    await expect(page.getByText('% health')).toBeVisible();
    await expect(page.getByText('Possible recall pattern')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('the action hub on an item is fully clickable without crashing', async ({ page, consoleErrors }) => {
    await page.getByPlaceholder('Name (e.g. Samsung oven)').fill('Water Heater');
    await page.getByRole('button', { name: 'Add item' }).click();
    await page.getByText('Water Heater', { exact: false }).first().click(); // expand

    await expect(page.getByRole('button', { name: 'Schedule maintenance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search for manual' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to vault' })).toBeVisible();

    await page.getByRole('button', { name: 'Schedule maintenance' }).click();
    await expect(page.getByText('next service', { exact: false })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('scanning an appliance prefills the form instead of dead-ending', async ({ page, consoleErrors }) => {
    await page.getByRole('button', { name: 'Scan an appliance' }).click();
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'plate.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    });

    await expect(page.getByPlaceholder('Brand')).toHaveValue('Whirlpool', { timeout: 10_000 });
    await expect(page.getByText('Share this with your block')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
