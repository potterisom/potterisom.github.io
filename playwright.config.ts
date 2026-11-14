import { defineConfig } from '@playwright/test';

// Screenshot checks (spec §5): every page at 1440 and 390 wide.
// `npm run shots` builds nothing itself — it serves the last `npm run build`.
export default defineConfig({
  testDir: 'tests',
  outputDir: 'test-results',
  reporter: 'list',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:4321',
    // set PW_CHROME to a local Chrome if Playwright's own browser isn't installed
    launchOptions: process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {},
  },
  projects: [
    { name: '1440', use: { viewport: { width: 1440, height: 900 } } },
    {
      name: '390',
      use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
  },
});
