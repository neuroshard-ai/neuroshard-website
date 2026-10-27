import { expect, test } from '@playwright/test';

// Every page renders under the production Content-Security-Policy with no violation and no third-party request.
for (const path of ['/', '/help', '/help#ask']) {
  test(`no CSP violation or third-party request on ${path}`, async ({ page }) => {
    const violations: string[] = [], external: string[] = [], errors: string[] = [];
    await page.addInitScript(() => document.addEventListener('securitypolicyviolation',
      e => console.error(`CSP ${e.violatedDirective} ${e.blockedURI}`)));
    page.on('console', m => { if (m.type() === 'error') (m.text().startsWith('CSP') ? violations : errors).push(m.text()); });
    page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:4173') && !r.url().startsWith('data:')) external.push(r.url()); });
    await page.route('**/assistant/**', route => route.fulfill({ status: 503, json: { error: 'offline' } }));
    const response = await page.goto(path);
    expect(response?.headers()['content-security-policy']).toContain("default-src 'none'");
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('h1')!).fontFamily)).toContain('Space Grotesk');
    await page.waitForLoadState('networkidle');
    expect(violations).toEqual([]);
    expect(external).toEqual([]);
    expect(errors.filter(e => !e.includes('503'))).toEqual([]);
  });
}
