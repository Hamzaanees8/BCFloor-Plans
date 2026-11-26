import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for BCF Booking, Calendar, Travel & Breaks UI Suite.
 *
 * Install once:
 *   npm install -D @playwright/test dotenv
 *   npx playwright install chromium
 *
 * Run all tests:
 *   npx playwright test
 *
 * View HTML report:
 *   npx playwright show-report
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Keep sequential by default to avoid DB slot contention
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    timezoneId: 'America/Vancouver',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
