import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AssistantJobs, AssistantNetwork, atoms, get, Lookup, short } from './api';
import { CHAT, COMMUNITY_URL, DOCS, EMAIL, INSTALLER, INSTALLER_SHA256, join, RELEASE, SOURCE } from './release';
import { Command, IfYouSee, Line, Terminal } from './Term';
import './home.css';

export { SOURCE };
export { Command };

function useLive<T>(path: string, every = 10000) {
  const [value, setValue] = useState<T | null>(null), [error, setError] = useState(false);
  const load = useCallback(async () => {
    try { setValue(await get<T>(path)); setError(false); } catch { setError(true); }
  }, [path]);
  useEffect(() => { void load(); const t = setInterval(() => void load(), every); return () => clearInterval(t); }, [load, every]);
  return { value, error };
}

function LiveLine({ n, error }: { n: AssistantNetwork | null; error: boolean }) {
  if (error) return <p className="live-line is-off"><span className="dot" />The network can’t be read right now</p>;
  if (!n) return <p className="live-line"><span className="dot" />Reading the network…</p>;
  const owners = n.owners.filter(o => o.status === 'active').length;
  return <p className="live-line"><span className="dot" />Live now · block {n.height.toLocaleString()} · {n.validators.length} validators · {owners} owners · model version {n.model_history.length}</p>;
}

// A real session on a 4-core cloud server, October 26, 2026 (trimmed). Notes say what each part means.
const session: Line[] = [
  { k: '$', t: 'neuroshard assistant chat', note: 'You start a conversation.' },
  { k: 'dim', t: 'Workspace: 4 documents, on this machine only.', note: 'It brings sample documents to ask about.' },
  { k: 'dim', t: '  doc-292283f7a9  Cedar 6581 delivery plan, revision 1, approved' },
  { k: 'dim', t: '  doc-88b36697f8  Cedar 6581 delivery plan, revision 2, approved' },
  { k: 'out', t: 'Requesting test NEURO from the faucet', note: 'Free test tokens pay for the chat. They have no cash value.' },
  { k: 'out', t: 'Job 6dc37dbb: shards served by 34.194.51.150, 3.236.141.240', note: 'Two strangers’ machines run the rest of the model for you.' },
  { k: 'you', t: 'What is the baseline quantity in the latest approved Cedar 6581 Annex plan?' },
  { k: 'ai', t: 'assistant (21 s, documents): The latest approved Cedar 6581 Annex delivery plan has a baseline quantity of 70 units. (Sources: doc-35d32ed303)', note: 'About 20 seconds per answer. It cites the document it used.' },
  { k: 'you', t: '/quit' },
  { k: 'dim', t: 'The owners commit their logs now; the job settles after its challenge window.', note: 'Their work is signed, so anyone can check it later.' },
];

function Hero({ n, error }: { n: AssistantNetwork | null; error: boolean }) {
  return <section className="hero">
    <div className="hero-copy">
      <p className="kicker">Open source · free to try</p>
      <h1>An open AI that <em>improves itself.</em></h1>
      <p className="hero-sub">NeuroShard is an AI assistant split across computers that people volunteer to host, instead of one
        company’s data centre. Using it pays for its training, and its hosts vote each update in.</p>
      <p className="hero-sub plain">Here is exactly what using it looks like.</p>
      <div className="actions"><a className="btn" href="#try">Try it: 3 steps</a><a className="btn ghost" href="#how">How it works</a></div>
      <LiveLine n={n} error={error} />
    </div>
    <Terminal title="a real session · Oct 26, 2026" lines={session} label="A real NeuroShard chat session, with notes explaining each line" />
  </section>;
}

function Step({ n, title, time, children }: { n: number; title: string; time: string; children: React.ReactNode }) {
  return <li className="step"><div className="step-head"><span className="step-n">{n}</span><h3>{title}</h3><span className="step-time">{time}</span></div>
    <div className="step-body">{children}</div></li>;
}

function Try() {
  return <section className="section" id="try">
    <p className="kicker">Getting started</p>
    <h2>Try it in three steps.</h2>
    <p className="lede">About five minutes. No account, no sign-up, no payment details. Your keys are made on your machine and stay there.</p>
    <ol className="walk">
      <Step n={1} title="Check your machine" time="10 seconds">
        <p>You need a Linux computer (x86-64) with at least 8 GB of memory and 10 GB free disk. Open a terminal and paste this. It
          only <b>looks</b>: it installs nothing.</p>
        <Command text={join('check')} label="Copy check command" />
        <Terminal title="what you should see" label="Expected output of the machine check" lines={[
          { k: 'out', t: 'This machine: Linux-x86_64, 4 threads, 16 GB RAM, 120 GB free disk, AMX: yes', note: 'What it found.' },
          { k: 'out', t: '  chat         yes', note: 'This is the one you need. “yes” means you’re ready.' },
          { k: 'dim', t: '  owner        yes', note: 'Running a node is optional. Ignore these for now.' },
          { k: 'dim', t: '  auditor      yes' },
        ]} />
        <div className="aside">
          <b>No Linux machine?</b> Rent a small cloud server: on AWS an <b>m7i.xlarge</b> with Ubuntu 24.04 costs about
          $0.20 an hour, and its browser terminal works fine. Shut it down when you’re done. Mac and Windows aren’t supported yet.
        </div>
        <IfYouSee items={[['chat  no: needs 8 GB RAM', 'memory'], ['Every role needs Linux x86_64.', 'not-linux']]} />
      </Step>

      <Step n={2} title="Install" time="under a minute">
        <p>Paste this one line. It installs everything into its own folder in your home directory and changes nothing else.</p>
        <Command text={join('chat')} label="Copy install command" />
        <Terminal title="what you should see" label="Expected output of the installer" lines={[
          { k: 'out', t: '== Pinned runtime: Python 3.12.12 through uv', note: 'It brings its own Python. Yours is untouched.' },
          { k: 'out', t: `== Code at ac4b9e8 (${RELEASE})`, note: `The reviewed ${RELEASE} release, never unreviewed code.` },
          { k: 'out', t: '== Start a conversation with: …/neuroshard assistant chat', note: 'Done. That’s the command for step 3.' },
        ]} />
        <details className="verify">
          <summary>Want to check the installer first?</summary>
          <p>Run this. It should print <span className="mono-wrap">{INSTALLER_SHA256}</span></p>
          <Command text={`curl -LsSf ${INSTALLER} | sha256sum`} label="Copy checksum command" />
        </details>
        <IfYouSee items={[['has local changes; this script will not overwrite them', 'local-changes']]} />
      </Step>

      <Step n={3} title="Chat" time="a few minutes the first time">
        <p>Start a conversation:</p>
        <Command text={CHAT} label="Copy chat command" />
        <p>The first time, it downloads its part of the model (about 2 GB) and fetches free test tokens. Then it shows some sample
          documents: ask a question about them and press Enter. The first answer takes <b>about 50 seconds</b>; later ones about
          20. Type <span className="inline-cmd">/quit</span> to finish.</p>
        <IfYouSee items={[['Experimental client: CPU without amx_bf16', 'experimental-cpu'],
          ['the network stayed busy until the deadline', 'busy'], ['neuroshard: command not found', 'not-found']]} />
      </Step>
    </ol>
    <p className="stuck">Stuck on something else? <Link to="/help">Search every message it can print</Link>
      {COMMUNITY_URL && <>, or <a href={COMMUNITY_URL}>ask on Discord</a></>}.</p>
  </section>;
}

const limits: [string, string][] = [
  ['It’s slow', 'About 50 seconds for the first answer, 20 after that. The whole model runs on ordinary CPUs, split across several machines.'],
  ['It makes mistakes', 'On our four repeated test questions, 116 of 233 answers had the right fact, and only 58 also cited the right document. It often picks an outdated version. A fix is being trained.'],
  ['It isn’t private', 'The machines that answer can read the conversation, and auditors can download their records. Use the sample documents, never personal or confidential files.'],
  ['It’s free, and the tokens are worthless', 'Test NEURO from a faucet pays for conversations. It has no cash value. Your only cost is your machine.'],
];

function Expect() {
  return <section className="section" id="expect">
    <p className="kicker">Before you rely on it</p>
    <h2>Honest limits.</h2>
    <p className="lede">It’s an early, invited pilot. It works end to end, and it is not a finished product.</p>
    <ul className="limits">{limits.map(([h, p]) => <li key={h}><h3>{h}</h3><p>{p}</p></li>)}</ul>
  </section>;
}

function How() {
  return <section className="section" id="how">
    <p className="kicker">How it works</p>
    <h2>Your question, step by step.</h2>
    <p className="lede">The model is split in pieces. Nobody holds all of it, and nobody has to be trusted: every step is signed and can be re-checked.</p>
    <ol className="flow">
      <li><span className="flow-where">your computer</span><h3>You ask</h3><p>Your machine runs the first piece of the model on your question.</p></li>
      <li><span className="flow-where">owners’ machines</span><h3>Owners answer</h3><p>People who host the other pieces finish the answer and sign what they did.</p></li>
      <li><span className="flow-where">the ledger</span><h3>Everyone gets paid</h3><p>Your test tokens pay those owners. A tenth goes into a pool that pays for training.</p></li>
      <li><span className="flow-where">contributors &amp; owners</span><h3>It improves</h3><p>Contributors train an update. Owners re-run a test picked after training, vote, and every node switches.</p></li>
    </ol>
    <aside className="proof"><b>Has it actually improved itself?</b> Once, so far. On October 17, 2026 the network trained, tested and voted in a new
      version. Re-measured on October 26 exactly as served, it answers 244 of 452 real-world requests correctly, against 223 for the
      model it started from. That gain is modest, and smaller than first reported: the original 294-versus-214 figure was measured with
      a mismatched tokenizer. <a href={`${SOURCE}/pull/153`}>See the evidence</a></aside>
  </section>;
}

const roles = [
  { id: 'owner', name: 'Owner', cmd: 'owner --shard 1', does: 'Host half of the model and serve conversations', needs: 'Intel CPU with AMX, 8 threads, 8 GB RAM, 20 GB disk, inbound TCP 28700 and 28781', gets: 'A share of every conversation you serve (in test tokens). Voting comes once members admit you' },
  { id: 'auditor', name: 'Auditor', cmd: 'auditor', does: 'Re-run owners’ signed work and prove any mistake', needs: 'Intel CPU with AMX, 16 GB RAM, no open ports', gets: 'Half the bond of any owner you catch' },
];

function Operate() {
  const [active, setActive] = useState('owner');
  const role = roles.find(r => r.id === active)!;
  return <section className="section" id="join">
    <p className="kicker">Optional · for people with the right hardware</p>
    <h2>Run a node.</h2>
    <p className="lede">We’re inviting a small first group of independent owners and auditors. Every node someone else runs makes the
      network less dependent on us. Your machine check (step 1) tells you if yours fits.</p>
    <div className="roles" role="tablist">{roles.map(r => <button key={r.id} role="tab" aria-selected={active === r.id} onClick={() => setActive(r.id)}>{r.name}</button>)}</div>
    <div className="role">
      <dl><div><dt>You</dt><dd>{role.does}</dd></div><div><dt>You need</dt><dd>{role.needs}</dd></div><div><dt>You get</dt><dd>{role.gets}</dd></div></dl>
      <Command text={join(role.cmd)} />
    </div>
    <p className="hint">Read the <a href={`${DOCS}/OPERATORS.md`}>operator guide</a> first, and <a href={`${SOURCE}/issues/new?template=operator.yml`}>tell us you joined</a> so we can help.</p>
    <p className="on-hold"><b>On hold for now:</b> running a validator, and contributing training. Their release needs its own
      qualification first; please don’t start them, even though the installer still accepts them.</p>
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
      <button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Check'}</button></div>
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
    <p className="kicker">Read from the chain, right now</p>
    <h2>The network, live.</h2>
    <p className="lede">Read through every validator, not from a database we control. <a href={`${DOCS}/DECENTRALIZATION.md`}>What is decentralized today</a></p>
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
  ['Do I need to be technical?', 'You need to paste three lines into a Linux terminal. If you’ve never used one, a cloud server is the easiest way: start one, open its terminal in the browser, and paste. A browser-based chat is coming in a later release.'],
  ['Does it cost anything?', 'No. Conversations are paid with free test tokens that it fetches for you. Your only cost is the machine; a suitable cloud server is about $0.20 an hour. NEURO has no cash value.'],
  ['Is it private?', 'No. The machines that answer a conversation can read it, auditors can download their records, and the ledger is public. Use sample or made-up documents.'],
  ['How good are the answers?', 'Limited. In our latest test on four repeated questions, half the answers had the right fact and a quarter also cited the right document. A better version is being trained, and the network must vote it in.'],
  ['What do I need for an owner or auditor?', 'An Intel CPU with AMX (for example AWS m7i or r7i): every piece of work is checked by re-running it exactly, which today only works on that hardware. Users can chat from other x86-64 CPUs after a warning.'],
  ['Who decides what the model learns?', 'Members, by vote. An update only goes live if it beats the current model on a test chosen after training, which members reproduce themselves. No single key can change the model, including ours.'],
  ['Do I get a vote when I join?', 'Not straight away. Anyone can bond and serve, but free test tokens must not buy control, so a bond becomes a vote only when the existing members admit you.'],
  ['How far along is it?', 'An early, invited pilot. It works end to end, and the project still runs most nodes. The latest release passed a 72-hour test under injected faults with every one of 233 paid conversations settled. It is not a public beta.'],
];

export default function Home() {
  const { value: n, error } = useLive<AssistantNetwork>('/assistant/network');
  return <div className="home">
    <Hero n={n} error={error} />
    <Try />
    <Expect />
    <How />
    <Operate />
    <Network n={n} />
    <section className="section" id="faq">
      <p className="kicker">Questions</p>
      <h2>People usually ask.</h2>
      <div className="faq">{faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
    </section>
    <section className="section closing">
      <h2>Need a hand?</h2>
      <div className="help">
        <Link to="/help"><b>Fix a problem</b><span>Every message the installer and chat can show, and what to do.</span></Link>
        {COMMUNITY_URL && <a href={COMMUNITY_URL}><b>Ask on Discord</b><span>Other users and the team, in one place.</span></a>}
        <Link to="/help#ask"><b>Ask us</b><span>Open a prefilled help request.</span></Link>
        <a href={`mailto:${EMAIL}`}><b>Email us</b><span>{EMAIL}</span></a>
      </div>
    </section>
  </div>;
}
