import { Page } from '@playwright/test';

/**
 * Mocks every Supabase network call (auth, REST, edge functions) so the suite
 * never depends on network conditions, real API credits, or leaves test data
 * behind — while still exercising all real frontend logic and state transitions.
 * Register more specific page.route() calls AFTER this in a test to override
 * a particular response (Playwright tries the most-recently-added match first).
 */
export async function mockSupabaseDefaults(page: Page) {
  await page.route('**/auth/v1/**', (route) => {
    const url = route.request().url();
    if (url.includes('/signup') || url.includes('/token')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          user: { id: 'e2e-test-user', email: 'e2e@example.com', user_metadata: {} },
        }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/rest/v1/**', (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/functions/v1/scan-bill', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        bill: {
          doc_type: 'utility bill', vendor: 'PG&E', date: null, currency: 'USD', total: 128.5,
          line_items: [], flags: [{ label: 'Rate increase', reason: 'Unexplained +$8.50 vs last cycle', severity: 'dispute' }],
          verdict: 'vampire',
        },
      }),
    }));

  await page.route('**/functions/v1/scan-appliance', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        appliance: { brand: 'Whirlpool', modelName: 'Water Heater', modelNumber: 'WH-40', serialNumber: 'SN123', category: 'Appliance', manufactureYear: '2015' },
      }),
    }));

  await page.route('**/functions/v1/structure-timeline', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events: [{ date: null, description: 'Sent repair request', category: 'Communication' }] }),
    }));

  await page.route('**/functions/v1/ai-assistant', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ response: 'Mocked AI response.', tokens: { input: 1, output: 1 } }),
    }));
}

/** A trivial 1x1 PNG, good enough to drive scan flows without a real image. */
export const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
