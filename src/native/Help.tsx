import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ExternalLink, Search } from 'lucide-react';
import { Command } from './Home';
import { CHAT, COMMUNITY_URL, DOCS, EMAIL, helpIssue, join, SOURCE } from './release';
import './home.css';

type Fix = { id: string; when: string; says: string[]; means: string; fix: string[]; cmd?: string };

// Each entry quotes what the installer (scripts/join.sh) or the client actually prints at the pilot-2 release.
export const FIXES: Fix[] = [
  { id: 'not-linux', when: 'Installing', says: ['Linux x86_64 only', 'Every role needs Linux x86_64.'],
    means: 'The installer runs only on Linux on an x86-64 (Intel or AMD) computer. Macs, Windows and Arm machines aren’t supported yet.',
    fix: ['Use a Linux x86-64 machine. The easiest is a small cloud server, for example AWS m7i.xlarge with Ubuntu 24.04.',
      'On Windows, WSL2 with Ubuntu on an x86-64 PC may work, but it isn’t tested.'] },
  { id: 'memory', when: 'Installing', says: ['role chat needs about 8 GB of RAM; this machine has', 'chat         no: needs 8 GB RAM'],
    means: 'Your machine has less than 8 GB of memory. The chat client needs about 5 GB while it runs.',
    fix: ['Use a machine with at least 8 GB of memory, for example AWS m7i.xlarge (16 GB).'] },
  { id: 'local-changes', when: 'Installing', says: ['has local changes; this script will not overwrite them', 'exists but is not a NeuroShard release'],
    means: 'The installer keeps its code in ~/.neuroshard/release and won’t overwrite anything you changed there.',
    fix: ['Move that folder away, then run the install line again.'], cmd: 'mv ~/.neuroshard/release ~/.neuroshard/release.old' },
  { id: 'not-found', when: 'Starting chat', says: ['neuroshard: command not found', 'No such file or directory'],
    means: 'The chat command isn’t on your path. The installer puts it in its own folder.',
    fix: ['Use the full path, as the installer printed at the end.'], cmd: CHAT },
  { id: 'experimental-cpu', when: 'Starting chat', says: ['Experimental client: CPU without amx_bf16', 'this CPU is experimental for the client; pass --experimental-cpu to continue'],
    means: 'Your CPU isn’t an Intel CPU with AMX, which is what the replies were evaluated on. Chat still works, but replies may be worded differently.',
    fix: ['In a terminal, answer y to continue. Nothing is downloaded or paid until you do.',
      'In a script or without a terminal, add --experimental-cpu.'], cmd: `${CHAT} --experimental-cpu` },
  { id: 'busy', when: 'Starting chat', says: ['the network stayed busy until the deadline; nothing was funded'],
    means: 'Every machine serving one half of the model was busy with other conversations for the whole wait. Nothing was paid.',
    fix: ['Try again in a few minutes. With only a few owners in this pilot, the network can serve only a few conversations at once.'] },
  { id: 'faucet', when: 'Starting chat', says: ['no faucet funded this account', 'this account or address was funded recently'],
    means: 'The client couldn’t get free test tokens. A faucet gives each account a limited number of grants per hour.',
    fix: ['Wait an hour and try again.', 'If it keeps failing, ask us: the faucet may be down.'] },
  { id: 'not-served', when: 'Starting chat', says: ['is funded but was not served'],
    means: 'The conversation was paid for, but the owners it picked didn’t start it in time. Its whole payment is refunded automatically when it expires.',
    fix: ['Start a new conversation. You don’t need to do anything about the refund.'] },
  { id: 'rpc', when: 'Starting chat', says: ['no ledger RPC reachable', 'no ledger RPC returned a state the validators signed'],
    means: 'The client couldn’t reach the network’s ledger, or couldn’t verify what it returned.',
    fix: ['Check that your machine can reach the internet (outbound TCP 26657).', 'If the live status at the top of the home page is red, the network is down: try later.'] },
  { id: 'version', when: 'Starting chat', says: ['the ledger serves another version than this device holds'],
    means: 'The owners voted in a new model version since your client downloaded its part.',
    fix: ['Run chat again: it fetches the new version automatically.'] },
  { id: 'no-reply', when: 'In a conversation', says: ['(no reply)', 'generation did not terminate within its token/input budget', 'model-turn budget exhausted'],
    means: 'The model didn’t finish an answer within its limits. That conversation ends.',
    fix: ['Start a new conversation and ask a shorter, more specific question.', 'Please report it, with the question you asked.'] },
  { id: 'wrong', when: 'In a conversation', says: ['an answer that cites an older revision'],
    means: 'A known limitation: the assistant often picks an older version of a document. A fix is being trained.',
    fix: ['Ask for “the latest approved version” and check the document ID it cites.', 'Please report it: wrong answers are the most useful feedback.'] },
  { id: 'slow', when: 'In a conversation', says: ['It seems stuck after I press Enter'],
    means: 'It’s probably working. The first answer takes about 50 seconds once the conversation opens; later ones about 20 seconds.',
    fix: ['Wait up to two minutes before assuming something is wrong.'] },
  { id: 'interrupted', when: 'In a conversation', says: ['Stopped. Your key and node history remain on disk.'],
    means: 'You pressed Ctrl-C. The conversation ended; unused test tokens are refunded when it settles.',
    fix: ['Run chat again to start a new conversation.'] },
];

function Ask() {
  const [command, setCommand] = useState(join('chat')), [what, setWhat] = useState('');
  const open = (e: FormEvent) => { e.preventDefault(); window.open(helpIssue(command, what), '_blank', 'noopener'); };
  return <section className="section" id="ask">
    <h2>Ask us.</h2>
    <p className="lede">Most problems are fixed fastest with the exact messages you saw. This opens a help request on GitHub with
      them filled in; you’ll need a free GitHub account. <b>Never paste anything from files ending in .key.</b></p>
    <form className="ask" onSubmit={open}>
      <label htmlFor="ask-command">What you ran</label>
      <input id="ask-command" value={command} onChange={e => setCommand(e.target.value)} spellCheck={false} />
      <label htmlFor="ask-what">What it printed (the last 20 lines or so)</label>
      <textarea id="ask-what" rows={8} value={what} onChange={e => setWhat(e.target.value)} spellCheck={false}
        placeholder="Paste the messages here" />
      <button className="btn" type="submit">Open a help request <ExternalLink size={15} /></button>
    </form>
    <p className="hint">The request also asks for your machine check, which installs nothing:</p>
    <Command text={join('check')} />
    <div className="help ask-other">
      {COMMUNITY_URL && <a href={COMMUNITY_URL}><b>Community chat</b><span>Ask other users and the team.</span><ExternalLink size={15} /></a>}
      <a href={`mailto:${EMAIL}?subject=NeuroShard%20help`}><b>Email</b><span>{EMAIL}: we answer within a working day during the pilot.</span><ExternalLink size={15} /></a>
      <a href={`${DOCS}/OPERATORS.md`}><b>Operator guide</b><span>For owners and auditors: joining, upgrading, leaving.</span><ExternalLink size={15} /></a>
    </div>
  </section>;
}

export default function Help() {
  const [query, setQuery] = useState(''), { hash } = useLocation();
  useEffect(() => { document.title = 'Help | NeuroShard'; }, []);
  const q = query.trim().toLowerCase();
  const shown = FIXES.filter(f => !q || [f.when, f.means, ...f.says, ...f.fix].join(' ').toLowerCase().includes(q));
  const groups = ['Installing', 'Starting chat', 'In a conversation'];
  return <div className="home help-page">
    <section className="hero compact-hero">
      <h1>Help.</h1>
      <p>Find the message you saw, and what to do about it. Still stuck? <a href="#ask">Ask us</a>.</p>
      <label className="search" htmlFor="help-search"><Search size={16} />
        <input id="help-search" type="search" placeholder="Paste or type part of the message" value={query}
          onChange={e => setQuery(e.target.value)} autoFocus={!hash} spellCheck={false} /></label>
    </section>
    {groups.map(group => {
      const items = shown.filter(f => f.when === group);
      return items.length ? <section className="section fixes" key={group}>
        <h2>{group}</h2>
        {items.map(f => <article key={f.id} id={f.id} className="fix">
          {f.says.map(s => <code key={s}>{s}</code>)}
          <p>{f.means}</p>
          <ul>{f.fix.map(x => <li key={x}>{x}</li>)}</ul>
          {f.cmd && <Command text={f.cmd} />}
        </article>)}
      </section> : null;
    })}
    {!shown.length && <section className="section"><p className="lede">No match for that message. <a href="#ask">Ask us</a> and paste it in full.</p></section>}
    <Ask />
    <section className="section closing">
      <p className="hint"><Link to="/#try">Back to getting started <ArrowRight size={14} /></Link> · <a href={SOURCE}>Source code</a></p>
    </section>
  </div>;
}
