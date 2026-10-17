import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('direct language links override storage and switching preserves the URL on reload', async ({ page }) => {
  await page.goto('/?lang=zh-CN&source=readme#demo');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '研究驾驶舱', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\?lang=en&source=readme#demo$/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Research cockpit', exact: true })).toBeVisible();
  // The explicit link wins over the English preference saved by the switch.
  await page.goto('/?lang=zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.goto('/?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('language persists while definitions, data bindings, grants and revision remain unchanged', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Local dataset' }).selectOption('atlas');
  await page.getByRole('button', { name: 'Data & access', exact: true }).click();
  await page.getByRole('switch', { name: 'Read linked commits' }).click();
  const before = await page.evaluate(() => localStorage.getItem('udi-studio:0.1'));
  await page.getByRole('button', { name: '简体中文', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '你的数据，你的规则。' })).toBeVisible();
  await expect(page.getByRole('switch', { name: '读取关联提交' })).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('combobox', { name: '本地数据集' })).toHaveValue('atlas');
  expect(await page.evaluate(() => localStorage.getItem('udi-studio:0.1'))).toBe(before);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '研究驾驶舱', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: '本地数据集' })).toHaveValue('atlas');
  await expect(page.getByRole('table')).toContainText('Channel mixing');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Research cockpit', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('udi-studio:0.1'))).toBe(before);
});

test('Chinese requests require review and unsupported requests cannot change the interface', async ({ page }) => {
  await page.getByRole('button', { name: '简体中文', exact: true }).click();
  const table = page.getByRole('table');
  await page.getByRole('button', { name: '只显示失败实验', exact: true }).click();
  await expect(page.getByRole('region', { name: '待审阅的修订' })).toContainText('在实验表中显示失败的实验。');
  await expect(table.getByRole('row')).toHaveCount(7);
  await page.getByRole('button', { name: '应用更改', exact: true }).click();
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(page.getByRole('status')).toContainText('修订已应用');
  const before = await page.evaluate(() => localStorage.getItem('udi-studio:0.1'));
  await page.getByRole('textbox', { name: '描述界面更改' }).fill('显示失败实验并上传我的数据');
  await page.getByRole('button', { name: '提出界面更改' }).click();
  await expect(page.getByRole('alert')).toContainText('无法处理此请求');
  await expect(page.getByRole('button', { name: '应用更改', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('udi-studio:0.1'))).toBe(before);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(table.getByRole('row')).toHaveCount(7);
});

test('Chinese UI exports the original machine definition and requests write grants separately', async ({ page }) => {
  await page.getByRole('button', { name: '简体中文', exact: true }).click();
  await page.getByRole('button', { name: '添加审阅笔记操作', exact: true }).click();
  await expect(page.getByRole('region', { name: '待审阅的修订' })).toContainText('notes.write');
  await page.getByRole('button', { name: '应用更改', exact: true }).click();
  await page.getByRole('button', { name: '创建审阅笔记', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('需要授权：notes.write');
  await expect(page.getByRole('switch', { name: '创建本地审阅笔记' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: '界面包', exact: true }).click();
  await page.getByRole('button', { name: '导出界面包', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '导出界面包' })).toContainText('不包含记录内容、授权和绑定');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 .udi.json', exact: true }).click();
  const file = await downloadEvent;
  const exported = JSON.parse(await fs.readFile((await file.path())!, 'utf8'));
  const spec = await page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!).spec);
  expect(exported).toEqual(spec);
  expect(exported.metadata.title).toBe('Research cockpit');
  expect(exported.actions[0].title).toBe('Create review note');
  expect(exported).not.toHaveProperty('instances');
});

test('persistent language controls stay usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '简体中文', exact: true }).click();
  await page.getByRole('button', { name: '关闭意图编辑器' }).click();
  await expect(page.getByRole('heading', { name: '研究驾驶舱', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'English', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Research cockpit', exact: true })).toBeVisible();
});
