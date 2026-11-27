import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL,
    launchOptions: {
      executablePath: process.env.PREFS_CHROME_EXECUTABLE,
    },
  },
  webServer: {
    command: 'npm exec -- vite --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
  },
});
