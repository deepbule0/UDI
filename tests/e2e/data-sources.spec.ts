import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { sampleDataset } from '../../src/data/sources';

async function state(page: Page) { return page.evaluate(() => JSON.parse(localStorage.getItem('udi-studio:0.1')!)); }
for (const phone of [false, true]) {
  test(`personal data import, grants, download, and confirmed removal on ${phone ? 'phone' : 'desktop'}`, async ({ page }) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(phone ? '/mobile.html?lang=en' : '/?lang=en');
    const nav = page.getByRole('navigation', { name: phone ? 'Phone navigation' : 'Main navigation' });
    const dataTab = nav.getByRole('button', { name: phone ? 'Data' : 'Data & access', exact: true });
    const homeTab = nav.getByRole('button', { name: phone ? 'Home' : 'Workspace', exact: true });
    await dataTab.click();
    const personal = sampleDataset(); personal.name = 'Private lab'; personal.experiments[0].name = 'PRIVATE_RECORD_SENTINEL';
    await page.getByRole('button', { name: 'Import personal data', exact: true }).click();
    await page.getByRole('textbox', { name: 'Paste dataset JSON', exact: true }).fill(JSON.stringify(personal));
    await page.getByRole('button', { name: 'Import & review access', exact: true }).click();
    const imported = await state(page); const id = imported.datasetId;
    expect(id).toMatch(/^personal-/); expect(imported.instances[id].grants).toEqual([]);
    await homeTab.click();
    await expect(page.getByText('PRIVATE_RECORD_SENTINEL', { exact: true })).toHaveCount(0);
    await dataTab.click();
    await page.getByRole('switch', { name: 'Read experiment results', exact: true }).click();
    await homeTab.click();
    await expect(page.getByText('PRIVATE_RECORD_SENTINEL', { exact: true })).toBeVisible();
    await page.reload(); await expect(page.getByText('PRIVATE_RECORD_SENTINEL', { exact: true })).toBeVisible();
    expect((await state(page)).datasetId).toBe(id);
    await dataTab.click();
    const pendingDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download data: Private lab', exact: true }).click();
    const downloaded = JSON.parse(await fs.readFile((await (await pendingDownload).path())!, 'utf8'));
    expect(downloaded.experiments[0].name).toBe('PRIVATE_RECORD_SENTINEL'); expect(downloaded.grants).toBeUndefined(); expect(downloaded.notes).toBeUndefined();
    const remove = page.getByRole('button', { name: 'Remove data: Private lab', exact: true });
    await remove.click();
    const dialog = page.getByRole('dialog', { name: 'Remove this personal dataset?', exact: true });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect((await state(page)).datasetId).toBe(id);
    await remove.click(); await dialog.getByRole('button', { name: 'Delete local dataset', exact: true }).click();
    const deleted = await state(page); expect(deleted.datasetId).toBe('aurora'); expect(deleted.instances[id]).toBeUndefined(); expect(deleted.spec).toEqual(imported.spec);
    expect(await page.evaluate(() => localStorage.getItem('udi-studio:personal-datasets:0.1'))).not.toContain('PRIVATE_RECORD_SENTINEL');
    await homeTab.click(); await expect(page.getByText('Adaptive attention', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('invalid personal records cannot replace current data or grants', async ({ page }) => {
  await page.goto('/?lang=en');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Data & access', exact: true }).click();
  const before = await state(page);
  await page.getByRole('button', { name: 'Import personal data', exact: true }).click();
  const data = sampleDataset(); data.experiments[0].commitId = 'unknown-commit';
  await page.getByRole('textbox', { name: 'Paste dataset JSON', exact: true }).fill(JSON.stringify(data));
  await page.getByRole('button', { name: 'Import & review access', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('every experiment must reference an existing commit');
  expect(await state(page)).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem('udi-studio:personal-datasets:0.1'))).toBeNull();
});
