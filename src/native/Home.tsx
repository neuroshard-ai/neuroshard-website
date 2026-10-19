import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, ExternalLink, Search } from 'lucide-react';
import { AssistantJobs, AssistantNetwork, atoms, get, Lookup, short } from './api';
import './home.css';

export const SOURCE = 'https://github.com/neuroshard-ai/neuroshard';
const DOCS = `${SOURCE}/blob/main/docs`;
const JOIN = 'curl -LsSf https://neuroshard.com/join.sh | bash -s --';

function useLive<T>(path: string, every = 10000) {
  const [value, setValue] = useState<T | null>(null), [error, setError] = useState(false);
  const load = useCallback(async () => {
    try { setValue(await get<T>(path)); setError(false); } catch { setError(true); }
  }, [path]);
  useEffect(() => { void load(); const t = setInterval(() => void load(), every); return () => clearInterval(t); }, [load, every]);
  return { value, error };
}

function Command({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => void navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); });
  return <div className="cmd"><code>{text}</code><button aria-label="Copy command" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}</button></div>;
}

function LiveLine({ n, error }: { n: AssistantNetwork | null; error: boolean }) {
  if (error) return <p className="live-line is-off"><span className="dot" />The network can’t be read right now</p>;
  if (!n) return <p className="live-line"><span className="dot" />Reading the network…</p>;
  const owners = n.owners.filter(o => o.status === 'active').length;
  return <p className="live-line"><span className="dot" />Live now · block {n.height.toLocaleString()} · {n.validators.length} validators · {owners} owners · model version {n.model_history.length}</p>;
}

const steps = [
  ['Ask', 'Your computer runs the first part of the model; owners’ machines run the rest. Every step is signed, so anyone can check it later.'],
  ['Pay', 'Each conversation pays the owners who served it. A tenth of that goes into a pool that pays for training.'],
  ['Improve', 'Contributors train an update. A test picked by public randomness after training decides if it’s better. Owners re-run the test, vote, and every node switches.'],
];

const roles = [
  { id: 'chat', name: 'Chat', cmd: 'chat', does: 'Talk to the assistant', needs: 'Linux x86_64, 6 GB RAM', gets: 'Free test tokens to chat with' },
  { id: 'owner', name: 'Owner', cmd: 'owner --shard 2', does: 'Host part of the model and serve conversations', needs: 'Intel CPU with AMX, 8 GB RAM', gets: 'A share of every conversation you serve, and a vote' },
  { id: 'validator', name: 'Validator', cmd: 'validator', does: 'Keep the ledger and judge fraud proofs', needs: 'Intel CPU with AMX, 16 GB RAM, 60 GB disk', gets: 'A seat in consensus, once owners vote you in' },
  { id: 'auditor', name: 'Auditor', cmd: 'auditor', does: 'Re-check owners’ work and prove mistakes', needs: 'Intel CPU with AMX, 16 GB RAM', gets: 'Half the bond of any owner you catch' },
  { id: 'contributor', name: 'Contributor', cmd: 'contributor', does: 'Train the updates the network pays for', needs: 'Intel CPU with AMX, 32 GB RAM', gets: 'The training reward for the work you commit' },
];

function Join() {
  const [active, setActive] = useState('owner');
  const role = roles.find(r => r.id === active)!;
  return <section className="section" id="join">
    <h2>Join in one command.</h2>
    <p className="lede">Pick a role and run one line on a Linux machine you control. It installs everything, makes your keys on your machine, and starts. No sign-up: you serve and earn from the start.</p>
    <div className="roles" role="tablist">{roles.map(r => <button key={r.id} role="tab" aria-selected={active === r.id} onClick={() => setActive(r.id)}>{r.name}</button>)}</div>
    <div className="role">
      <Command text={`${JOIN} ${role.cmd}`} />
      <dl><div><dt>You</dt><dd>{role.does}</dd></div><div><dt>You need</dt><dd>{role.needs}</dd></div><div><dt>You get</dt><dd>{role.gets}</dd></div></dl>
    </div>
    <p className="hint">Not sure your machine fits? <span className="inline-cmd">{JOIN} check</span> tells you, and installs nothing. · <a href={`${DOCS}/OPERATORS.md`}>Operator guide</a> · <a href={`${SOURCE}/issues/new?template=operator.yml`}>Tell us you joined</a></p>
    <NodeCheck />
  </section>;
}

function NodeCheck() {
  const [key, setKey] = useState(''), [result, setResult] = useState<Lookup | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const look = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setResult(null);
    try { setResult(await get<Lookup>(`/assistant/lookup?key=${encodeURIComponent(key.trim())}`)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Lookup failed'); }
    finally { setBusy(false); }
  };
  const lines = result?.found.map(f =>
    f.role === 'owner' ? `Owner of shard ${f.shard}, ${f.status}. Served ${f.conversations_served} conversation(s), earned ${atoms(f.earned)} NEURO. ${f.status !== 'active' ? '' : f.reachable ? 'Reachable.' : 'Not reachable: open TCP port 28700.'}`
    : f.role === 'account' ? `Account balance: ${atoms(f.balance)} NEURO.`
    : f.role === 'validator' ? `Validator${f.admitted ? `, voted in at block ${f.admitted.toLocaleString()}` : ''}.`
    : `Contributor: ${f.steps} training steps across ${f.jobs} job(s).`) || [];
  return <form className="node-check" onSubmit={e => void look(e)}>
    <label htmlFor="node-key">Already running a node? Paste its public key.</label>
    <div><input id="node-key" value={key} onChange={e => setKey(e.target.value)} placeholder="Owner, account or validator public key" required spellCheck={false} />
      <button type="submit" disabled={busy}><Search size={15} /> {busy ? 'Checking…' : 'Check'}</button></div>
    {error && <p className="check-result is-bad" role="alert">{error}</p>}
    {result && <p className="check-result">{lines.length ? lines.join(' ') : 'No record of this key yet. Owners appear once they bond; validators once owners vote them in.'}</p>}
  </form>;
}

function Network({ n }: { n: AssistantNetwork | null }) {
  const jobs = useLive<AssistantJobs>('/assistant/jobs', 15000).value;
  const active = n?.owners.filter(o => o.status === 'active') || [];
  const stats: [string, string][] = n ? [
    ['Validators', `${n.validators.filter(v => v.signed_last_block).length} of ${n.validators.length} signing`],
    ['Owners serving', `${active.length}`],
    ['Training pool', `${atoms(n.growth.pool)} NEURO`],
    ['Model versions', `${n.model_history.length}`],
  ] : [];
  const versions = n?.model_history.map((h, i) => ({ ...h, v: i + 1 })).reverse() || [];
  return <section className="section" id="network">
    <h2>The network, live.</h2>
    <p className="lede">Read from the chain through every validator. <a href={`${DOCS}/DECENTRALIZATION.md`}>What is decentralized today</a></p>
    {n && <div className="stats">{stats.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>}
    <div className="columns">
      <div><h3>Recent activity</h3><ul className="feed">{jobs?.results.slice(0, 6).map(r => <li key={r.id}>
        {r.kind === 'conversation' && <><b>Conversation</b><span>owners earned {atoms(r.paid.reduce((a, b) => a + b, 0))} NEURO</span></>}
        {r.kind === 'growth' && <><b>Training</b><span>{r.steps} steps committed</span></>}
        {r.kind === 'fraud' && <><b className="is-bad">Fraud proven</b><span>owner {short(r.guilty)} lost {atoms(r.slashed)} NEURO</span></>}
      </li>)}</ul></div>
      <div><h3>Model versions</h3><ul className="feed">{versions.map(h => <li key={h.height}>
        <b>Version {h.v}</b><span>{h.authority === 'owners' ? `voted in by owners · block ${h.height.toLocaleString()}` : `starting model · block ${h.height.toLocaleString()}`}</span>
      </li>)}</ul></div>
    </div>
  </section>;
}

const faq: [string, string][] = [
  ['How far along is it?', 'It’s an early, open test network. It works end to end: it has trained, tested, voted in and switched to a better model by itself. But the project still runs most nodes. Each person who joins makes it more decentralized.'],
  ['Does it cost anything? Can I earn?', 'Only your machine’s running cost; a suitable cloud server is about $10–13 a day. NEURO is a test token with no cash value, so for now you earn standing in the network, not money.'],
  ['Is it private?', 'No. Model activations pass between machines and the ledger is public. Use example data.'],
  ['Why an Intel CPU with AMX?', 'Every piece of work is checked by re-running it exactly. Today that only works on one class of hardware; other chips give slightly different numbers that would look like cheating.'],
  ['How fast is it?', 'About 35 seconds per reply, running on CPUs.'],
  ['Who decides what the model learns?', 'Members, by vote. An update only goes live if it beats the current model on a test chosen after training, which members reproduce themselves. No single key can change the model, including ours.'],
  ['Do I get a vote when I join?', 'Not straight away. Anyone can bond and serve, but free test tokens must not buy control, so a bond becomes a vote only when the existing members admit you. Tell us you joined and ask.'],
  ['Is it safe to join?', 'It is an operator pilot. An independent review on October 18, 2026 found integrity bugs that made an open beta unsafe. They are fixed, tested and live; the review and every fix are public. Use test data only.'],
  ['What’s next?', 'More independent operators; learning from real conversations people choose to share; a reason to run a node beyond test tokens; and checking work on more kinds of hardware.'],
];

export default function Home() {
  const { value: n, error } = useLive<AssistantNetwork>('/assistant/network');
  return <div className="home">
    <section className="hero">
      <h1>An open AI that<br /><em>improves itself.</em></h1>
      <p>NeuroShard is a language model run by the people who host it. Using it pays for training; owners test every update and vote it in. Anyone can join.</p>
      <div className="actions"><a className="btn" href="#join">Join the network <ArrowRight size={16} /></a><a className="btn ghost" href="#how">How it works</a></div>
      <LiveLine n={n} error={error} />
    </section>

    <section className="section" id="how">
      <h2>How it works.</h2>
      <ol className="steps">{steps.map(([title, text], i) => <li key={title}><span>{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
      <p className="proof">It has already done this on its own. On October 17, 2026 the network trained, tested and voted in a better model: it answers 294 of 452 real-world requests correctly, against 214 for the model it started from. <a href={`${DOCS}/NETWORK_GROWTH.md`}>See the evidence</a></p>
    </section>

    <Join />
    <Network n={n} />

    <section className="section" id="faq">
      <h2>Questions.</h2>
      <div className="faq">{faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
    </section>

    <section className="section closing">
      <h2>No server? You can still help.</h2>
      <div className="help">
        <a href={`${DOCS}/CONTRIBUTE_QUESTIONS.md`}><b>Write test questions</b><span>Every new version must pass them.</span><ArrowRight size={16} /></a>
        <a href={SOURCE}><b>Read and review the code</b><span>Open source, Apache 2.0.</span><ExternalLink size={15} /></a>
        <a href="mailto:info@neuroshard.com"><b>Sponsor a node or talk to us</b><span>info@neuroshard.com</span><ArrowRight size={16} /></a>
      </div>
    </section>
  </div>;
}
