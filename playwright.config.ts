import { defineConfig } from '@playwright/test';
// Tests run against the production build, served with the production security headers (deploy/security-headers.conf),
// so a Content-Security-Policy violation fails them. Run `npm run build` first.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium' },
  webServer: { command: 'node scripts/serve-prod.mjs 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
