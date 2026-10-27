import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { asset } from './api';
import './native.css';
import Home from './Home';
import Help from './Help';
import { COMMUNITY_URL, DOCS, SOURCE } from './release';

function RoutePosition() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'An open AI that improves itself', '/help': 'Help' };
    document.title = `${titles[pathname] || 'Open, shared intelligence'} | NeuroShard`;
    const frame = requestAnimationFrame(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}

// Addresses from earlier versions of the site, and where each now leads.
const MOVED: [string, string][] = [
  ...['/network', '/assistant', '/run', '/explore', '/download'].map(p => [p, '/#network'] as [string, string]),
  ['/join', '/#join'],
  ...['/support', '/troubleshooting'].map(p => [p, '/help'] as [string, string]),
  ...['/start', '/try'].map(p => [p, '/#try'] as [string, string]),
  // The 0.4.0 baseline testnet pages are retired; its source and results stay in the main repository.
  ...['/vision', '/teams', '/build', '/protocol', '/whitepaper', '/baseline', '/baseline/join', '/chat', '/ledger', '/model']
    .map(p => [p, '/'] as [string, string]),
];

export default function NativeApp() {
  const [menu, setMenu] = useState(false);
  return <div className="native-app"><RoutePosition /><a className="skip-to-content" href="#main">Skip to content</a>
    <header className="native-header"><Link to="/" className="native-brand" onClick={() => setMenu(false)}><span className="brand-mark" aria-hidden="true">N</span><span>neuroshard</span></Link><button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={menu} aria-controls="primary-navigation" onClick={() => setMenu(!menu)}>{menu ? 'close' : 'menu'}</button><nav id="primary-navigation" className={menu ? 'open' : ''} onClick={() => setMenu(false)}><Link to="/#how">How it works</Link><Link to="/#join">Run a node</Link><Link to="/#faq">FAQ</Link><Link to="/help">Help</Link>{COMMUNITY_URL && <a href={COMMUNITY_URL}>Discord</a>}<a href={SOURCE}>GitHub</a><Link className="nav-join" to="/#try">Try it</Link></nav></header>
    <main id="main"><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/help" element={<Help />} />
      {MOVED.map(([from, to]) => <Route key={from} path={from} element={<Navigate to={to} replace />} />)}
      <Route path="*" element={<section className="native-wrap native-page"><h1>Page not found.</h1><Link className="native-button" to="/">Go to the homepage →</Link></section>} />
    </Routes></main>
    <footer className="site-footer">
      <div className="footer-brand"><strong><span className="brand-mark" aria-hidden="true">N</span>neuroshard</strong><span>Open source · Apache 2.0 · an invited pilot</span></div>
      <nav aria-label="Footer">
        <Link to="/help">Help</Link>
        <a href={`${DOCS}/OPERATORS.md`}>Operator guide</a>
        <a href={`${DOCS}/NETWORK_GROWTH.md`}>How it grows</a>
        <a href={`${DOCS}/DECENTRALIZATION.md`}>Decentralization</a>
        <a href={asset('/papers/FINE2026_neuroshard_short.pdf')}>Paper</a>
        <a href={SOURCE}>Source code</a>
        {COMMUNITY_URL && <a href={COMMUNITY_URL}>Discord</a>}
        <a href="mailto:info@neuroshard.com">Contact</a>
      </nav>
    </footer></div>;
}
