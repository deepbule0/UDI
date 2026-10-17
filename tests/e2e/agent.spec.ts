import { expect, test, type Page } from '@playwright/test';

type Session = { revision: number; datasetId: string; history: unknown[]; instances: Record<string, { grants: string[]; notes: string[] }>; spec: { layout: string; capabilities: string[]; views: { type: string; filter?: string }[] } };
const session = (page: Page): Promise<Session> => page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!));
const agent = (page: Page) => page.getByRole('region', { name: 'Agent workspace', exact: true });
const review = (page: Page) => agent(page).getByRole('region', { name: 'Proposed revision', exact: true });
async function openAgent(page: Page) {
  await page.goto('/?lang=en');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Agent', exact: true }).click();
}
async function send(page: Page, command: string) {
  await agent(page).getByRole('textbox', { name: 'Message the agent' }).fill(command);
  await agent(page).getByRole('button', { name: 'Send to agent' }).click();
}

test('agent conversation prepares a revision, requires review, and retains local messages', async ({ page }) => {
  await openAgent(page);
  await expect(agent(page)).toContainText('Offline command assistant');
  const before = await session(page);
  await send(page, 'Show only failed experiments');
  await expect(review(page)).toContainText('Show failed experiments');
  expect(await session(page)).toEqual(before);
  await review(page).getByRole('button', { name: 'Apply change', exact: true }).click();
  expect((await session(page)).spec.views.find(v => v.type === 'table')?.filter).toBe('failed');
  await expect(agent(page).getByRole('log')).toContainText('Applied the reviewed change');
  await page.reload();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Agent', exact: true }).click();
  await expect(agent(page).getByRole('log')).toContainText('Show only failed experiments');
  expect((await session(page)).revision).toBe(before.revision + 1);
});

test('settings and chat share reviewed dataset and permission controls', async ({ page }) => {
  await openAgent(page);
  await agent(page).getByRole('tab', { name: 'Controls', exact: true }).click();
  const source = agent(page).getByRole('combobox', { name: 'Agent data source' });
  await source.selectOption('atlas');
  expect((await session(page)).datasetId).toBe('aurora');
  await expect(review(page)).toContainText('Atlas lab');
  await review(page).getByRole('button', { name: 'Apply change', exact: true }).click();
  expect((await session(page)).datasetId).toBe('atlas');
  const permission = agent(page).getByRole('switch', { name: 'Read experiment results', exact: true });
  await permission.click();
  await expect(permission).toHaveAttribute('aria-checked', 'true');
  await review(page).getByRole('button', { name: 'Apply change', exact: true }).click();
  await expect(permission).toHaveAttribute('aria-checked', 'false');
  expect((await session(page)).instances.aurora.grants).toContain('experiments.read');
  await agent(page).getByRole('tab', { name: 'Chat', exact: true }).click();
  await send(page, 'Grant experiment access');
  expect((await session(page)).instances.atlas.grants).not.toContain('experiments.read');
  await review(page).getByRole('button', { name: 'Apply change', exact: true }).click();
  expect((await session(page)).instances.atlas.grants).toContain('experiments.read');
});

test('changing the connected instance invalidates a pending agent review', async ({ page }) => {
  await openAgent(page);
  await send(page, 'Revoke commit access');
  await page.getByRole('combobox', { name: 'Local dataset', exact: true }).selectOption('atlas');
  await expect(review(page).getByRole('button', { name: 'Apply change', exact: true })).toBeDisabled();
  await expect(review(page)).toContainText('The workspace changed');
  expect((await session(page)).instances.atlas.grants).toContain('commits.read');
  expect((await session(page)).instances.aurora.grants).toContain('commits.read');
});

test('adding and granting note creation does not execute a write', async ({ page }) => {
  await openAgent(page);
  await send(page, 'Add a review-note action');
  await expect(review(page)).toContainText('will not be granted automatically');
  await review(page).getByRole('button', { name: 'Apply change', exact: true }).click();
  expect((await session(page)).instances.aurora.grants).not.toContain('notes.write');
  await agent(page).getByRole('tab', { name: 'Controls', exact: true }).click();
  await agent(page).getByRole('switch', { name: 'Create local review notes', exact: true }).click();
  await review(page).getByRole('button', { name: 'Apply change', exact: true }).click();
  expect((await session(page)).instances.aurora.grants).toContain('notes.write');
  expect((await session(page)).instances.aurora.notes).toEqual([]);
  await agent(page).getByRole('button', { name: 'Undo', exact: true }).click();
  expect((await session(page)).spec.capabilities).not.toContain('notes.write');
  expect((await session(page)).instances.aurora.grants).toContain('notes.write');
  expect((await session(page)).instances.aurora.notes).toEqual([]);
});

test('optional local bridge receives only prompt and definition and cannot bypass data validation', async ({ page }) => {
  await page.goto('/?lang=en');
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('udi-studio:0.1')!);
    state.instances.aurora.notes.push('PRIVATE_NOTE_SENTINEL');
    localStorage.setItem('udi-studio:0.1', JSON.stringify(state));
  });
  await openAgent(page);
  await agent(page).getByRole('combobox', { name: 'Agent planner' }).selectOption('ollama');
  const payloads: Record<string, unknown>[] = [];
  await page.route('**/api/plan', async route => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({ json: { summary: 'Focus the workspace.', operations: [{ op: 'layout', value: 'focus' }] } });
  });
  await send(page, 'Make this workspace simpler for me');
  await expect(review(page)).toContainText('Focus the workspace');
  expect(payloads).toHaveLength(1);
  expect(Object.keys(payloads[0]).sort()).toEqual(['intent', 'revision', 'spec']);
  expect(JSON.stringify(payloads[0])).not.toContain('PRIVATE_NOTE_SENTINEL');
  await review(page).getByRole('button', { name: 'Discard', exact: true }).click();
  await send(page, 'Grant experiment access');
  await expect(agent(page).getByRole('alert')).toContainText('already has');
  expect(payloads).toHaveLength(1);
  expect((await session(page)).spec.layout).toBe('balanced');
});

test.describe('phone agent', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('phone controls stay touch accessible and apply the same revisions', async ({ page }) => {
    await page.goto('/mobile.html?lang=en');
    const nav = page.getByRole('navigation', { name: 'Phone navigation' });
    await nav.getByRole('button', { name: 'Agent', exact: true }).tap();
    await agent(page).getByRole('tab', { name: 'Controls', exact: true }).tap();
    for (const control of await agent(page).getByRole('switch').all()) {
      const bounds = await control.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44);
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
    }
    await agent(page).getByRole('combobox', { name: 'Experiment filter', exact: true }).selectOption('failed');
    expect((await session(page)).revision).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await review(page).getByRole('button', { name: 'Apply change', exact: true }).tap();
    await expect(page.getByRole('button', { name: /^Inspect EXP-\d+$/ })).toHaveCount(2);
  });
  test('Chinese phone agent controls data through a reviewed command', async ({ page }) => {
    await page.goto('/mobile.html?lang=zh-CN');
    await page.getByRole('navigation', { name: '手机导航' }).getByRole('button', { name: '智能体', exact: true }).tap();
    const panel = page.getByRole('region', { name: '智能体工作空间', exact: true });
    await panel.getByRole('textbox', { name: '向智能体发送指令' }).fill('撤销实验访问权限');
    await panel.getByRole('button', { name: '发送给智能体' }).tap();
    expect((await session(page)).instances.aurora.grants).toContain('experiments.read');
    await panel.getByRole('region', { name: '待审阅的修订', exact: true }).getByRole('button', { name: '应用更改', exact: true }).tap();
    expect((await session(page)).instances.aurora.grants).not.toContain('experiments.read');
    await page.getByRole('navigation', { name: '手机导航' }).getByRole('button', { name: '首页', exact: true }).tap();
    await expect(page.getByRole('button', { name: /^查看实验 EXP-\d+$/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});
