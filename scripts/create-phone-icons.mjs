// Render this project's vector mark into PWA icons. No external images required.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

await mkdir('public/icons', { recursive: true });
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
try {
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  for (const [filename, size, maskable] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['maskable-512.png', 512, true], ['apple-touch-icon.png', 180, true]]) {
    await page.setViewportSize({ width: Number(size), height: Number(size) });
    await page.setContent(`<html><head><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#193d32}svg{display:block;width:100%;height:100%}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${maskable ? 0 : 112}" fill="#193d32"/><rect x="116" y="116" width="280" height="280" rx="84" fill="#d5efad"/><path d="M188 192v89a68 68 0 0 0 136 0v-89M256 192v89" fill="none" stroke="#193d32" stroke-width="25" stroke-linecap="round"/><circle cx="370" cy="142" r="27" fill="#f6f7f1"/><circle cx="370" cy="142" r="10" fill="#193d32"/></svg></body></html>`);
    await page.screenshot({ path: `public/icons/${filename}`, omitBackground: true });
  }
} finally { await browser.close(); }
