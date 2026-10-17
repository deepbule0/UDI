import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { createInstances } from '../../src/data/fixtures';
import type { UDISpec } from '../../src/core/types';

const COMMUNITY_API = 'https://api.github.com/repos/deepbule0/UDI/issues?state=open&labels=udi-interface&per_page=50';
const COMMUNITY_MARKER = '<!-- udi-interface:0.1 -->';
const initialSpec = (): UDISpec => JSON.parse(fs.readFileSync(new URL('../../examples/research-cockpit.udi.json', import.meta.url), 'utf8'));
const exportPackage = (spec: UDISpec) => JSON.stringify(spec, null, 2) + '\n';

const testSpec = initialSpec();
testSpec.metadata.id = 'test-shared-interface';
testSpec.metadata.title = 'Shared failure-first workspace';
testSpec.views.find(view => view.type === 'table')!.filter = 'failed';
const fixtureIssue = { number: 42, state: 'open', title: 'Shared failure-first workspace', labels: [{ name: 'udi-interface' }], user: { login: 'test-contributor' }, created_at: '2026-10-17T01:00:00Z', body: `${COMMUNITY_MARKER}\n\n\`\`\`json\n${exportPackage(testSpec)}\`\`\`` };
async function mockFeed(page: Page, issues: unknown[] = [fixtureIssue]) {
  await page.route(COMMUNITY_API, route => route.fulfill({ json: issues }));
}
async function seedPrivateInstance(page: Page) {
  const instances = createInstances();
  instances.aurora.notes.push('PRIVATE_NOTE_SENTINEL');
  await page.addInitScript(state => { if (!localStorage.getItem('udi-studio:0.1')) localStorage.setItem('udi-studio:0.1', JSON.stringify(state)); }, {
    spec: initialSpec(), revision: 1, history: [], instances, datasetId: 'aurora', audit: [],
  });
}
async function openCommunity(page: Page, mobile = false, language = 'en') {
  await page.goto(mobile ? `/mobile.html?lang=${language}` : `/?lang=${language}`);
  const nav = page.getByRole('navigation', { name: mobile ? language === 'en' ? 'Phone navigation' : '手机导航' : language === 'en' ? 'Main navigation' : '主导航' });
  await nav.getByRole('button', { name: /^(Community|社区)$/ }).click();
}

test('community browses valid real-format posts, ignores malformed posts, and filters project starters', async ({ page }) => {
  await mockFeed(page, [fixtureIssue, { ...fixtureIssue, number: 43, title: 'Invalid executable interface', body: `${COMMUNITY_MARKER}\n\`\`\`json\n{"agentCode":"evil"}\n\`\`\`` }]);
  await openCommunity(page);
  await expect(page.getByText('Live GitHub community', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Shared failure-first workspace', exact: true })).toBeVisible();
  await expect(page.getByText('Invalid executable interface')).toHaveCount(0);
  await expect(page.getByText('@test-contributor', { exact: true })).toBeVisible();
  await expect(page.locator('.uc-card .uc-badge').filter({ hasText: 'UDI project starter' })).toHaveCount(3);
  await page.getByRole('combobox', { name: 'Interface source' }).selectOption('github');
  await expect(page.locator('.uc-card')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Search interfaces' }).fill('no matching title');
  await expect(page.getByRole('heading', { name: 'No matching interfaces.' })).toBeVisible();
});

test('reviewed community installation clears grants across datasets and preserves private notes', async ({ page }) => {
  await mockFeed(page); await seedPrivateInstance(page); await openCommunity(page);
  const card = page.locator('.uc-card').filter({ has: page.getByRole('heading', { name: 'Shared failure-first workspace', exact: true }) });
  await card.getByRole('button', { name: 'Preview & install' }).click();
  const dialog = page.getByRole('dialog', { name: 'Review interface installation' });
  await expect(dialog.getByRole('button', { name: 'Install interface', exact: true })).toBeDisabled();
  await expect(dialog).toContainText('experiments.read');
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!));
  expect(before.spec.metadata.id).not.toBe('test-shared-interface');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Install interface', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!));
  expect(after.spec).toEqual(testSpec);
  expect(after.instances.aurora.notes).toContain('PRIVATE_NOTE_SENTINEL');
  for (const instance of Object.values(after.instances) as { grants: string[] }[]) expect(instance.grants).toEqual([]);
  expect(after.datasetId).toBe('aurora');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your data. Your rules.');
});

test('project starter fork installation requires review and records a separate interface identity', async ({ page }) => {
  await mockFeed(page, []); await openCommunity(page);
  await expect(page.getByText('No valid interface posts yet.', { exact: false })).toBeVisible();
  const card = page.locator('.uc-card').filter({ has: page.getByRole('heading', { name: 'Focused experiments', exact: true }) });
  await card.getByRole('button', { name: 'Preview & install' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Fork & install', exact: true }).click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!));
  expect(state.spec.metadata.id).toBe('udi-starter-focused-fork');
  expect(state.spec.layout).toBe('focus');
});

test('posting reviews an exact definition and opens a mocked GitHub composer without submitting', async ({ page, context }) => {
  await mockFeed(page, []); await seedPrivateInstance(page);
  const githubRequests: string[] = [];
  await context.route('https://github.com/**', async route => {
    githubRequests.push(route.request().method());
    await route.fulfill({ contentType: 'text/html', body: '<title>Test-only composer</title><p>No external submission occurs in this test.</p>' });
  });
  await openCommunity(page);
  await page.getByRole('button', { name: 'Post interface', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Post your interface' });
  await expect(dialog.getByRole('button', { name: 'Open GitHub composer' })).toBeDisabled();
  const packageText = await dialog.locator('.uc-spec pre').innerText();
  expect(JSON.parse(packageText)).toEqual(initialSpec());
  expect(packageText).not.toContain('PRIVATE_NOTE_SENTINEL');
  expect(packageText).not.toContain('EXP-048');
  expect(packageText).not.toContain('local-aurora');
  await dialog.getByRole('checkbox').check();
  const link = dialog.getByRole('link', { name: 'Open GitHub composer' });
  const composer = new URL((await link.getAttribute('href'))!);
  expect(composer.origin + composer.pathname).toBe('https://github.com/deepbule0/UDI/issues/new');
  expect(composer.searchParams.get('template')).toBe('share-interface.md');
  expect(composer.searchParams.get('body')).not.toContain('PRIVATE_NOTE_SENTINEL');
  const popupEvent = page.waitForEvent('popup');
  await link.click();
  const popup = await popupEvent; await popup.waitForLoadState();
  await expect(popup).toHaveTitle('Test-only composer');
  expect(githubRequests).toEqual(['GET']);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!).revision)).toBe(1);
});

test('phone community is bilingual, touch-accessible, and stays within 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockFeed(page, []); await openCommunity(page, true, 'zh-CN');
  await expect(page.getByRole('heading', { name: '发现下一个适合你的界面。' })).toBeVisible();
  await expect(page.getByRole('button', { name: '发布界面', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const post = page.getByRole('button', { name: '发布界面', exact: true });
  expect((await post.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await post.click();
  const dialog = page.getByRole('dialog', { name: '发布你的界面' });
  await expect(dialog).toContainText('仅导出界面定义');
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(post).toBeFocused();
});

test('rate limiting is explicitly shown as cached community data', async ({ page }) => {
  let fail = false;
  await page.route(COMMUNITY_API, route => fail ? route.fulfill({ status: 403, json: { message: 'API rate limit' } }) : route.fulfill({ json: [fixtureIssue] }));
  await openCommunity(page);
  await expect(page.getByText('Live GitHub community', { exact: true })).toBeVisible();
  fail = true;
  await page.getByRole('button', { name: 'Refresh community' }).click();
  await expect(page.getByText('Cached GitHub posts', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Shared failure-first workspace', exact: true })).toBeVisible();
});
