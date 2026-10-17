import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { phoneAppWorker } from './scripts/pwa.ts';

export default defineConfig({
  base: './',
  plugins: [react(), phoneAppWorker()],
  build: { rollupOptions: { input: { desktop: 'index.html', mobile: 'mobile.html' } } },
  server: { proxy: { '/api/plan': 'http://127.0.0.1:4179' } },
  test: { include: ['tests/**/*.test.ts'] },
});
