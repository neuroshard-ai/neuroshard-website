export type Network = {
  chain_id: string; height: number; round: number; model_root: string;
  validator_count: number; issued: string; burned: string; initial_supply: string;
  profile: string; ready: boolean; stalled: boolean; genesis_sha256: string; latest_block_hash: string; latest_block_height: number;
  latest_block_time: string; bootstrap_peers: string[];
};
export type Block = { height: number; hash: string; time: string; app_hash: string; app_state_height: number;
  transactions: { hash: string; kind: string; sender: string; code: number; log: string; body: Record<string, unknown> }[] };

export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '');

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(asset(path), { signal: AbortSignal.timeout(10000), cache: 'no-store' });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || `Node returned ${response.status}`);
  return value as T;
}
export function neuro(value: string): string {
  const atoms = BigInt(value);
  const fraction = (atoms % 1000000n).toString().padStart(6, '0').replace(/0+$/, '');
  return (atoms / 1000000n).toLocaleString() + (fraction ? `.${fraction}` : '');
}
export function short(value: string) { return value.length > 24 ? `${value.slice(0, 10)}…${value.slice(-10)}` : value; }

// The assistant network (neuroshard-assistant-1): read-only explorer at /assistant/.
export type AssistantNetwork = {
  chain_id: string; height: number; model_root: string; version: string | null; shards: number;
  validators: { address: string; power: number; signed_last_block: boolean }[];
  rpcs: { rpc: string; height: number | null; catching_up?: boolean; block_time?: string }[];
  owners: { log_key: string; shard: number; status: string; bond: number; endpoint: string | null }[];
  governance: { approval_ppm: number; growth_levy_ppm: number; pending_model: boolean;
    proposals: { id: string; kind: string; approving: number; total: number; deadline: number }[] };
  growth: { pool: number; queued: number; open_jobs: { job_id: string; segments_committed: number; steps: number; segment_steps: number; reward: number }[] };
  model_history: { height: number; model_root: string; authority: string; approving_weight?: number; total_weight?: number }[];
  params: { fee: number; owner_bond_minimum: number; minimum_price: number; challenge_deposit: number; auditor_share_ppm: number };
  read_at: number;
};
export type AssistantJobs = {
  height: number; open_conversations: number;
  results: ({ kind: 'conversation'; id: string; owners: string[]; paid: number[]; pooled: number; refunded: number; positions: number[] }
    | { kind: 'fraud'; id: string; guilty: string; slashed: number; height?: number }
    | { kind: 'growth'; id: string; contributors: string[]; steps: number; final_root: string; settled_unix?: number })[];
};
export const atoms = (value: number) => neuro(String(value));
export type Lookup = { key: string; height: number; found: (
  | { role: 'owner'; log_key: string; shard: number; status: string; bond: number; endpoint: string | null; account: string; conversations_served: number; earned: number; open_jobs: number; reachable: boolean | null }
  | { role: 'account'; balance: number; nonce: number }
  | { role: 'validator'; power: number; admitted: number | null }
  | { role: 'contributor'; jobs: number; steps: number })[] };
