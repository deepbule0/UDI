import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  outputDir: 'test-results-pwa',
  testDir: './tests/pwa', fullyParallel: true, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4180', serviceWorkers: 'allow', trace: 'retain-on-failure' },
  projects: [{ name: 'production-phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) } }],
  webServer: { command: 'npm run preview -- --port 4180 --strictPort', url: 'http://127.0.0.1:4180/mobile.html', reuseExistingServer: !process.env.CI },
});
