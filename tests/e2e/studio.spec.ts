import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('review, apply, undo, persist and rebind a definition', async ({ page }) => {
  const table = page.getByRole('table');
  await expect(table.getByRole('row')).toHaveCount(7);
  await page.getByRole('button', { name: 'Show only failed experiments' }).click();
  await expect(table.getByRole('row')).toHaveCount(7);
  await page.getByRole('button', { name: 'Apply change' }).click();
  await expect(table.getByRole('row')).toHaveCount(3);
  await page.reload();
  await expect(table.getByRole('row')).toHaveCount(3);
  await page.getByRole('combobox', { name: 'Local dataset' }).selectOption('atlas');
  await expect(table.getByRole('row')).toHaveCount(2);
  await expect(table).toContainText('Channel mixing');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(table.getByRole('row')).toHaveCount(5);
});

test('revocation affects rendering and write effects require an explicit grant and confirmation', async ({ page }) => {
  await page.getByRole('button', { name: 'Data & access', exact: true }).click();
  await page.getByText('Advanced access details', { exact: true }).click();
  await page.getByRole('switch', { name: 'Read experiment results' }).click();
  await page.getByRole('button', { name: 'Workspace', exact: true }).click();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.getByRole('button', { name: 'Data & access', exact: true }).click();
  await page.getByText('Advanced access details', { exact: true }).click();
  await page.getByRole('switch', { name: 'Read experiment results' }).click();
  await page.getByRole('button', { name: 'Workspace', exact: true }).click();
  await page.getByRole('button', { name: 'Add a review-note action' }).click();
  await page.getByRole('button', { name: 'Apply change' }).click();
  await page.getByRole('button', { name: 'Data & access', exact: true }).click();
  await page.getByText('Advanced access details', { exact: true }).click();
  await page.getByRole('switch', { name: 'Create local review notes' }).click();
  await page.getByRole('button', { name: 'Workspace', exact: true }).click();
  await page.getByRole('button', { name: 'Create review note', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('2 failed experiments');
  await page.getByRole('button', { name: 'Approve & create local note' }).click();
  await page.getByRole('button', { name: 'Data & access', exact: true }).click();
  await page.getByText('Advanced access details', { exact: true }).click();
  await expect(page.getByText('Local review notes', { exact: true })).toBeVisible();
  await expect(page.locator('.saved-note')).toHaveCount(1);
});

test('export and import preserves the definition and clears grants', async ({ page }) => {
  await page.getByRole('button', { name: 'Advanced tools' }).click();
  await page.getByRole('button', { name: 'Export package', exact: true }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .udi.json' }).click();
  const download = await downloadEvent;
  const path = await download.path();
  const text = await fs.readFile(path!, 'utf8');
  expect(text).not.toContain('EXP-048');
  expect(text).not.toContain('local-aurora');
  await page.getByRole('button', { name: 'Import package', exact: true }).click();
  await page.getByRole('textbox', { name: 'Package JSON' }).fill(text);
  await page.getByRole('button', { name: 'Validate package' }).click();
  await page.getByRole('button', { name: 'Install & review data access' }).click();
  await page.getByText('Advanced access details', { exact: true }).click();
  expect(await page.getByRole('switch').count()).toBeGreaterThan(0);
  for (const toggle of await page.getByRole('switch').all()) await expect(toggle).toHaveAttribute('aria-checked', 'false');
});

test('layout stays usable on narrow screens and has no page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Close intent editor' }).click();
  await expect(page.getByRole('heading', { name: 'Research cockpit', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('local-model mode validates a fixture-backed response before review', async ({ page }) => {
  await page.route('**/api/plan', async route => {
    const input = route.request().postDataJSON();
    expect(Object.keys(input).sort()).toEqual(['intent', 'revision', 'spec']);
    await route.fulfill({ json: { summary: 'Show failed runs and the paper library.', operations: [{ op: 'filter', value: 'failed' }, { op: 'add-papers' }] } });
  });
  await page.getByRole('combobox', { name: 'Planner mode' }).selectOption('ollama');
  await page.getByRole('textbox', { name: 'Describe an interface change' }).fill('Put failing runs up front and include my papers');
  await page.getByRole('button', { name: 'Propose interface change' }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(7);
  await page.getByRole('button', { name: 'Apply change' }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'From your library' })).toBeVisible();
});
