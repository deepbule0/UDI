import { test, expect } from '@playwright/test';

test('the production manifest has a phone entry and valid install icons', async ({ page, request }) => {
  await page.goto('/mobile.html?lang=en');
  const manifestPath = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifestURL = new URL(manifestPath!, page.url());
  const manifest = await (await request.get(manifestURL.href)).json();
  expect(new URL(manifest.start_url, manifestURL).pathname).toBe('/mobile.html');
  expect(manifest.display).toBe('standalone');
  expect(new URL(manifest.scope, manifestURL).pathname).toBe('/');
  for (const size of [192, 512]) {
    const icon = manifest.icons.find((entry: { sizes: string; purpose: string }) => entry.sizes === `${size}x${size}` && entry.purpose === 'any');
    expect(icon).toBeTruthy();
    const response = await request.get(new URL(icon.src, manifestURL).href);
    expect(response.ok()).toBe(true);
    const image = await response.body();
    expect(image.subarray(1, 4).toString()).toBe('PNG');
    expect(image.readUInt32BE(16)).toBe(size);
    expect(image.readUInt32BE(20)).toBe(size);
  }
});

test('the precached phone shell reloads offline and honors a Chinese language link', async ({ page, context }) => {
  await page.goto('/mobile.html?lang=en');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const before = await page.evaluate(() => localStorage.getItem('udi-studio:0.1'));
  await context.setOffline(true);
  await page.goto('/mobile.html?lang=zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('navigation', { name: '手机导航' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('udi-studio:0.1'))).toBe(before);
  const apiFetched = await page.evaluate(async () => { try { await fetch('./api/plan', { method: 'POST', body: '{}' }); return true; } catch { return false; } });
  expect(apiFetched).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('worker activation cleans only its own app cache and preserves unrelated origin storage', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => { await caches.open('unrelated-app-cache'); await caches.open('udi-pocket:/:obsolete'); });
  await page.goto('/mobile.html?lang=en');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const keys = await page.evaluate(() => caches.keys());
  expect(keys).toContain('unrelated-app-cache');
  expect(keys).not.toContain('udi-pocket:/:obsolete');
  expect(keys.some(key => key.startsWith('udi-pocket:/:'))).toBe(true);
});
