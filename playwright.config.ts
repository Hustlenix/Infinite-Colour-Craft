import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: { timeout: 10000 },
  workers: 2,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:43137/',
    channel: 'chromium',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'rtk proxy npx vite --host 127.0.0.1 --port 43137 --strictPort',
    url: 'http://127.0.0.1:43137',
    reuseExistingServer: true,
  },
});
