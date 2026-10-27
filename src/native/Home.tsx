import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, Copy, ExternalLink, LifeBuoy, Lock, Search, Terminal } from 'lucide-react';
import { AssistantJobs, AssistantNetwork, atoms, get, Lookup, short } from './api';
import { CHAT, COMMUNITY_URL, DOCS, EMAIL, INSTALLER, INSTALLER_SHA256, join, RELEASE, SOURCE } from './release';
import './home.css';

export { SOURCE };

function useLive<T>(path: string, every = 10000) {
  const [value, setValue] = useState<T | null>(null), [error, setError] = useState(false);
  const load = useCallback(async () => {
    try { setValue(await get<T>(path)); setError(false); } catch { setError(true); }
  }, [path]);
  useEffect(() => { void load(); const t = setInterval(() => void load(), every); return () => clearInterval(t); }, [load, every]);
  return { value, error };
}

export function Command({ text, label = 'Copy command' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => void navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); });
  return <div className="cmd"><code>{text}</code><button aria-label={label} onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}</button></div>;
}

function LiveLine({ n, error }: { n: AssistantNetwork | null; error: boolean }) {
  if (error) return <p className="live-line is-off"><span className="dot" />The network can’t be read right now</p>;
  if (!n) return <p className="live-line"><span className="dot" />Reading the network…</p>;
  const owners = n.owners.filter(o => o.status === 'active').length;
  return <p className="live-line"><span className="dot" />Live now · block {n.height.toLocaleString()} · {n.validators.length} validators · {owners} owners · model version {n.model_history.length}</p>;
}

function Try() {
  return <section className="section" id="try">
    <h2>Try it in about five minutes.</h2>
    <p className="lede">No account, no sign-up, no payment details. You get free test tokens automatically. Your keys are made on your machine and stay there.</p>
    <ol className="try">
      <li>
        <span>1</span>
        <div>
          <h3>Have a Linux machine</h3>
          <p>Linux on an x86-64 computer with at least 8 GB of memory and 10 GB of free disk. An Intel CPU with AMX gives the
            replies we evaluated; on other CPUs it still works, after a warning.</p>
          <p className="muted-note">No Linux machine? A small cloud server works well: on AWS an <b>m7i.xlarge</b> (4 cores, 16 GB) costs
            about $0.20 an hour. Shut it down when you’re done. Mac and Windows aren’t supported yet.</p>
        </div>
      </li>
      <li>
        <span>2</span>
        <div>
          <h3>Install it</h3>
          <p>Open a terminal and paste this one line. It checks your machine, installs everything into its own folder in your
            home directory, and changes nothing else. It takes under a minute.</p>
          <Command text={join('chat')} label="Copy install command" />
          <p className="muted-note">This downloads the reviewed <b>{RELEASE}</b> release. To check the installer before you run it:</p>
          <Command text={`curl -LsSf ${INSTALLER} | sha256sum`} label="Copy checksum command" />
          <p className="muted-note">It should print <span className="inline-cmd mono-wrap">{INSTALLER_SHA256}</span>.</p>
        </div>
      </li>
      <li>
        <span>3</span>
        <div>
          <h3>Start chatting</h3>
          <p>Paste this to open a conversation:</p>
          <Command text={CHAT} label="Copy chat command" />
          <p>The first time, it downloads its part of the model (about 2 GB), gets you test tokens, and connects to the network:
            allow a couple of minutes. Then type a question about the sample documents it shows, and press Enter.
            Type <span className="inline-cmd">/quit</span> to finish.</p>
        </div>
      </li>
    </ol>
    <p className="hint">Stuck? <Link to="/help">See what each message means and how to fix it</Link>, or{' '}
      <Link to="/help#ask">ask us</Link>.</p>
  </section>;
}

const transcript = `Workspace: 4 documents, on this machine only.
  doc-292283f7a9  Cedar 6581 delivery plan, revision 1, approved
  doc-88b36697f8  Cedar 6581 delivery plan, revision 2, approved
  …
Requesting test NEURO from the faucet
Job 6dc37dbb02c31adc: shards served by 34.194.51.150:28700, 3.236.141.240:28700.
you> What is the baseline quantity in the latest approved Cedar 6581 Annex plan?
assistant (21 s, documents): The latest approved Cedar 6581 Annex delivery plan has a
baseline quantity of 70 units. (Sources: doc-35d32ed303)
you> /quit
The owners commit their logs now; the job settles after its challenge window.`;

function Expect() {
  return <section className="section" id="expect">
    <h2>What to expect.</h2>
    <p className="lede">It’s an early test. Here’s what a real session on a 4-core cloud server looked like on October 26, and what
      you should know before you rely on it.</p>
    <pre className="transcript" aria-label="Example session">{transcript}</pre>
    <div className="expect">
      <div><Clock size={18} /><h3>It’s slow</h3><p>The first answer takes about 50 seconds once the conversation opens; later ones
        about 20 seconds. The whole model runs on ordinary CPUs, split across several machines.</p></div>
      <div><LifeBuoy size={18} /><h3>It makes mistakes</h3><p>On our four repeated test questions it picked an outdated document
        version too often: 116 of 233 answers had the right fact, and only 58 also cited the right document. A fix is being
        trained. Please tell us when it’s wrong.</p></div>
      <div><Lock size={18} /><h3>It isn’t private</h3><p>The machines that answer a conversation can read it, and auditors can download
        their records. Use the sample documents or made-up ones, never personal or confidential files.</p></div>
      <div><Terminal size={18} /><h3>It’s free, and the tokens are worthless</h3><p>You get test NEURO from a faucet to pay for
        conversations. It has no cash value. Your only cost is your machine.</p></div>
    </div>
  </section>;
}

const steps = [
  ['Ask', 'Your computer runs the first part of the model; owners’ machines run the rest. Every step is signed, so anyone can check it later.'],
  ['Pay', 'Each conversation pays the owners who served it, in test tokens. A tenth of that goes into a pool that pays for training.'],
  ['Improve', 'Contributors train an update. A test picked by public randomness after training decides if it’s better. Owners re-run the test, vote, and every node switches.'],
];

const roles = [
  { id: 'owner', name: 'Owner', cmd: 'owner --shard 1', does: 'Host half of the model and serve conversations', needs: 'Intel CPU with AMX, 8 threads, 8 GB RAM, 20 GB disk, inbound TCP 28700 and 28781', gets: 'A share of every conversation you serve (in test tokens). Voting comes once members admit you' },
  { id: 'auditor', name: 'Auditor', cmd: 'auditor', does: 'Re-run owners’ signed work and prove any mistake', needs: 'Intel CPU with AMX, 16 GB RAM, no open ports', gets: 'Half the bond of any owner you catch' },
];

function Operate() {
  const [active, setActive] = useState('owner');
  const role = roles.find(r => r.id === active)!;
  return <section className="section" id="join">
    <h2>Run a node.</h2>
    <p className="lede">We’re inviting a small first group of independent owners and auditors for about a week. If you have a machine
      that fits, we’d love your help: every node someone else runs makes the network less dependent on us.</p>
    <div className="roles" role="tablist">{roles.map(r => <button key={r.id} role="tab" aria-selected={active === r.id} onClick={() => setActive(r.id)}>{r.name}</button>)}</div>
    <div className="role">
      <Command text={join(role.cmd)} />
      <dl><div><dt>You</dt><dd>{role.does}</dd></div><div><dt>You need</dt><dd>{role.needs}</dd></div><div><dt>You get</dt><dd>{role.gets}</dd></div></dl>
    </div>
    <p className="hint">Check your machine first, which installs nothing: <span className="inline-cmd">{join('check')}</span>
      {' '}· <a href={`${DOCS}/OPERATORS.md`}>Operator guide</a> · <a href={`${SOURCE}/issues/new?template=operator.yml`}>Tell us you joined</a></p>
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
  ['Do I need to be technical?', 'You need to paste two lines into a Linux terminal. If you’ve never used one, a cloud server is the easiest way: start one, open its terminal in the browser, and paste. A browser-based chat is coming in a later release.'],
  ['Does it cost anything?', 'No. Conversations are paid with free test tokens that it fetches for you. Your only cost is the machine; a suitable cloud server is about $0.20 an hour. NEURO has no cash value.'],
  ['Is it private?', 'No. The machines that answer a conversation can read it, auditors can download their records, and the ledger is public. Use sample or made-up documents.'],
  ['How good are the answers?', 'Limited. In our latest test on four repeated questions, half the answers had the right fact and a quarter also cited the right document. A better version is being trained, and the network must vote it in.'],
  ['How fast is it?', 'About 50 seconds for the first answer and 20 seconds after that, on a 4-core cloud server. The model runs on CPUs split across machines.'],
  ['What do I need for an owner or auditor?', 'An Intel CPU with AMX (for example AWS m7i or r7i): every piece of work is checked by re-running it exactly, which today only works on that hardware. Users can chat from other x86-64 CPUs after a warning.'],
  ['Who decides what the model learns?', 'Members, by vote. An update only goes live if it beats the current model on a test chosen after training, which members reproduce themselves. No single key can change the model, including ours.'],
  ['Do I get a vote when I join?', 'Not straight away. Anyone can bond and serve, but free test tokens must not buy control, so a bond becomes a vote only when the existing members admit you.'],
  ['How far along is it?', 'An early, invited pilot. It works end to end, and the project still runs most nodes. The latest release passed a 72-hour test under injected faults with every one of 233 paid conversations settled. It is not a public beta.'],
];

export default function Home() {
  const { value: n, error } = useLive<AssistantNetwork>('/assistant/network');
  return <div className="home">
    <section className="hero">
      <h1>An open AI that<br /><em>improves itself.</em></h1>
      <p>NeuroShard is an assistant run by the people who host it. Using it pays for training; owners test every update and vote it in. You can try it now, for free, from a Linux machine.</p>
      <div className="actions"><a className="btn" href="#try">Try it <ArrowRight size={16} /></a><a className="btn ghost" href="#join">Run a node</a><a className="btn ghost" href="#how">How it works</a></div>
      <LiveLine n={n} error={error} />
    </section>

    <Try />
    <Expect />

    <section className="section" id="how">
      <h2>How it works.</h2>
      <ol className="steps">{steps.map(([title, text], i) => <li key={title}><span>{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
      <p className="proof">It has done this on its own once: on October 17, 2026 the network trained, tested and voted in a new version.
        Re-measured on October 26 exactly as it is served, it answers 244 of 452 real-world requests correctly, against 223 for the
        model it started from. That gain is modest, and smaller than first reported: the original 294-versus-214 figure was measured with
        a mismatched tokenizer. <a href={`${SOURCE}/pull/153`}>See the evidence</a></p>
    </section>

    <Operate />
    <Network n={n} />

    <section className="section" id="faq">
      <h2>Questions.</h2>
      <div className="faq">{faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
    </section>

    <section className="section closing">
      <h2>Need a hand?</h2>
      <div className="help">
        <Link to="/help"><b>Fix a problem</b><span>Every message the installer and chat can show, and what to do.</span><ArrowRight size={16} /></Link>
        <Link to="/help#ask"><b>Ask us</b><span>Open a prefilled help request{COMMUNITY_URL ? ', or join us on Discord' : ''}.</span><ArrowRight size={16} /></Link>
        <a href={`mailto:${EMAIL}`}><b>Email us</b><span>{EMAIL}</span><ExternalLink size={15} /></a>
      </div>
    </section>
  </div>;
}
