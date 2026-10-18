import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Cpu, ExternalLink, Globe2, Layers, Network, ShieldCheck } from 'lucide-react';
import './vision.css';

const SOURCE = 'https://github.com/neuroshard-ai/neuroshard';
const CONTACT = `mailto:info@neuroshard.com?subject=${encodeURIComponent('Build with NeuroShard')}`;
export const EVIDENCE = `${SOURCE}/blob/main/docs/CONTINUAL_ADMISSION_RESULTS.md`;
export const ALPHA_GUIDE = 'https://docs.neuroshard.com/generated/JOIN_ALPHA';

const modes = [
  { name: 'Serve', title: 'Share the work.', detail: 'Connected machines host different parts of a model. Replicas add capacity for more people and help keep the service available.' },
  { name: 'Learn', title: 'Build on what works.', detail: 'Contributed compute trains new capabilities. Quality and retention checks decide which updates become part of the shared answering system.' },
  { name: 'Grow', title: 'Make room for more.', detail: 'More reliable compute creates room for larger models and new experts. Growth earns its place through measured benefit.' },
];

function SharedModel() {
  const [active, setActive] = useState(0);
  const mode = modes[active];
  return <div className={`shared-model shared-model-${active}`}>
    <div className="model-visual" role="img" aria-label="Illustration of several machines contributing shards to a shared AI model">
      <svg viewBox="0 0 500 420" aria-hidden="true">
        <defs>
          <radialGradient id="model-glow"><stop stopColor="#c8ff00" stopOpacity=".16" /><stop offset="1" stopColor="#c8ff00" stopOpacity="0" /></radialGradient>
          <pattern id="model-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#657050" opacity=".36" /></pattern>
        </defs>
        <rect width="500" height="420" fill="url(#model-grid)" />
        <circle cx="250" cy="202" r="190" fill="url(#model-glow)" />
        <g className="model-orbits" fill="none" stroke="#39432c"><ellipse cx="250" cy="202" rx="172" ry="140" /><ellipse cx="250" cy="202" rx="110" ry="89" /></g>
        <g className="model-links" fill="none" stroke="#718848" strokeWidth="1.2">
          <path d="M92 98 L207 178 M405 100 L292 178 M425 281 L294 227 M91 300 L207 227 M250 42 L250 150 M250 345 L250 250" />
          <path className="model-route" d="M92 98 L207 178 L250 202 L294 227 L425 281" />
          <path className="model-route route-two" d="M405 100 L292 178 L250 202 L207 227 L91 300" />
        </g>
        <g className="model-core">
          <path d="M250 142 L302 172 V232 L250 262 L198 232 V172 Z" fill="#17210c" stroke="#c8ff00" strokeWidth="1.2" />
          <path d="M250 157 L289 179 V224 L250 247 L211 224 V179 Z M211 179 L250 202 L289 179 M250 202 V247 M250 157 V202 M211 224 L250 202 L289 224" fill="none" stroke="#849f49" />
          <circle cx="250" cy="202" r="5" fill="#d2ff56" />
        </g>
        {[[92, 98], [405, 100], [425, 281], [91, 300], [250, 42], [250, 345]].map(([x, y], i) => <g key={i} className={`model-node node-${i}`} transform={`translate(${x},${y})`}>
          <rect x="-23" y="-18" width="46" height="36" rx="5" fill="#141b0f" stroke="#7b9350" />
          <path d="M-12 -7 H12 M-12 0 H5 M-12 7 H9" stroke="#b9d188" strokeWidth="1.5" />
          <circle cx="15" cy="8" r="2" fill="#c8ff00" />
        </g>)}
        <g fill="#a9b69a" fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="1.5">
          <text x="92" y="137" textAnchor="middle">YOUR MACHINE</text>
          <text x="405" y="139" textAnchor="middle">YOUR TEAM</text>
          <text x="250" y="385" textAnchor="middle">A SHARED MODEL</text>
        </g>
      </svg>
      <span className="visual-label">Architecture vision · illustrated</span>
    </div>
    <div className="model-controls" role="group" aria-label="Explore how NeuroShard works">
      {modes.map((item, i) => <button key={item.name} type="button" aria-pressed={active === i} onClick={() => setActive(i)}><span>0{i + 1}</span>{item.name}</button>)}
    </div>
    <div className="model-explanation" aria-live="polite"><strong>{mode.title}</strong><p>{mode.detail}</p></div>
  </div>;
}

export default function Vision() {
  return <div className="vision-home">
    <section className="vision-hero native-wrap">
      <div className="vision-hero-copy">
        <div className="native-eyebrow"><span className="vision-signal" /> THE FUTURE OF AI IS SHARED</div>
        <h1>Own your AI.<br /><em>Grow it<br className="hero-line" /> together.</em></h1>
        <p>AI people can own. AI businesses can build on. AI that gets better through the people who contribute to it.</p>
        <p className="vision-intro">NeuroShard is building a living, decentralized intelligence: one open model, distributed across machines, improved through verified learning.</p>
        <div className="native-actions"><Link className="native-button" to="/network#join">Join the network <ArrowRight size={17} /></Link><Link className="native-button secondary" to="/network">See it live <ArrowRight size={16} /></Link></div>
        <p className="vision-live"><span className="vision-signal" /> Live now: an open test network where anyone can run a validator, host a shard, audit or train — and the network grew a better model by itself.</p>
        <div className="vision-hero-foot"><span>OPEN SOURCE</span><span>SHARDED COMPUTE</span><span>NATIVE CONSENSUS</span></div>
      </div>
      <SharedModel />
    </section>

    <section className="vision-thesis native-wrap" id="vision">
      <div className="native-eyebrow">THE AMBITION</div>
      <h2>The next great model<br />should belong to <em>all of us.</em></h2>
      <div><p>A shared intelligence that learns from new data, preserves useful capabilities, and expands as people contribute reliable compute.</p><p>Each machine holds a piece. Each accepted contribution moves the model forward. People and organizations build on a common foundation, with the freedom to operate their own infrastructure.</p><Link className="native-text-link" to="/protocol">Explore the architecture <ArrowRight size={16} /></Link></div>
    </section>

    <section className="vision-audiences native-wrap">
      <div className="section-heading"><div><div className="native-eyebrow">WHAT WE’RE BUILDING</div><h2>Your part in a bigger intelligence.</h2></div><p>One open foundation. Different ways to put it to work.</p></div>
      <div className="audience-grid">
        <article><Cpu size={26} /><span className="card-kicker">FOR PEOPLE</span><h3>Put your hardware<br />to work.</h3><p>Contribute compute to training, verification, and serving. Earn NEURO for accepted work and use it to access the network.</p><Link className="native-text-link" to="/network#join">Run a node <ArrowRight size={16} /></Link></article>
        <article className="audience-featured"><Layers size={26} /><span className="card-kicker">FOR TEAMS</span><h3>Your AI.<br />Your infrastructure.</h3><p>Our product direction: run AI on machines you control, connect more hardware as your needs grow, and develop capabilities for your work.</p><Link className="native-text-link" to="/teams">See the direction for teams <ArrowRight size={16} /></Link></article>
        <article><Globe2 size={26} /><span className="card-kicker">FOR BUILDERS</span><h3>Build on<br />an open foundation.</h3><p>Create applications, compatible hardware, and tools for a shared AI network. Help shape how useful contributions are learned, verified, and rewarded.</p><Link className="native-text-link" to="/build">Build with NeuroShard <ArrowRight size={16} /></Link></article>
      </div>
    </section>

    <section className="vision-growth native-wrap">
      <div><div className="native-eyebrow">A NETWORK THAT CAN GROW</div><h2>Connect capacity.<br />Create possibility.</h2><p>More machines create room for more users, more resilient service, and more useful learning. The network’s job is to turn that capacity into intelligence.</p><p className="growth-qualification">Hardware adds capacity. Training and evaluation establish improvement. Speed depends on the workload and the links between machines.</p></div>
      <ol className="growth-steps">
        <li><span>01</span><div><h3>Share the model</h3><p>Distribute model shards across connected machines so one device does not have to hold the whole model.</p></div></li>
        <li><span>02</span><div><h3>Learn new capabilities</h3><p>Train on admitted data. Check new answers and preserve the capabilities that already work.</p></div></li>
        <li><span>03</span><div><h3>Expand with purpose</h3><p>Add serving capacity, replicas, or model capacity where measured demand and quality justify it.</p></div></li>
      </ol>
    </section>

    <section className="vision-evidence native-wrap">
      <div className="section-heading"><div><div className="native-eyebrow">THE FOUNDATION EXISTS</div><h2>Built in code.<br />Backed by evidence.</h2></div><p>Working research, with the results open to inspection.</p></div>
      <div className="evidence-grid">
        <a href={EVIDENCE}><Check size={20} /><h3>Three admitted learning cohorts</h3><p>Measured specialist answers improved while previously correct tested answers were preserved.</p><span>Read the learning results <ExternalLink size={13} /></span></a>
        <a href={`${SOURCE}/blob/main/docs/NETWORK_GROWTH.md`}><Network size={20} /><h3>A network that improved itself</h3><p>Usage funded training; owners verified the data, reproduced the test and voted; every node switched. The new module answers 294 of 452 real requests, against 214 for the base model.</p><span>Read how it grew <ExternalLink size={13} /></span></a>
        <a href={`${SOURCE}/blob/main/docs/NATIVE_EXPERT_LIVE_RESULT.md`}><ShieldCheck size={20} /><h3>Native rewards and payments</h3><p>Verified training, a separate quality decision, and inference paid with earned NEURO.</p><span>Follow the complete lifecycle <ExternalLink size={13} /></span></a>
      </div>
      <p className="evidence-scope">The live network is an open test network: its tokens have no value, and most of its nodes are still run by the project. <Link to="/network">See exactly what works and what doesn’t yet →</Link></p>
    </section>

    <section className="vision-invitation native-wrap"><div className="native-eyebrow">HELP BUILD WHAT COMES NEXT</div><h2>The network starts<br />with people like you.</h2><p>Bring a machine. Bring a use case. Bring a new idea.<br />Help build AI that we can own and improve together.</p><div className="native-actions"><Link className="native-button" to="/network#join">Join the network <ArrowRight size={17} /></Link><a className="native-button secondary" href={SOURCE}>Explore the source <ExternalLink size={16} /></a></div></section>
  </div>;
}

export function Teams() {
  return <div className="vision-subpage native-wrap">
    <div className="native-eyebrow">NEUROSHARD FOR TEAMS · PRODUCT DIRECTION</div>
    <h1>Your intelligence.<br /><em>Your infrastructure.</em></h1>
    <p className="vision-lede">Build AI around your organization. Run it on hardware you control. Expand its capacity as your team and ambitions grow.</p>
    <div className="native-actions"><Link className="native-button" to="/build?role=teams">Build with us <ArrowRight size={17} /></Link><a className="native-button secondary" href={EVIDENCE}>See the foundation <ExternalLink size={16} /></a></div>
    <div className="teams-statement"><span className="card-kicker">THE PRODUCT WE ARE BUILDING</span><p>An expandable AI system, running across your machines, with a path to participate in a shared learning network.</p></div>
    <div className="teams-grid">
      <article><Cpu /><h2>Run where you choose.</h2><p>Bring AI into your own infrastructure. Our local product direction keeps business workloads within a group of machines you approve.</p><span>Planned: local deployment and private workload controls</span></article>
      <article><Layers /><h2>Connect more capacity.</h2><p>Combine compatible machines to host model shards, serve more requests, and provide redundancy. Expand around your actual workload.</p><span>Demonstrated: sharded execution · Product integration in development</span></article>
      <article><ShieldCheck /><h2>Improve with evidence.</h2><p>Develop specialized capabilities from approved material. Measure new performance and retention before replacing the answering system your team uses.</p><span>Demonstrated: bounded specialist learning and admission</span></article>
      <article><Globe2 /><h2>Contribute on your terms.</h2><p>The intended connection to the public network lets you allocate spare resources to approved public work while keeping private workloads inside your organization.</p><span>Planned: separation of private workloads and public contributions</span></article>
    </div>
    <section className="teams-path"><div><div className="native-eyebrow">BUILD THE FIRST DEPLOYMENTS</div><h2>Shape it around<br />real work.</h2></div><div><p>We’re inviting teams, AI infrastructure providers, and hardware builders to develop the first supported installations with us.</p><p>The starting point is a scoped technical collaboration: an agreed workload, supported hardware, reproducible deployment, and measured quality, capacity, recovery, and cost.</p><p className="evidence-scope">The operated GPU alpha closed on September 20, 2026. Its source and evidence remain available; its prompts and responses were public. Supported private installations remain development work.</p><Link className="native-text-link" to="/build?role=teams">Discuss what you want to build <ArrowRight size={16} /></Link></div></section>
  </div>;
}

export function GetInvolved() {
  return <div className="vision-subpage native-wrap involvement-page">
    <div className="native-eyebrow">BUILD WITH NEUROSHARD</div>
    <h1>A shared future.<br /><em>A place for you.</em></h1>
    <p className="vision-lede">We’re bringing together the people, hardware, and ideas to build a living, decentralized AI. Choose where you want to contribute.</p>
    <div className="involvement-grid">
      <article><span className="card-kicker">TEAMS & HARDWARE PARTNERS</span><h2>Build the first<br />deployments.</h2><p>Help turn sharded AI into a useful installation for real work. Bring a workload, your hardware requirements, and what successful expansion would look like.</p><a className="native-button" href={CONTACT}>Talk to the team <ArrowRight size={15} /></a><small><a href="mailto:info@neuroshard.com">info@neuroshard.com</a> · Start with a non-confidential overview.</small></article>
      <article><span className="card-kicker">OPERATORS & CONTRIBUTORS</span><h2>Put the network<br />to work.</h2><p>Run the published software, reproduce the results, and help exercise participation across independently controlled machines.</p><Link className="native-button secondary" to="/network#join">Join in one command <ArrowRight size={15} /></Link><small>Validator, owner, auditor or contributor. Roles, earnings and risks are on the network page.</small></article>
      <article><span className="card-kicker">ENGINEERS & RESEARCHERS</span><h2>Push the<br />architecture forward.</h2><p>Work on sharding, useful learning, verification, routing, and resilient operation. The implementation and evidence are open.</p><a className="native-button secondary" href={`${SOURCE}/blob/main/CONTRIBUTING.md`}>Start contributing <ExternalLink size={15} /></a><small>Apache 2.0 · Follow the repository’s contribution guide.</small></article>
    </div>
    <section className="involvement-note"><h2>Build a network.<br />Build a business.</h2><p>Our commercial direction is supported AI installations, compatible hardware, and managed services around an open protocol. The community can run the software and build its own products.</p></section>
  </div>;
}
