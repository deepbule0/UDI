import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Optional real-model integration check. Run the dev server and agent bridge first.
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto('http://127.0.0.1:4178/');
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('combobox', { name: 'Planner mode' }).selectOption('ollama');
  const intent = 'Keep only the unsuccessful runs and bring the paper library into view.';
  await page.getByRole('textbox', { name: 'Describe an interface change' }).fill(intent);
  const pending = page.waitForResponse(response => response.url().endsWith('/api/plan'), { timeout: 55_000 });
  await page.getByRole('button', { name: 'Propose interface change' }).click();
  const response = await pending;
  const output = await response.json();
  assert.equal(response.status(), 200, JSON.stringify(output));
  await page.getByRole('button', { name: 'Apply change' }).waitFor();
  assert.equal(await page.getByRole('table').getByRole('row').count(), 7);
  await page.screenshot({ path: 'docs/assets/udi-review.png', fullPage: true });
  await page.getByRole('button', { name: 'Apply change' }).click();
  await page.getByRole('heading', { name: 'From your library' }).waitFor();
  assert.equal(await page.getByRole('table').getByRole('row').count(), 3);
  await page.screenshot({ path: 'docs/assets/udi-personalized.png', fullPage: true });
  await writeFile('docs/bridge-smoke-results.json', JSON.stringify({
    suite: 'One-case browser → Vite → local bridge → Ollama → review → render integration smoke test',
    generatedAt: new Date().toISOString(), model: process.env.UDI_OLLAMA_MODEL ?? 'See model-smoke-results.json', intent,
    httpStatus: response.status(), output, rowsBeforeApproval: 6, rowsAfterApproval: 2, libraryVisible: true, pass: true,
    limit: 'A selected fictional-data example; not a general model-quality or security evaluation.',
  }, null, 2) + '\n');
  process.stdout.write('Real-model browser integration passed; review and personalized screenshots captured.\n');
} finally { await browser.close(); }
