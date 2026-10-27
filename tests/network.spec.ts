import { expect, test, type Page } from '@playwright/test';

const network = {
  chain_id: 'neuroshard-assistant-1', height: 801234, model_root: 'a'.repeat(64), version: 'a4-general', shards: 2,
  validators: [1, 2, 3, 4, 5].map(i => ({ address: String(i).repeat(40), power: 1, signed_last_block: i !== 3 })),
  rpcs: [1, 2, 3, 4, 5].map(i => ({ rpc: `http://10.0.0.${i}:26657`, height: 801234 })),
  owners: [
    { log_key: 'b'.repeat(64), shard: 1, status: 'active', bond: 5000000, endpoint: '1.2.3.4:28700' },
    { log_key: 'c'.repeat(64), shard: 2, status: 'slashed', bond: 0, endpoint: '1.2.3.5:28700' },
    { log_key: 'd'.repeat(64), shard: 2, status: 'active', bond: 5000000, endpoint: '1.2.3.6:28700' }],
  governance: { approval_ppm: 666667, growth_levy_ppm: 100000, pending_model: false, proposals: [] },
  growth: { pool: 423000, queued: 0, open_jobs: [] },
  model_history: [{ height: 744198, model_root: 'e'.repeat(64), authority: 'owners', approving_weight: 15, total_weight: 15 }],
  params: { fee: 1000, owner_bond_minimum: 5000000, minimum_price: 100000, challenge_deposit: 1000000, auditor_share_ppm: 500000 },
  read_at: 1792300000,
};
const jobs = { height: 801234, open_conversations: 0, results: [
  { kind: 'conversation', id: '1', owners: ['b'.repeat(64), 'd'.repeat(64)], paid: [88495, 88495], pooled: 19664, refunded: 803346, positions: [100, 100] },
  { kind: 'growth', id: '2', contributors: ['f'.repeat(66)], steps: 128, final_root: '2'.repeat(64) }] };
const lookup = { key: 'd'.repeat(64), height: 801234, found: [{ role: 'owner', log_key: 'd'.repeat(64), shard: 2, status: 'active',
  bond: 5000000, endpoint: '1.2.3.6:28700', account: '03' + '1'.repeat(64), conversations_served: 5, earned: 443845, open_jobs: 0, reachable: false }] };

async function fixtures(page: Page) {
  await page.route('**/assistant/**', route => {
    const path = new URL(route.request().url()).pathname;
    const body = path.endsWith('/network') ? network : path.endsWith('/jobs') ? jobs : path.endsWith('/lookup') ? lookup : null;
    return route.fulfill({ status: body ? 200 : 404, json: body || { error: 'unknown' } });
  });
}

test('the home page gets a user started: install, chat, what to expect, live status', async ({ page }) => {
  await fixtures(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('An open AI that');
  await expect(page.getByText('Live now · block 801,234 · 5 validators · 2 owners · model version 1')).toBeVisible();
  await page.getByRole('link', { name: 'Try it: 3 steps' }).click();
  await expect(page.getByRole('heading', { name: 'Try it in three steps.' })).toBeVisible();
  // The installer is pinned to the reviewed release, never main, and its checksum is shown.
  await expect(page.getByText('curl -LsSf https://raw.githubusercontent.com/neuroshard-ai/neuroshard/pilot-2/scripts/join.sh | bash -s -- chat --branch pilot-2')).toBeVisible();
  // Step 1 is a check that installs nothing.
  await expect(page.locator('#try').getByText('curl -LsSf https://raw.githubusercontent.com/neuroshard-ai/neuroshard/pilot-2/scripts/join.sh | bash -s -- check', { exact: true })).toBeVisible();
  await page.getByText('Want to check the installer first?').click();
  await expect(page.getByText('curl -LsSf https://raw.githubusercontent.com/neuroshard-ai/neuroshard/pilot-2/scripts/join.sh | sha256sum')).toBeVisible();
  await expect(page.getByText(/adf7b983d2c6b21ddfb2d9ed39d2234d0c3e5103e59777e508907d7d81bbd37c/)).toBeVisible();
  // Each step links the messages it can print to their fix.
  await page.getByRole('link', { name: /the network stayed busy until the deadline/ }).click();
  await expect(page).toHaveURL(/\/help#busy$/);
  await page.goto('/#try');
  await expect(page.getByText('~/.venvs/neuroshard/bin/neuroshard assistant chat', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('neuroshard.com/join.sh');
  // The known limits are stated where a user decides to try it.
  await expect(page.getByRole('heading', { name: 'It isn’t private' })).toBeVisible();
  await expect(page.getByText(/116 of 233 answers had the right fact, and only 58 also cited the right document/)).toBeVisible();
  await expect(page.getByText(/The first answer takes/)).toBeVisible();
  await expect(page.getByText('4 of 5 signing')).toBeVisible();
  await expect(page.getByText('0.423 NEURO')).toBeVisible();
  await expect(page.getByText('owners earned 0.17699 NEURO')).toBeVisible();
  await expect(page.getByText('128 steps committed')).toBeVisible();
});

test('operators see only the invited roles, with validators and contributors on hold', async ({ page }) => {
  await fixtures(page);
  await page.goto('/#join');
  await expect(page.getByRole('tab')).toHaveText(['Owner', 'Auditor']);
  await expect(page.getByText('curl -LsSf https://raw.githubusercontent.com/neuroshard-ai/neuroshard/pilot-2/scripts/join.sh | bash -s -- owner --shard 1 --branch pilot-2')).toBeVisible();
  await page.getByRole('tab', { name: 'Auditor' }).click();
  await expect(page.getByText('curl -LsSf https://raw.githubusercontent.com/neuroshard-ai/neuroshard/pilot-2/scripts/join.sh | bash -s -- auditor --branch pilot-2')).toBeVisible();
  await expect(page.locator('.on-hold')).toContainText('running a validator, and contributing training');
  await expect(page.locator('#join').getByRole('link', { name: 'operator guide' })).toHaveAttribute('href', /\/blob\/pilot-2\/docs\/OPERATORS\.md$/);
});

test('a node operator can check a public key', async ({ page }) => {
  await fixtures(page);
  await page.goto('/');
  await page.getByLabel(/Paste its public key/).fill('d'.repeat(64));
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByText(/Owner of shard 2, active\. Served 5 conversation\(s\), earned 0\.443845 NEURO\. Not reachable: open TCP port 28700\./)).toBeVisible();
});

test('the help page finds a message and explains the fix', async ({ page }) => {
  await fixtures(page);
  await page.goto('/');
  await page.getByRole('navigation', { name: undefined }).getByRole('link', { name: 'Help', exact: true }).first().click();
  await expect(page).toHaveURL(/\/help$/);
  await page.getByPlaceholder('Paste or type part of the message').fill('stayed busy');
  await expect(page.getByText('the network stayed busy until the deadline; nothing was funded')).toBeVisible();
  await expect(page.getByText(/Nothing was paid\./)).toBeVisible();
  await expect(page.locator('.fix')).toHaveCount(1);
  await page.getByPlaceholder('Paste or type part of the message').fill('qwertyuiop');
  await expect(page.getByText(/No match for that message/)).toBeVisible();
});

test('asking for help opens a prefilled GitHub request, without keys', async ({ page }) => {
  await fixtures(page);
  await page.goto('/help#ask');
  await expect(page.getByText(/Never paste anything from files ending in \.key/)).toBeVisible();
  await page.getByLabel(/What it printed/).fill('NeuroShard: the network stayed busy until the deadline; nothing was funded');
  // GitHub sends a logged-out browser to its login page, so check the URL the page opens, not where it lands.
  await page.evaluate(() => { (window as unknown as { opened: string[] }).opened = []; window.open = (u?: string | URL) => { (window as unknown as { opened: string[] }).opened.push(String(u)); return null; }; });
  await page.getByRole('button', { name: 'Open a help request' }).click();
  const url = new URL((await page.evaluate(() => (window as unknown as { opened: string[] }).opened))[0]);
  expect(url.origin + url.pathname).toBe('https://github.com/neuroshard-ai/neuroshard/issues/new');
  expect(url.searchParams.get('template')).toBe('join_problem.yml');
  expect(url.searchParams.get('command')).toBe('curl -LsSf https://raw.githubusercontent.com/neuroshard-ai/neuroshard/pilot-2/scripts/join.sh | bash -s -- chat --branch pilot-2');
  expect(url.searchParams.get('log')).toContain('stayed busy');
});

test('old addresses lead to the right part of the site', async ({ page }) => {
  await fixtures(page);
  await page.goto('/network');
  await expect(page).toHaveURL(/\/#network$/);
  await page.goto('/join');
  await expect(page).toHaveURL(/\/#join$/);
  await expect(page.getByRole('heading', { name: 'Run a node.' })).toBeVisible();
  await page.goto('/support');
  await expect(page).toHaveURL(/\/help$/);
  await page.goto('/start');
  await expect(page).toHaveURL(/\/#try$/);
});

test('the footer links only to current material, and retired pages lead home', async ({ page }) => {
  await fixtures(page);
  await page.goto('/');
  const footer = page.getByRole('navigation', { name: 'Footer' });
  await expect(footer.getByRole('link')).toHaveText(['Help', 'Operator guide', 'How it grows', 'Decentralization', 'Paper', 'Source code', 'Discord', 'Contact']);
  for (const link of await footer.getByRole('link').all()) {
    const href = await link.getAttribute('href');
    if (href?.includes('/blob/')) expect(href).toContain('/blob/pilot-2/');
  }
  for (const old of ['/vision', '/teams', '/build', '/protocol', '/baseline', '/chat']) {
    await page.goto(old);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('An open AI that');
  }
});
