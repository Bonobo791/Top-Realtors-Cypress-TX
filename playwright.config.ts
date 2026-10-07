import { defineConfig } from '@playwright/test';
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4322';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL,
    javaScriptEnabled: false,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run preview -- --port 4322 --ignore-lock',
        url: baseURL,
        reuseExistingServer: false,
      },
});
