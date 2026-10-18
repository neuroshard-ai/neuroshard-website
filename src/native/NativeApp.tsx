import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowRight, Check, Copy, ExternalLink, Menu, RefreshCw, Terminal, X } from 'lucide-react';
import { asset, Block, get, Network, neuro, short } from './api';
import logo from '../assets/logo_white.png';
import './native.css';
import Model from './Model';
import releaseNetwork from '../networks/llm-testnet.json';
import Chat from './Chat';
import { SponsorStatus, Validators } from './Participation';
import Vision, { Teams, GetInvolved, ALPHA_GUIDE } from './Vision';
import Home from './Home';

const SOURCE = 'https://github.com/neuroshard-ai/neuroshard';
function useNetwork() {
  const [network, setNetwork] = useState<Network | null>(null);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState<Date | null>(null);
  const refresh = useCallback(async () => {
    try { setNetwork(await get<Network>('/api/network')); setUpdated(new Date()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Cannot reach the full node'); }
  }, []);
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 10000); return () => clearInterval(timer); }, [refresh]);
  return { network, error, updated, refresh };
}
type Connection = ReturnType<typeof useNetwork>;

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setError('Select the command to copy it.'); }
  };
  return <div className="native-code"><button aria-label="Copy command" onClick={() => void copy()}>{copied ? <Check size={16} /> : <Copy size={16} />}</button><pre>{children}</pre>{error && <small>{error}</small>}</div>;
}
function ConnectionBar({ network, error, updated, refresh }: Connection) {
  return <div className={`native-connection ${error ? 'is-offline' : ''}`} role="status"><span className="connection-dot" />
    <span>{error ? 'Node unavailable' : !network ? 'Connecting to a full node' : network.ready ? 'Connected to native ledger' : network.stalled ? 'Waiting for new blocks' : 'Node is catching up'}</span>
    <span className="connection-chain">{network?.chain_id || 'Waiting for chain identity'}</span>
    {error && <button onClick={() => void refresh()}><RefreshCw size={13} /> Retry</button>}
    <span className="connection-time">{updated ? `Read at ${updated.toLocaleTimeString()}` : 'Live data only'}</span></div>;
}
function Stats({ network: n }: { network: Network | null }) {
  const items = [['BLOCK HEIGHT', n?.height.toLocaleString()], ['TRAINING STEPS', n?.round.toLocaleString()],
    ['ACTIVE VALIDATORS', n?.validator_count.toLocaleString()], ['NEURO ISSUED', n ? neuro(n.issued) : undefined]];
  return <div className="native-stats">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value ?? '—'}</strong></div>)}</div>;
}
function NetworkOverview({ connection }: { connection: Connection }) {
  return <section className="native-wrap native-page"><div className="native-eyebrow">THE NETWORK & THE RESEARCH</div>
    <h1>Explore the work.<br /><em>Find your way in.</em></h1>
    <p className="page-intro">Run the published software, inspect the ledger, and explore the results behind the shared-model vision. Each deployment has its own model, network identity, and participation rules.</p>
    <article className="network-switch"><div className="native-eyebrow">GPU ALPHA RETIRED · SEPTEMBER 20, 2026</div><h2>Sharded serving. Preserved evidence.</h2>
      <p>Seven GPU hosts demonstrated the accepted growing graph, paid streaming and automatic provider-process recovery. The completed trial's source and results remain published.</p>
      <p>New admissions and GPU service are closed. Compute resources are reserved for further assistant-learning research. The separate ledger remains scheduled through September 26 for expiry and refunds; no replacement GPU service has been announced.</p>
      <p>The trial supported two concurrent requests and 64-token responses under one operator, with public prompts and replies. It served fixed accepted weights and ran no new training. Its balances and keys belong to a different chain from the browser demo below.</p>
      <div className="native-actions"><a className="native-button" href={ALPHA_GUIDE}>Read the retired trial guide <ExternalLink size={14} /></a><a className="native-button secondary" href="https://docs.neuroshard.com/generated/OPERATED_ALPHA_RESULT">See results and retirement <ExternalLink size={14} /></a></div>
    </article>
    <div className="baseline-label"><span>BELOW: 0.4.0 BASELINE · Earlier CPU testnet</span><Link to="/model">Inspect the baseline model <ArrowRight size={14} /></Link></div>
    <ConnectionBar {...connection} /><Stats network={connection.network} />
    <section className="native-scope" style={{ marginTop: 40 }}><div><div className="native-eyebrow">EXPLORE THE NATIVE LIFECYCLE</div><h2>Run a node.<br />Follow the ledger.</h2><div className="native-actions"><Link className="native-button" to="/join">Run a node <ArrowRight size={15} /></Link><Link className="native-button secondary" to="/ledger">Open the ledger</Link></div></div><div><p>The 0.4.0 baseline starts from SmolLM2-135M-Instruct with a 4,608-parameter trainable adapter. Its backbone is frozen. Validators fully replay prescribed training and paid inference on CPU.</p><p>It demonstrates the token lifecycle with a small, limited model. It is separate from the growing-model research. Trial NEURO has no promised monetary value or automatic migration to another chain.</p><Link className="native-text-link" to="/chat">Try the baseline browser demo <ArrowRight size={15} /></Link></div></section>
  </section>;
}
function Join({ connection }: { connection: Connection }) {
  const n = connection.network, matches = n?.genesis_sha256 === releaseNetwork.genesis_sha256;
  return <section className="native-wrap native-page"><div className="native-eyebrow">PARTICIPATE</div><h1>Your machine.<br /><em>Your keys.</em></h1><p className="page-intro">Install the client, start a node, and contribute computation. No website account, registration token, or initial NEURO balance is required.</p><ConnectionBar {...connection} />
    <div className="join-grid"><div><article className="join-step"><span className="step-index">01</span><h2>Install the client</h2><p>Use Python 3.10–3.12 on Linux x86_64 for a full node. Allow 8 GiB RAM and 5 GiB free disk; the release was tested on machines with 16 GiB RAM. Wallet and chat also work without the node runtime.</p><Code>{'python3 -m venv ~/.venvs/neuroshard\nsource ~/.venvs/neuroshard/bin/activate\npython -m pip install --upgrade pip setuptools neuroshard-ai\nneuroshard doctor'}</Code><p className="muted">If Ubuntu reports that venv is missing, install python3-venv first. Version 0.4.0 replaces the old registration client. The initial install is small; joining installs the pinned CPU runtime and model in a separate managed environment.</p></article>
    <article className="join-step"><span className="step-index">02</span><h2>Join and contribute</h2><Code>{'neuroshard join'}</Code><p>Your machine creates native keys, verifies the published genesis and model files, follows the ledger, and offers stage 1 work to the project sponsor. Leave the command running to contribute. Ctrl+C stops it; your key and history remain.</p><SponsorStatus /><p className="muted">The installer checks your arithmetic against fixed test vectors. It uses this project’s recent block checkpoint by default; independently operated nodes can supply a trusted height and hash. Training assignments depend on sponsor budget and availability.</p>{n && <dl><dt>Connected chain</dt><dd>{n.chain_id}</dd><dt>Genesis SHA-256</dt><dd>{n.genesis_sha256}</dd></dl>}{n && !matches && <div className="native-notice">This website’s connected genesis differs from the client release. Check the published network before joining.</div>}</article>
    <article className="join-step"><span className="step-index">03</span><h2>Use your earned NEURO</h2><p>In another terminal, check the balance and ask the model a short question. Chat shows the total price and a request ID. Prompts and responses are public.</p><Code>{'neuroshard wallet balance\nneuroshard chat "What is the capital of France?"'}</Code><p>To use the browser interface with the same account, save a private key backup and import it on the inference page.</p><Code>{'neuroshard wallet export neuroshard-key.json'}</Code><Link className="native-text-link" to="/chat">Open inference <ArrowRight size={15} /></Link></article></div>
    <aside className="join-aside"><Terminal size={26} /><h3>Choose your role</h3><div><strong>Training worker · default</strong><p>Follow the ledger and compute assigned updates. The sponsor supplies reservation collateral; accepted work earns native rewards.</p></div><div><strong>Observer</strong><p>Verify the ledger without offering work.</p><code>neuroshard join --role observer</code></div><div><strong>Inference provider</strong><p>Compute paid requests addressed to your public key. Customers select you explicitly with the CLI.</p><code>neuroshard join --role provider</code></div><div><strong>Validator</strong><p>Bond NEURO with your own consensus key. Voting power activates after the native delay; operator instructions cover the additional responsibilities.</p></div><a className="native-text-link" href="https://docs.neuroshard.com/generated/PUBLIC_TESTNET">Operator instructions <ExternalLink size={15} /></a><hr /><a className="native-text-link" href={SOURCE + '/releases/tag/v0.4.0'}>Release and network identity <ExternalLink size={15} /></a><hr /><small>Keep a private backup of your key. Experimental balances belong to their chain; no automatic migration from earlier networks is defined.</small></aside></div></section>;
}
function Ledger({ connection }: { connection: Connection }) {
  const [blocks, setBlocks] = useState<Block[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [accountKey, setAccountKey] = useState(''), [accountError, setAccountError] = useState('');
  const [account, setAccount] = useState<{ public_key: string; balance: string; nonce: number } | null>(null);
  const [selected, setSelected] = useState<Block | null>(null);
  const load = useCallback(async (before?: number) => {
    setBusy(true);
    try { const value = await get<{ blocks: Block[] }>(`/api/blocks?limit=10${before ? `&before=${before}` : ''}`); setBlocks(value.blocks); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Cannot load blocks'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => {
    void load();
    const search = new URLSearchParams(window.location.search), height = search.get('height'), key = search.get('account');
    if (height && /^[1-9][0-9]{0,15}$/.test(height)) void get<Block>(`/api/block/${height}`).then(setSelected).catch(() => setError('Cannot read the selected block'));
    if (key) { setAccountKey(key); void get<{public_key: string; balance: string; nonce: number}>(`/api/account?public_key=${encodeURIComponent(key)}`).then(setAccount).catch(() => setAccountError('Cannot read the selected account')); }
  }, [load]);
  const lookup = async (e: FormEvent) => {
    e.preventDefault(); setAccount(null); setAccountError('');
    try { setAccount(await get(`/api/account?public_key=${encodeURIComponent(accountKey.trim())}`)); }
    catch (err) { setAccountError(err instanceof Error ? err.message : 'Account lookup failed'); }
  };
  return <section className="native-wrap native-page"><div className="native-eyebrow">NATIVE LEDGER</div><h1>Follow the work.<br /><em>Check the record.</em></h1><p className="page-intro">Blocks, model progress, and native balances from the connected full node. Every network is identified by its chain ID and genesis digest.</p><ConnectionBar {...connection} /><Stats network={connection.network} />{connection.network && <p className="muted supply-note">Genesis allocation: {neuro(connection.network.initial_supply)} NEURO · Training issuance: {neuro(connection.network.issued)} · Burned: {neuro(connection.network.burned)} · Remaining supply: {neuro((BigInt(connection.network.initial_supply) + BigInt(connection.network.issued) - BigInt(connection.network.burned)).toString())} NEURO</p>}
    <div className="ledger-heading"><h2>Recent blocks</h2><button className="native-button secondary compact" disabled={busy} onClick={() => void load()}><RefreshCw size={15} /> Latest</button></div>{error && <div className="native-notice" role="alert">{error}</div>}
    <div className="block-table"><table><thead><tr><th>HEIGHT</th><th>BLOCK HASH</th><th>TIME</th><th>TRANSACTIONS</th></tr></thead><tbody>{blocks.map(block => <tr key={block.height} onClick={() => setSelected(block)}><td><button className="block-height" onClick={() => setSelected(block)}>#{block.height.toLocaleString()}</button></td><td className="mono" title={block.hash}>{short(block.hash)}</td><td>{new Date(block.time).toLocaleTimeString()}</td><td>{block.transactions.length ? block.transactions.map(tx => <span className="tx-kind" key={tx.hash}>{tx.kind}</span>) : <span className="muted">Empty block</span>}</td></tr>)}</tbody></table>{!blocks.length && !error && <p className="empty-state">{busy ? 'Reading native blocks…' : 'No blocks available yet.'}</p>}</div>
    <div className="ledger-pagination"><span>Each block links to its predecessor.</span><button disabled={busy || !blocks.length || blocks[blocks.length - 1].height <= 1} onClick={() => void load(blocks[blocks.length - 1].height)}>Older blocks <ArrowRight size={15} /></button></div>
    {selected && <section className="block-detail"><button aria-label="Close block detail" className="detail-close" onClick={() => setSelected(null)}><X size={20} /></button><div className="native-eyebrow">BLOCK {selected.height}</div><h3>Committed record</h3><dl><dt>Block hash</dt><dd>{selected.hash}</dd><dt>Application hash · state at height {selected.app_state_height}</dt><dd>{selected.app_hash || 'Genesis state'}</dd></dl>{selected.transactions.map(tx => <div className="transaction-detail" key={tx.hash}><strong>{tx.kind} · {tx.code === 0 ? "Accepted" : "Rejected"}</strong><dl><dt>Transaction</dt><dd>{tx.hash}</dd><dt>Signer</dt><dd>{tx.sender}</dd></dl><pre>{JSON.stringify(tx.body, null, 2)}</pre></div>)}</section>}
    <Validators /><section className="account-search"><div><div className="native-eyebrow">PUBLIC ACCOUNTS</div><h2>Look up a balance</h2><p>Enter a compressed public key. Your private key always stays on your machine.</p></div><form onSubmit={e => void lookup(e)}><label htmlFor="account-key">Account public key</label><input id="account-key" value={accountKey} onChange={e => setAccountKey(e.target.value)} placeholder="02… or 03…" pattern="0[23][0-9a-fA-F]{64}" required /><button className="native-button" type="submit">Look up account <ArrowRight size={16} /></button>{accountError && <p role="alert" className="form-error">{accountError}</p>}{account && <div className="account-result"><strong>{neuro(account.balance)} NEURO</strong><span>Next nonce: {account.nonce}</span></div>}</form></section><p className="muted ledger-footnote">Explorer data is served by this full node. Run your own node to verify the history independently. Account inclusion proofs are not provided by this API.</p></section>;
}
function Protocol() {
  const cards = [
    ['01 / ARCHITECTURE', 'How a shared model can grow', 'Sharding, compute groups, evaluated learning, resource admission, and the remaining scaling questions.', SOURCE + '/blob/main/docs/SCALING_DESIGN.md'],
    ['02 / LEARNING', 'Useful updates, measured retention', 'Three prospectively admitted learning cohorts, automatic continuation, complete results, and the limits of those demonstrations.', SOURCE + '/blob/main/docs/CONTINUAL_ADMISSION_RESULTS.md'],
    ['03 / NATIVE LIFECYCLE', 'From accepted work to paid inference', 'Verified training rewards, separate quality promotion, inference payments, and reproducible settlement evidence.', SOURCE + '/blob/main/docs/NATIVE_EXPERT_LIVE_RESULT.md'],
  ];
  return <section className="native-wrap native-page"><div className="native-eyebrow">ARCHITECTURE & RESEARCH</div><h1>Inspect the rules.<br /><em>Build on the results.</em></h1><p className="page-intro">The shared-intelligence vision is built on a concrete research program: distribute model execution, admit useful learning, verify the work, and settle contributions on NeuroShard’s own chain.</p><div className="protocol-cards">{cards.map(([number, title, description, url]) => <a key={number} href={url}><span>{number}</span><h2>{title}</h2><p>{description}</p><ArrowRight /></a>)}</div><section className="native-scope"><div><h2>Open questions.<br />Open evidence.</h2><a className="native-text-link" href={SOURCE + '/blob/main/TODO.md'}>Follow the completion criteria <ExternalLink size={15} /></a></div><div><p>Full replay checks executed work with substantial duplicate computation. Economical verification, reliable independent hosting, and broader assistant quality remain important development work.</p><p>The operated demonstrations use one administrator. Protocol admission alone does not establish independent ownership or a self-sustaining compute market.</p><p>The product direction for local teams builds on these results; private enterprise operation and a supported appliance are not yet shipped.</p></div></section><div className="native-actions"><a className="native-button secondary" href={SOURCE + '/blob/main/docs/LLM_PROTOCOL.md'}>0.4.0 protocol specification <ExternalLink size={15} /></a><a className="native-button secondary" href={asset('/papers/FINE2026_neuroshard_short.pdf')}>Research manuscript <ExternalLink size={15} /></a></div></section>;
}
function RoutePosition() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'An open AI that improves itself', '/vision': 'Vision', '/teams': 'AI for your team', '/build': 'Build with NeuroShard', '/explore': 'Explore the networks', '/protocol': 'Architecture & research', '/join': 'Join the network', '/baseline/join': 'Join the 0.4.0 baseline', '/chat': '0.4.0 inference demo', '/ledger': '0.4.0 ledger', '/model': '0.4.0 model' };
    document.title = `${titles[pathname] || 'Open, shared intelligence'} | NeuroShard`;
    const frame = requestAnimationFrame(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}
export default function NativeApp() {
  const connection = useNetwork(), [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  const baseline = ['/baseline/join', '/chat', '/ledger', '/model'].includes(pathname);
  return <div className="native-app"><RoutePosition /><a className="skip-to-content" href="#main">Skip to content</a>
    <header className="native-header"><Link to="/" className="native-brand" onClick={() => setMenu(false)}><img src={logo} alt="" /><span>NeuroShard</span></Link><button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={menu} aria-controls="primary-navigation" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button><nav id="primary-navigation" className={menu ? 'open' : ''} onClick={() => setMenu(false)}><Link to="/#how">How it works</Link><Link to="/#network">Network</Link><Link to="/#faq">FAQ</Link><a href={SOURCE}>GitHub</a><Link className="nav-join" to="/#join">Join</Link></nav></header>
    {baseline && <div className="baseline-banner"><div className="native-wrap"><span>0.4.0 baseline · Earlier CPU testnet · Public data</span><Link to="/">This is the earlier 0.4.0 testnet. The live network is here →</Link></div></div>}
    <main id="main"><Routes>
      <Route path="/" element={<Home />} />
      {['/network', '/assistant', '/run', '/explore', '/download'].map(p => <Route key={p} path={p} element={<Navigate to="/#network" replace />} />)}
      <Route path="/join" element={<Navigate to="/#join" replace />} />
      <Route path="/vision" element={<Vision />} /><Route path="/teams" element={<Teams />} /><Route path="/build" element={<GetInvolved />} />
      <Route path="/protocol" element={<Protocol />} /><Route path="/whitepaper" element={<Protocol />} />
      <Route path="/baseline" element={<NetworkOverview connection={connection} />} /><Route path="/baseline/join" element={<Join connection={connection} />} />
      <Route path="/ledger" element={<Ledger connection={connection} />} /><Route path="/model" element={<Model />} /><Route path="/chat" element={<Chat />} />
      <Route path="*" element={<section className="native-wrap native-page"><h1>Page not found.</h1><Link className="native-button" to="/">Go to the homepage <ArrowRight size={16} /></Link></section>} />
    </Routes></main>
    <footer className="site-footer"><span>NeuroShard · open source, Apache 2.0</span><div><Link to="/protocol">Research</Link><Link to="/vision">Vision</Link><Link to="/teams">For teams</Link><a href="https://docs.neuroshard.com">Docs</a><a href="mailto:info@neuroshard.com">Contact</a></div></footer></div>;
}
