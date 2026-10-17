import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import type { UDISpec } from '../../src/core/types';

interface SavedSession {
  spec: UDISpec;
  revision: number;
  datasetId: string;
  instances: Record<string, { grants: string[]; notes: string[] }>;
}

const phoneNavigation = (page: Page) => page.getByRole('navigation', { name: 'Phone navigation' });
const runs = (page: Page) => page.getByRole('button', { name: /^Inspect (?:EXP|AUD)-\d+$/ });
const session = (page: Page): Promise<SavedSession> => page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!));
async function navigate(page: Page, name: string) {
  const button = phoneNavigation(page).getByRole('button', { name, exact: true });
  await button.tap();
  await expect(button).toHaveAttribute('aria-current', 'page');
}
async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`phone navigation stays touch-accessible at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto('/mobile.html?lang=en');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your research,');
    await expect(runs(page)).toHaveCount(6);
    await noHorizontalOverflow(page);

    const nav = phoneNavigation(page);
    const navBounds = await nav.boundingBox();
    expect(navBounds).not.toBeNull();
    expect(navBounds!.y + navBounds!.height).toBeLessThanOrEqual(viewport.height);
    for (const button of await nav.getByRole('button').all()) {
      const bounds = await button.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }

    for (const [name, heading] of [
      ['Agent', 'Agent'], ['Data', 'Data on your terms.'],
      ['Community', 'Community'], ['Activity', 'A trace of your choices.'],
      ['Home', 'Your research,'],
    ]) {
      await navigate(page, name);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
      await noHorizontalOverflow(page);
    }
    expect(errors).toEqual([]);
  });
}

test('phone revisions require review, persist after reload, and can be undone', async ({ page }) => {
  await page.goto('/mobile.html?lang=en');
  const before = await session(page);
  await navigate(page, 'Agent');
  await page.getByRole('button', { name: /Show only failed experiments$/ }).tap();
  await expect(page.getByRole('region', { name: 'Proposed revision' })).toContainText('Show failed experiments');
  expect(await session(page)).toEqual(before);
  await navigate(page, 'Home');
  await expect(runs(page)).toHaveCount(6);
  await navigate(page, 'Agent');
  await page.getByRole('button', { name: 'Apply change', exact: true }).tap();
  await expect(runs(page)).toHaveCount(2);
  await expect(runs(page)).toContainText(['Learning-rate ablation', 'Feature fusion v2']);
  expect((await session(page)).revision).toBe(before.revision + 1);
  await page.reload();
  await expect(runs(page)).toHaveCount(2);
  await navigate(page, 'Agent');
  await page.getByRole('button', { name: 'Undo', exact: true }).tap();
  await navigate(page, 'Home');
  await expect(runs(page)).toHaveCount(6);
  expect((await session(page)).spec).toEqual(before.spec);
  expect((await session(page)).revision).toBe(before.revision + 2);
});

test('same phone definition binds to independent data and honors instance read revocation', async ({ page }) => {
  await page.goto('/mobile.html?lang=en');
  const definition = (await session(page)).spec;
  await navigate(page, 'Data');
  const readExperiments = page.getByRole('switch', { name: 'Read experiment results', exact: true });
  await readExperiments.tap();
  await expect(readExperiments).toHaveAttribute('aria-checked', 'false');
  await navigate(page, 'Home');
  await expect(runs(page)).toHaveCount(0);
  await expect(page.getByText('Adaptive attention', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Access to this source is turned off.', { exact: true }).first()).toBeVisible();

  await page.getByRole('combobox', { name: 'Local dataset', exact: true }).selectOption('atlas');
  await expect(runs(page)).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Inspect AUD-019', exact: true })).toContainText('Channel mixing');
  await navigate(page, 'Data');
  await expect(readExperiments).toHaveAttribute('aria-checked', 'true');
  await navigate(page, 'Home');
  await page.getByRole('combobox', { name: 'Local dataset', exact: true }).selectOption('aurora');
  await expect(runs(page)).toHaveCount(0);
  const after = await session(page);
  expect(after.spec).toEqual(definition);
  expect(after.instances.aurora.grants).not.toContain('experiments.read');
  expect(after.instances.atlas.grants).toContain('experiments.read');
});

test('phone language links override saved preferences without changing the local definition', async ({ page }) => {
  await page.goto('/mobile.html?lang=zh-CN&source=readme#phone');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('你的研究，');
  await page.getByRole('navigation', { name: '手机导航' }).getByRole('button', { name: '数据', exact: true }).tap();
  await page.getByRole('switch', { name: '读取关联提交', exact: true }).tap();
  const before = await session(page);
  await page.getByRole('button', { name: 'English', exact: true }).tap();
  await expect(page).toHaveURL(/\/mobile\.html\?lang=en&source=readme#phone$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(await session(page)).toEqual(before);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/mobile.html?lang=zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.goto('/mobile.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  expect(await session(page)).toEqual(before);
});

test('phone evidence sheets support keyboard dismissal and respect commit grants', async ({ page }) => {
  await page.goto('/mobile.html?lang=en');
  const record = page.getByRole('button', { name: 'Inspect EXP-047', exact: true });
  await record.tap();
  const evidence = page.getByRole('dialog', { name: 'Recorded evidence', exact: true });
  await expect(evidence).toContainText('8ac13d2');
  await expect(evidence).toContainText('training/scheduler.py');
  await noHorizontalOverflow(page);
  await page.keyboard.press('Escape');
  await expect(evidence).toHaveCount(0);
  await expect(record).toBeFocused();

  await navigate(page, 'Data');
  await page.getByRole('switch', { name: 'Read linked commits', exact: true }).tap();
  await navigate(page, 'Home');
  await record.tap();
  await expect(evidence).toContainText('Commit access is unavailable.');
  await expect(evidence).not.toContainText('8ac13d2');
  await expect(evidence).not.toContainText('training/scheduler.py');
  await evidence.getByRole('button', { name: 'Close dialog', exact: true }).tap();
  await expect(evidence).toHaveCount(0);
});

test('phone exports only a definition and imports require fresh grants for both instances', async ({ page }) => {
  await page.goto('/mobile.html?lang=en');
  const definition = (await session(page)).spec;
  await navigate(page, 'Community');
  await page.getByText('Local package tools', { exact: true }).tap();
  await page.getByRole('button', { name: 'Export package', exact: true }).tap();
  const exportedDialog = page.getByRole('dialog', { name: 'Export interface package', exact: true });
  await expect(exportedDialog).toContainText('Record payloads, grants, and bindings excluded');
  const downloadEvent = page.waitForEvent('download');
  await exportedDialog.getByRole('button', { name: 'Download .udi.json', exact: true }).tap();
  const download = await downloadEvent;
  const text = await fs.readFile((await download.path())!, 'utf8');
  expect(JSON.parse(text)).toEqual(definition);
  expect(text).not.toContain('EXP-048');
  expect(text).not.toContain('local-aurora');
  await page.getByRole('button', { name: 'Import package', exact: true }).tap();
  const importedDialog = page.getByRole('dialog', { name: 'Import package', exact: true });
  await importedDialog.getByRole('textbox', { name: 'Paste package JSON', exact: true }).fill(text);
  await importedDialog.getByRole('button', { name: 'Validate package', exact: true }).tap();
  await expect(importedDialog).toContainText('Validated. Ready to review.');
  // Validation is review-only; existing read access remains until installation.
  expect((await session(page)).instances.aurora.grants).toContain('experiments.read');
  await importedDialog.getByRole('button', { name: 'Install & review data access', exact: true }).tap();
  await expect(importedDialog).toHaveCount(0);
  for (const toggle of await page.getByRole('switch').all()) await expect(toggle).toHaveAttribute('aria-checked', 'false');
  const installed = await session(page);
  expect(installed.spec).toEqual(definition);
  expect(installed.instances.aurora.grants).toEqual([]);
  expect(installed.instances.atlas.grants).toEqual([]);
  await navigate(page, 'Home');
  await expect(runs(page)).toHaveCount(0);
  await navigate(page, 'Data');
  await page.getByRole('switch', { name: 'Read experiment results', exact: true }).tap();
  await navigate(page, 'Home');
  await expect(runs(page)).toHaveCount(6);
  await page.getByRole('combobox', { name: 'Local dataset', exact: true }).selectOption('atlas');
  await expect(runs(page)).toHaveCount(0);
});

test('phone note creation needs a grant and a separate exact-write confirmation', async ({ page }) => {
  await page.goto('/mobile.html?lang=en');
  await navigate(page, 'Agent');
  await page.getByRole('button', { name: /Add a review-note action$/ }).tap();
  await expect(page.getByRole('region', { name: 'Proposed revision' })).toContainText('notes.write');
  await page.getByRole('button', { name: 'Apply change', exact: true }).tap();
  await page.getByRole('button', { name: 'Create review note', exact: true }).tap();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const writeGrant = page.getByRole('switch', { name: 'Create local review notes', exact: true });
  await expect(writeGrant).toHaveAttribute('aria-checked', 'false');
  await writeGrant.tap();
  await navigate(page, 'Home');
  await page.getByRole('button', { name: 'Create review note', exact: true }).tap();
  const confirmation = page.getByRole('dialog', { name: 'Review local write', exact: true });
  await expect(confirmation).toContainText('2 failed experiments');
  expect((await session(page)).instances.aurora.notes).toHaveLength(0);
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).tap();
  expect((await session(page)).instances.aurora.notes).toHaveLength(0);
  await page.getByRole('button', { name: 'Create review note', exact: true }).tap();
  await confirmation.getByRole('button', { name: 'Approve & create local note', exact: true }).tap();
  const after = await session(page);
  expect(after.instances.aurora.notes).toHaveLength(1);
  expect(after.instances.atlas.notes).toHaveLength(0);
  await expect(page.getByRole('heading', { name: 'Local review notes', exact: true })).toBeVisible();
});

test('phone install metadata points to available assets within its app scope', async ({ page, request }) => {
  await page.goto('/mobile.html?lang=en');
  const manifestURL = await page.locator('link[rel="manifest"]').evaluate((link: HTMLLinkElement) => link.href);
  const response = await request.get(manifestURL);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe('standalone');
  const start = new URL(manifest.start_url, manifestURL);
  const scope = new URL(manifest.scope, manifestURL);
  expect(start.pathname).toMatch(/\/mobile\.html$/);
  expect(start.href.startsWith(scope.href)).toBe(true);
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const icon of manifest.icons as { src: string }[]) {
    const asset = await request.get(new URL(icon.src, manifestURL).href);
    expect(asset.ok()).toBe(true);
    expect(asset.headers()['content-type']).toMatch(/^image\//);
  }
  await page.getByRole('button', { name: 'About & install', exact: true }).tap();
  const about = page.getByRole('dialog', { name: 'About & install', exact: true });
  await expect(about).toContainText('Add to Home Screen');
  await expect(about).toContainText('no App Store or Play Store release');
  await about.getByRole('button', { name: 'Close dialog', exact: true }).tap();
  await expect(about).toHaveCount(0);
});
