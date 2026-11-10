import { defineConfig, devices } from '@playwright/test';
import { getEnvironmentConfig } from './src/config/environment';

const environment = getEnvironmentConfig();

export default defineConfig({
  testDir: './src/specs',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? Math.max(environment.retries, 2) : environment.retries,
  workers: environment.workers,
  reporter: 'html',
  expect: {
    timeout: environment.expectTimeoutMs,
  },
  use: {
    baseURL: environment.uiBaseUrl,
    actionTimeout: environment.requestTimeoutMs,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
