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

test('the live network page shows status, how to join, the ledger and the honest limits', async ({ page }) => {
  await fixtures(page);
  await page.goto('/network');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('An AI that grows itself');
  await expect(page.getByText('5 of 5 validator RPCs agree')).toBeVisible();
  await expect(page.getByText('4 signed the last block')).toBeVisible();
  await expect(page.getByText('801,234', { exact: true })).toBeVisible();
  await expect(page.getByText('0.423', { exact: true })).toBeVisible();
  await expect(page.getByText('curl -LsSf https://neuroshard.com/join.sh | bash -s -- check')).toBeVisible();
  await page.getByRole('tab', { name: 'Owner' }).click();
  await expect(page.getByText('curl -LsSf https://neuroshard.com/join.sh | bash -s -- owner --shard 2')).toBeVisible();
  await expect(page.getByText('Your 5 NEURO bond if an auditor proves you sent wrong work')).toBeVisible();
  await expect(page.getByText('slashed', { exact: true })).toBeVisible();
  await expect(page.getByText('enacted by owner vote (100% of bonded weight)')).toBeVisible();
  await expect(page.getByText('Growth job trained')).toBeVisible();
  await expect(page.getByText(/Independent operators — today the project runs almost every node/)).toBeVisible();
});

test('a node operator can check a public key', async ({ page }) => {
  await fixtures(page);
  await page.goto('/network');
  await page.getByLabel('Public key').fill('d'.repeat(64));
  await page.getByRole('button', { name: 'Look up' }).click();
  await expect(page.getByText('Owner of shard 2 ·')).toBeVisible();
  await expect(page.getByText(/served 5 conversation\(s\) · earned 0.443845 NEURO/)).toBeVisible();
  await expect(page.getByText(/open TCP 28700/)).toBeVisible();
});

test('the home page and old join paths lead to the live network', async ({ page }) => {
  await fixtures(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Join the network' }).first().click();
  await expect(page).toHaveURL(/\/network#join$/);
  await page.goto('/join');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('An AI that grows itself');
});
