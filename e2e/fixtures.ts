import { test as base, expect, devices, Page } from '@playwright/test';
import { mockSupabaseDefaults } from './mocks';

/** devices[...] presets include defaultBrowserType, which Playwright refuses to
 * accept from test.use() inside a describe block (it only affects worker
 * allocation at the top level/project level) — strip it since every project
 * here is already Chromium anyway. */
function deviceUse(name: string) {
  const { defaultBrowserType: _drop, ...rest } = devices[name];
  return rest;
}
export const mobileDevice = deviceUse('Pixel 7');
export const desktopDevice = deviceUse('Desktop Chrome');

/**
 * Every test gets Supabase network calls mocked automatically, and fails if the
 * page throws an uncaught error or logs to console.error — that's the actual
 * "broken loop" signal (a crashed component, a rejected promise nobody caught).
 * console.warn is allowed, since this app uses warnings for intentional
 * graceful-degradation messages (e.g. missing credentials).
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
    });
    await mockSupabaseDefaults(page);
    await use(errors);
  },
});

/**
 * The Navbar's desktop nav is display:none below the lg breakpoint — on a real
 * mobile viewport, the only actual way to reach another section is the
 * hamburger menu, so tests do it the same way a real user would rather than
 * clicking a hidden element and hanging.
 */
export async function navigateMobile(page: Page, label: string) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByTestId('mobile-nav').getByRole('button', { name: label, exact: true }).click();
}

export { expect };
