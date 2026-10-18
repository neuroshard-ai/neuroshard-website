import { useCallback, useEffect, useState } from 'react';
import { FormEvent } from 'react';
import { ArrowRight, Check, Copy, Cpu, ExternalLink, Eye, MessageSquare, Network, RefreshCw, Scale, Search, ShieldCheck, Sprout, X } from 'lucide-react';
import { AssistantJobs, AssistantNetwork, atoms, get, Lookup, short } from './api';

const SOURCE = 'https://github.com/neuroshard-ai/neuroshard';
const OPERATORS = `${SOURCE}/blob/main/docs/OPERATORS.md`;
const JOIN = 'curl -LsSf https://neuroshard.com/join.sh | bash -s --';

function useLive<T>(path: string, every = 10000) {
  const [value, setValue] = useState<T | null>(null), [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setValue(await get<T>(path)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'The network could not be read'); }
  }, [path]);
  useEffect(() => { void refresh(); const t = setInterval(() => void refresh(), every); return () => clearInterval(t); }, [refresh, every]);
  return { value, error, refresh };
}

function Command({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="native-code"><button aria-label="Copy command" onClick={() => { void navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }}>{copied ? <Check size={16} /> : <Copy size={16} />}</button><pre>{text}</pre></div>;
}

function LiveStatus({ live }: { live: ReturnType<typeof useLive<AssistantNetwork>> }) {
  const n = live.value;
  const signing = n ? n.validators.filter(v => v.signed_last_block).length : 0;
  const agreeing = n ? n.rpcs.filter(r => r.height !== null && Math.abs((r.height || 0) - n.height) < 5).length : 0;
  const owners = n ? n.owners.filter(o => o.status === 'active') : [];
  const items: [string, string | undefined, string][] = [
    ['BLOCK HEIGHT', n?.height.toLocaleString(), 'One block per second'],
    ['VALIDATORS', n ? `${n.validators.length}` : undefined, n ? `${signing} signed the last block` : ''],
    ['OWNERS SERVING', n ? `${owners.length}` : undefined, n ? `across ${n.shards} shards of the model` : ''],
    ['GROWTH POOL', n ? `${atoms(n.growth.pool)}` : undefined, n ? `NEURO · ${n.governance.growth_levy_ppm / 10000}% of owner earnings` : ''],
  ];
  return <>
    <div className={`native-connection ${live.error ? 'is-offline' : ''}`} role="status"><span className="connection-dot" />
      <span>{live.error ? 'Cannot read the network right now' : !n ? 'Reading the live network…' : `Live · ${n.chain_id}`}</span>
      <span className="connection-chain">{n ? `${agreeing} of ${n.rpcs.length} validator RPCs agree` : ''}</span>
      {live.error && <button onClick={() => void live.refresh()}><RefreshCw size={13} /> Retry</button>}
      <span className="connection-time">{n ? `Read at ${new Date(n.read_at * 1000).toLocaleTimeString()}` : ''}</span></div>
    <div className="native-stats">{items.map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value ?? '—'}</strong><small className="muted">{note}</small></div>)}</div>
  </>;
}

const steps = [
  { icon: MessageSquare, title: 'People ask', text: 'A user’s own computer runs the first part of the model. The rest runs on owners’ machines, each holding one shard. Every message between them is signed.' },
  { icon: Scale, title: 'Owners are paid, and checked', text: 'Owners earn from each conversation they serve. Auditors replay their signed logs; a proven fault costs the owner its whole bond.' },
  { icon: Sprout, title: 'Usage pays for growth', text: '10% of owner earnings flows into a growth pool on the chain. When owners approve a training recipe, the pool funds it automatically.' },
  { icon: Cpu, title: 'Contributors train', text: 'Contributors train the job in committed segments; anyone can check any step and prove a wrong one.' },
  { icon: ShieldCheck, title: 'Owners verify and vote', text: 'A sealed test — chosen by public randomness after training ends, and including real requests — decides if the new version is better. Owners reproduce the test themselves and vote.' },
  { icon: Network, title: 'Every node follows', text: 'Once enacted, every owner, validator and auditor rebuilds the new version from what the chain committed and switches to it. No release is published.' },
];

const roles = [
  { id: 'chat', name: 'Try it', role: 'chat', who: 'Anyone', needs: 'Linux x86_64, 6 GB RAM', earns: 'Nothing — conversations use free test NEURO', risks: 'None. Conversations are not private: use example data.', ports: '' },
  { id: 'validator', name: 'Validator', role: 'validator', who: 'Order transactions, judge fraud proofs, store and mirror files', needs: 'Intel CPU with AMX (e.g. AWS m7i/r7i), 16 GB RAM, 60 GB disk; a few hours to replay the chain', earns: 'Nothing directly on this test network', risks: 'None on chain. A validator that stays offline should be voted out.', ports: '26656, 26657, 28780, 28781' },
  { id: 'owner', name: 'Owner', role: 'owner --shard 2', who: 'Host one shard of the model and serve paid conversations', needs: 'Intel CPU with AMX, 8 GB RAM, 8 threads', earns: 'An equal share of each conversation you serve (≈0.08 NEURO each), and a vote on models, validators and the levy', risks: 'Your 5 NEURO bond if an auditor proves you sent wrong work', ports: '28700, 28781' },
  { id: 'auditor', name: 'Auditor', role: 'auditor', who: 'Replay owners’ signed logs and prove faults', needs: 'Intel CPU with AMX, 16 GB RAM — on its own machine', earns: 'Half of a proven cheater’s bond', risks: 'A 1 NEURO deposit, lost if your proof fails', ports: '' },
  { id: 'contributor', name: 'Contributor', role: 'contributor', who: 'Train growth jobs the network funds, and spot-check others', needs: 'Intel CPU with AMX, 32 GB RAM', earns: 'The job’s reward for the steps you commit', risks: 'A 2 NEURO bond per segment, lost if a step is proven wrong', ports: '' },
];

function JoinRoles() {
  const [active, setActive] = useState('validator');
  const role = roles.find(r => r.id === active)!;
  return <section className="join-roles" id="join">
    <div className="native-eyebrow">JOIN IN ONE COMMAND</div>
    <h2>Pick a role.<br /><em>Run one line.</em></h2>
    <p className="page-intro">On a Linux machine you control. The script installs the exact runtime, creates your keys on your machine — they never leave it — rebuilds the model version the chain serves, and starts your role as a service.</p>
    <div className="check-first"><span className="step-index">FIRST</span><div><strong>Check your machine — installs nothing</strong><Command text={`${JOIN} check`} /></div></div>
    <div className="role-tabs" role="tablist">{roles.map(r => <button key={r.id} role="tab" aria-selected={active === r.id} onClick={() => setActive(r.id)}>{r.name}</button>)}</div>
    <div className="role-card">
      <Command text={`${JOIN} ${role.role}`} />
      <dl>
        <dt>What you do</dt><dd>{role.who}</dd>
        <dt>What you need</dt><dd>{role.needs}</dd>
        <dt>What you earn</dt><dd>{role.earns}</dd>
        <dt>What you risk</dt><dd>{role.risks}</dd>
        {role.ports && <><dt>Open these ports</dt><dd>{role.ports}</dd></>}
      </dl>
      {active === 'validator' && <p className="muted">When your node has caught up, <a href={`${SOURCE}/issues/new?template=operator.yml`}>tell us you joined</a> with your consensus key (printed in the log). Owners vote validators in on chain.</p>}
      {active === 'owner' && <p className="muted">Use <code>--shard 1</code> or <code>--shard 2</code>. The service gets 5 test NEURO from the faucet and bonds it for you.</p>}
    </div>
    <p className="muted">Why the CPU requirement: audits and training checks replay work bit for bit, which holds only on one execution class. On another CPU your numbers would differ slightly, and honest work could be judged fraud. <a href={OPERATORS}>Full operator guide <ExternalLink size={12} /></a></p>
  </section>;
}

function Ledger({ live }: { live: ReturnType<typeof useLive<AssistantNetwork>> }) {
  const jobs = useLive<AssistantJobs>('/assistant/jobs', 15000);
  const n = live.value;
  return <section className="assistant-ledger" id="ledger">
    <div className="native-eyebrow">THE LEDGER, LIVE</div>
    <h2>Every payment, vote and version.<br /><em>On chain.</em></h2>
    <div className="ledger-columns">
      <div>
        <h3>Who runs the network</h3>
        <table className="compact-table"><thead><tr><th>Validator</th><th>Power</th><th>Last block</th></tr></thead>
          <tbody>{n?.validators.map(v => <tr key={v.address}><td className="mono">{short(v.address)}</td><td>{v.power}</td><td>{v.signed_last_block ? <Check size={14} /> : <span className="muted">late</span>}</td></tr>)}</tbody></table>
        <table className="compact-table"><thead><tr><th>Owner</th><th>Shard</th><th>Bond</th><th>Status</th></tr></thead>
          <tbody>{n?.owners.map(o => <tr key={o.log_key}><td className="mono" title={o.endpoint || ''}>{short(o.log_key)}</td><td>{o.shard}</td><td>{atoms(o.bond)}</td><td className={o.status === 'slashed' ? 'is-bad' : ''}>{o.status}</td></tr>)}</tbody></table>
        <h3>How the model changed</h3>
        <ol className="history">{n?.model_history.slice().reverse().map(h => <li key={h.height}><strong>Block {h.height.toLocaleString()}</strong> · {h.authority === 'owners' ? `enacted by owner vote${h.total_weight ? ` (${Math.round(100 * (h.approving_weight || 0) / h.total_weight)}% of bonded weight)` : ''}` : 'set by the project steward, before owners took over'} · <span className="mono">{short(h.model_root)}</span></li>)}</ol>
        {n && n.governance.proposals.length > 0 && <><h3>Open votes</h3><ul className="history">{n.governance.proposals.map(p => <li key={p.id}>{p.kind} · {p.total ? Math.round(100 * p.approving / p.total) : 0}% approving · open until block {p.deadline.toLocaleString()}</li>)}</ul></>}
        {n && n.growth.open_jobs.length > 0 && <><h3>Training now</h3><ul className="history">{n.growth.open_jobs.map(j => <li key={j.job_id}>{j.segments_committed} of {Math.ceil(j.steps / j.segment_steps)} segments committed · reward {atoms(j.reward)} NEURO</li>)}</ul></>}
      </div>
      <div>
        <h3>Recent activity</h3>
        <ul className="activity">{jobs.value?.results.map(r => <li key={r.id} className={`activity-${r.kind}`}>
          {r.kind === 'conversation' && <><strong>Conversation settled</strong><span>owners paid {r.paid.map(p => atoms(p)).join(' + ')} NEURO · {atoms(r.pooled)} to the growth pool · {atoms(r.refunded)} refunded</span></>}
          {r.kind === 'growth' && <><strong>Growth job trained</strong><span>{r.steps} steps by {r.contributors.length} contributor(s) · state <span className="mono">{short(r.final_root)}</span></span></>}
          {r.kind === 'fraud' && <><strong>Fraud proven</strong><span>owner <span className="mono">{short(r.guilty)}</span> slashed {atoms(r.slashed)} NEURO</span></>}
        </li>)}</ul>
        {jobs.error && <div className="native-notice">{jobs.error}</div>}
      </div>
    </div>
  </section>;
}

function WaysIn() {
  const ways = [
    ['5 minutes', 'Try the assistant', 'Chat with the live model from any Linux x86_64 machine. Your computer runs the first part of the model; owners run the rest.', `${JOIN} chat`, null],
    ['An evening', 'Run a node', 'A validator, owner, auditor or contributor on an Intel AMX machine — your own server or a cloud instance. Pick a role below.', null, '#join'],
    ['No server needed', 'Write test questions', 'Write realistic questions about your own kind of documents. Verified questions join the sealed test every new version must pass — the strongest say anyone has over what the network learns.', null, `${SOURCE}/blob/main/docs/CONTRIBUTE_QUESTIONS.md`],
    ['No server needed', 'Review and build', 'Read the fraud-proof, slashing and governance rules and try to break them. Security reports go privately to the maintainers.', null, `${SOURCE}/security/advisories/new`],
  ] as const;
  return <section className="ways-in"><div className="native-eyebrow">WAYS TO TAKE PART</div><h2>Start with<br /><em>what you have.</em></h2>
    <div className="ways-grid">{ways.map(([time, title, text, command, link]) => <article key={title}>
      <span className="card-kicker">{time}</span><h3>{title}</h3><p>{text}</p>
      {command && <Command text={command} />}
      {link && (link.startsWith('#') ? <a className="native-text-link" href={link}>Choose a role <ArrowRight size={14} /></a> : <a className="native-text-link" href={link}>Start here <ExternalLink size={13} /></a>)}
    </article>)}</div></section>;
}

function MyNode() {
  const [key, setKey] = useState(''), [result, setResult] = useState<Lookup | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const look = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setResult(null);
    try { setResult(await get<Lookup>(`/assistant/lookup?key=${encodeURIComponent(key.trim())}`)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Lookup failed'); }
    finally { setBusy(false); }
  };
  return <section className="my-node" id="my-node">
    <div><div className="native-eyebrow">ALREADY RUNNING A NODE?</div><h2>Check your node.</h2>
      <p className="muted">Paste a public key from your node’s log: an owner log key, your account key, or a validator’s consensus key. Never paste a private key — nothing here asks for one.</p></div>
    <div><form onSubmit={e => void look(e)}><label htmlFor="node-key">Public key</label>
      <input id="node-key" value={key} onChange={e => setKey(e.target.value)} placeholder="hex public key" required />
      <button className="native-button" type="submit" disabled={busy}><Search size={15} /> {busy ? 'Reading the chain…' : 'Look up'}</button></form>
      {error && <div className="native-notice" role="alert">{error}</div>}
      {result && (result.found.length === 0
        ? <div className="native-notice">The chain has no record of this key at block {result.height.toLocaleString()}. A validator appears once owners vote it in; an owner once it has bonded.</div>
        : <div className="lookup-result">{result.found.map((f, i) => <div key={i}>
            {f.role === 'owner' && <><strong>Owner of shard {f.shard} · <span className={f.status === 'active' ? 'is-good' : 'is-bad'}>{f.status}</span></strong>
              <span>Bond {atoms(f.bond)} NEURO · served {f.conversations_served} conversation(s) · earned {atoms(f.earned)} NEURO</span>
              <span>{f.status !== 'active' ? 'This log key can never bond again; start a new owner home to rejoin.' : f.reachable ? `Reachable at ${f.endpoint}` : `Not reachable at ${f.endpoint} — open TCP 28700 so users can reach you`}</span></>}
            {f.role === 'account' && <><strong>Account</strong><span>Balance {atoms(f.balance)} NEURO · {f.nonce} transaction(s) sent</span></>}
            {f.role === 'validator' && <><strong>Validator · power {f.power}</strong><span>{f.admitted ? `Voted in at block ${f.admitted.toLocaleString()}` : 'In the validator set'}</span></>}
            {f.role === 'contributor' && <><strong>Contributor</strong><span>Trained {f.steps} steps across {f.jobs} growth job(s)</span></>}
          </div>)}</div>)}
    </div>
  </section>;
}

function Faq() {
  const items: [string, string][] = [
    ['Do I need to ask permission to join?', 'No. Run the command for a role and it joins. Owners only vote on validators, because the set of validators decides who orders transactions; everyone else just starts.'],
    ['What does it cost me?', 'Your machine’s running cost. Test NEURO is free from the faucet and has no value. An AWS m7i.2xlarge, enough for a validator or owner, costs roughly $10–13 a day on demand.'],
    ['Can I lose money?', 'Not real money: bonds and deposits are test NEURO. You can lose your test bond if you run modified software or the wrong CPU class and an audit proves your work wrong.'],
    ['Why do I need an Intel CPU with AMX?', 'Every piece of work can be re-run by anyone to check it, and the check must reproduce the exact same numbers. That only holds on one execution class today. A different CPU would produce slightly different numbers that look like cheating.'],
    ['Is my data private?', 'No. Conversations pass intermediate model activations between machines, which can leak what you wrote, and the ledger is public. Use example data only.'],
    ['Who controls the model?', 'The owners, by bonded vote. A new version goes live only if it beats the current one on a test chosen by public randomness after training, which owners reproduce themselves. No single key can change it — including the project’s.'],
    ['How do I stop?', '`sudo systemctl stop neuroshard-<role>`. Keys and state stay in ~/.neuroshard/assistant. A validator should ask to be voted out if it leaves for good.'],
    ['How do I update?', 'Re-run the same join command: it pulls the current code and restarts the service. Nodes switch model versions by themselves when owners enact one.'],
  ];
  return <section className="faq" id="faq"><div className="native-eyebrow">QUESTIONS</div><h2>Before you join.</h2>
    <div className="faq-list">{items.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>;
}

export default function AssistantNetworkPage() {
  const live = useLive<AssistantNetwork>('/assistant/network');
  return <section className="native-wrap native-page assistant-page">
    <div className="native-eyebrow">THE LIVE NETWORK · OPEN TEST NETWORK</div>
    <h1>An AI that grows itself.<br /><em>Run by whoever joins.</em></h1>
    <p className="page-intro">NeuroShard runs a Granite 3B assistant split across independent machines. It settles every payment on its own chain, improves itself through training its owners fund and vote on, and lets anyone join without asking. It is an early test network: the tokens have no value, and we want people to try it and help it grow.</p>
    <div className="native-actions"><a className="native-button" href="#join">Join the network <ArrowRight size={16} /></a><a className="native-button secondary" href="#ledger">See the live ledger</a></div>
    <LiveStatus live={live} />

    <section className="how-it-works">
      <div className="native-eyebrow">HOW IT WORKS</div>
      <h2>Six steps.<br /><em>No one in charge.</em></h2>
      <ol>{steps.map(({ icon: Icon, title, text }, i) => <li key={title}><span className="step-index">0{i + 1}</span><Icon size={22} /><h3>{title}</h3><p>{text}</p></li>)}</ol>
      <p className="muted">This loop has run on the live network. On October 17, 2026 the network trained, tested, voted in and switched to a better documents module (G2). On 452 independently written realistic requests it answers 294 correctly; the base model answers 214.</p>
    </section>

    <WaysIn />
    <JoinRoles />
    <MyNode />
    <Ledger live={live} />
    <Faq />

    <section className="honest-status">
      <div className="native-eyebrow">WHERE IT STANDS</div>
      <h2>What works.<br /><em>What doesn’t yet.</em></h2>
      <div className="status-columns">
        <div><h3><Check size={18} /> Working, live</h3><ul>
          <li>Anyone can join any role with one command, no approval needed</li>
          <li>Five validators; the chain keeps running with any one down</li>
          <li>Owners vote on the model, on validators and on the growth levy</li>
          <li>The network grows itself: usage funds training, owners verify and vote, every node follows</li>
          <li>Every reply is signed and audited; fraud is provable and punished</li>
          <li>No single host is needed: every validator serves the ledger, stores files and mirrors the model</li>
        </ul></div>
        <div><h3><X size={18} /> Not yet</h3><ul>
          <li>Independent operators — today the project runs almost every node. This is what joining fixes.</li>
          <li>Real value — NEURO is a test token; running a node earns nothing you can spend</li>
          <li>Learning from real users — training data is generated and verified, not taken from use</li>
          <li>Growing the model’s size as nodes join — growth improves modules of a fixed 3B model</li>
          <li>Speed — about 35 seconds per reply on CPU</li>
          <li>Hardware choice — most roles need Intel CPUs with AMX</li>
          <li>Privacy — conversations are not private; use example data only</li>
        </ul></div>
      </div>
    </section>

    <section className="roadmap"><div className="native-eyebrow">WHAT COMES NEXT</div><h2>The next phase.<br /><em>And what it needs.</em></h2>
      <ol>{[
        ['Now', 'Independent operators', 'Validators and owners run by people who are not the project. Until then the network is decentralized in design, not in fact.', 'Run a node · tell us you joined'],
        ['Next', 'Learning from real use', 'Opt-in feedback on replies, turned into training data that owners can check — safe against privacy leaks and deliberate poisoning.', 'Write test questions · try the assistant and report bad answers'],
        ['Next', 'A reason to run a node', 'Today NEURO has no value. Operators need either sponsored hosting or a token design with real value.', 'Talk to us if you can sponsor hosting'],
        ['Later', 'A model that grows with the network', 'New owners host new expert modules, so a bigger network means a more capable model — not only faster training.', 'Research and review'],
        ['Later', 'Faster, on more hardware', 'A way to check work that tolerates tiny numeric differences, so GPUs and other CPUs can serve and audit.', 'Research and review'],
      ].map(([when, title, text, help]) => <li key={title}><span className="card-kicker">{when}</span><div><h3>{title}</h3><p>{text}</p><small>How you can help: {help}</small></div></li>)}</ol>
    </section>

    <section className="native-scope"><div><div className="native-eyebrow">DIG DEEPER</div><h2>Read the rules.<br />Check the evidence.</h2></div><div>
      <p><a className="native-text-link" href={OPERATORS}>Operator guide: roles, earnings, risks <ExternalLink size={14} /></a></p>
      <p><a className="native-text-link" href={`${SOURCE}/blob/main/docs/NETWORK_GROWTH.md`}>How the network grows itself, with every result <ExternalLink size={14} /></a></p>
      <p><a className="native-text-link" href={`${SOURCE}/blob/main/docs/DECENTRALIZATION.md`}>What is decentralized, and what is not yet <ExternalLink size={14} /></a></p>
      <p><a className="native-text-link" href={`${SOURCE}/issues/new?template=operator.yml`}>Tell us you are joining (GitHub issue) <ExternalLink size={14} /></a></p>
      <p><a className="native-text-link" href={`${SOURCE}/issues/new?template=join_problem.yml`}>Report a join problem <ExternalLink size={14} /></a></p>
      <p className="muted"><Eye size={13} /> Everything on this page is read from the chain through several validators and cross-checked. Run <code>neuroshard assistant status</code> to read it yourself.</p>
    </div></section>
  </section>;
}
