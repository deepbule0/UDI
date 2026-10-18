import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { createInstances } from '../../src/data/fixtures';
import { createPersonalInstance, sampleDataset } from '../../src/data/sources';
import type { UDISpec } from '../../src/core/types';

const storageKey = 'udi-studio:0.1';
const personalKey = 'udi-studio:personal-datasets:0.1';
const original = (): UDISpec => JSON.parse(fs.readFileSync(new URL('../../examples/research-cockpit.udi.json', import.meta.url), 'utf8'));
function sharedDefinition() {
  const spec = original();
  spec.metadata.id = 'shared-failure-first';
  spec.metadata.title = 'My shared focus 🌿';
  spec.metadata.description = 'A calmer workspace for finding experiments that need attention.';
  spec.layout = 'focus';
  spec.views.find(view => view.type === 'table')!.filter = 'failed';
  return spec;
}
function fragment(spec: unknown) { return `#udi=v1.p.${Buffer.from(JSON.stringify(spec), 'utf8').toString('base64url')}`; }
async function session(page: Page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey); }
async function seedPrivateRecords(page: Page) {
  const personal = sampleDataset();
  personal.id = 'personal-00000000-0000-4000-8000-000000000000';
  personal.name = 'Private laboratory';
  personal.experiments[0].name = 'PRIVATE_RECORD_SENTINEL';
  const instances = createInstances();
  instances.aurora.notes.push('PRIVATE_NOTE_SENTINEL');
  const mine = createPersonalInstance(personal);
  mine.grants = ['experiments.read', 'commits.read', 'notes.write'];
  mine.notes = ['PRIVATE_PERSONAL_NOTE_SENTINEL'];
  instances[personal.id] = mine;
  const saved = { spec: original(), revision: 7, history: [], datasetId: personal.id, instances, audit: [{ id: 'old-private-event', kind: 'binding', time: '2026-10-17T00:00:00.000Z', message: 'PRIVATE_AUDIT_SENTINEL' }] };
  await page.addInitScript(({ saved, personal, storageKey, personalKey }) => {
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(personalKey, JSON.stringify([personal]));
      localStorage.setItem(storageKey, JSON.stringify(saved));
      localStorage.setItem('udi-agent:chat:0.1', JSON.stringify([{ role: 'user', text: 'PRIVATE_CHAT_SENTINEL' }]));
    }
  }, { saved, personal, storageKey, personalKey });
  return { saved, personal };
}

test('anyone can name and copy an interface link without uploading records or opening another service', async ({ page, context }) => {
  const requests: string[] = [];
  context.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4178/')) requests.push(`${request.method()} ${request.url()}`); });
  await seedPrivateRecords(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => { (window as Window & { copiedInterface?: string }).copiedInterface = value; } } });
  });
  await page.goto('/?lang=en');
  const before = await session(page);
  const share = page.getByRole('button', { name: 'Share this interface', exact: true });
  await share.click();
  const dialog = page.getByRole('dialog', { name: 'Share this interface' });
  await dialog.getByRole('textbox', { name: 'Give it a name' }).fill('My reading desk 🌿');
  await dialog.getByRole('textbox', { name: 'What makes it useful?' }).fill('For a quiet afternoon of reviewing results.');
  await expect(dialog).toContainText('leaves out your records');
  const copy = dialog.getByRole('button', { name: 'Copy link', exact: true });
  await expect(copy).toBeEnabled(); await copy.click();
  await expect(dialog.getByRole('button', { name: 'Link copied' })).toBeVisible();
  const link = await page.evaluate(() => (window as Window & { copiedInterface?: string }).copiedInterface!);
  const url = new URL(link);
  expect(url.pathname).toBe('/'); expect(url.search).toBe('?lang=en'); expect(url.hash).toMatch(/^#udi=v1\.[pz]\./);
  expect(await session(page)).toEqual(before);
  expect(requests).toEqual([]);
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(share).toBeFocused();
  await page.goto(link);
  const received = page.getByRole('dialog', { name: 'An interface shared with you' });
  await expect(received.getByRole('heading', { name: 'My reading desk 🌿' })).toBeVisible();
  await expect(received).not.toContainText('PRIVATE_RECORD_SENTINEL');
  await expect(received).not.toContainText('PRIVATE_NOTE_SENTINEL');
  await expect(received).not.toContainText('PRIVATE_CHAT_SENTINEL');
  await expect(received).not.toContainText('PRIVATE_AUDIT_SENTINEL');
  expect(await session(page)).toEqual(before);
});

for (const entry of ['/', '/mobile.html']) {
  test(`${entry} initial shared link survives StrictMode, previews sample data, and uses only after review`, async ({ page }) => {
    const { saved, personal } = await seedPrivateRecords(page);
    const spec = sharedDefinition();
    await page.goto(`${entry}?lang=en${fragment(spec)}`);
    const dialog = page.getByRole('dialog', { name: 'An interface shared with you' });
    await expect(dialog.getByRole('heading', { name: spec.metadata.title })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('');
    await expect(dialog.locator('.experience-preview')).toBeVisible();
    await expect(dialog).toContainText('Learning-rate ablation');
    await expect(dialog).not.toContainText('Adaptive attention');
    await expect(dialog).not.toContainText('PRIVATE_RECORD_SENTINEL');
    expect((await session(page)).spec).toEqual(saved.spec);
    expect((await session(page)).revision).toBe(7);
    await expect(dialog).toContainText('all data access turned off');
    await dialog.getByRole('button', { name: 'Use this interface', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const after = await session(page);
    expect(after.spec).toEqual(spec); expect(after.revision).toBe(8);
    expect(after.datasetId).toBe(personal.id);
    for (const instance of Object.values(after.instances) as { grants: string[] }[]) expect(instance.grants).toEqual([]);
    expect(after.instances.aurora.notes).toContain('PRIVATE_NOTE_SENTINEL');
    expect(after.instances[personal.id].notes).toContain('PRIVATE_PERSONAL_NOTE_SENTINEL');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), personalKey)).toEqual([personal]);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('udi-agent:chat:0.1')!))).toEqual([{ role: 'user', text: 'PRIVATE_CHAT_SENTINEL' }]);
    if (entry === '/') await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your data. Your rules.');
    else await expect(page.getByRole('navigation', { name: 'Phone navigation' }).getByRole('button', { name: 'Data', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.reload();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect((await session(page)).spec).toEqual(spec);
  });
}

test('closing a shared preview leaves every local record and access approval unchanged', async ({ page }) => {
  const { saved } = await seedPrivateRecords(page);
  await page.goto(`/?lang=en${fragment(sharedDefinition())}`);
  const dialog = page.getByRole('dialog', { name: 'An interface shared with you' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Keep my current interface' }).click();
  await expect(dialog).toHaveCount(0);
  expect(await session(page)).toEqual(saved);
});

test('malformed and state-bearing links are removed and cannot change a local interface', async ({ page }) => {
  const { saved } = await seedPrivateRecords(page);
  for (const hash of ['#udi=v8.p.invalid', fragment({ ...sharedDefinition(), grants: ['notes.write'], records: ['PRIVATE'] })]) {
    await page.goto(`/?lang=en${hash}`);
    await expect(page.getByRole('alert')).toContainText('This interface link could not be opened.');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(new URL(page.url()).hash).toBe('');
    expect(await session(page)).toEqual(saved);
  }
});

test('Chinese phone sharing and preview stay readable, touch-accessible, and within 390 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedPrivateRecords(page);
  await page.goto(`/mobile.html?lang=zh-CN${fragment(sharedDefinition())}`);
  const dialog = page.getByRole('dialog', { name: '与你分享的界面' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.experience-preview')).toContainText('示例工作空间');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  const use = dialog.getByRole('button', { name: '使用这个界面', exact: true });
  expect((await use.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: '分享这个界面', exact: true }).click();
  const sharing = page.getByRole('dialog', { name: '分享这个界面' });
  await expect(sharing.getByRole('textbox', { name: '给它起个名字' })).toBeVisible();
  await expect(sharing.getByRole('button', { name: '复制链接', exact: true })).toBeEnabled();
  expect(await sharing.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '分享这个界面', exact: true })).toBeFocused();
});
