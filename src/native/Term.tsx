import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/** One line of a terminal session. `note` is a plain-English margin note explaining it. */
export type Line = { k?: '$' | 'you' | 'ai' | 'out' | 'warn' | 'dim'; t: string; note?: string };

/** A command the reader can copy, shown the way they will type it. */
export function Command({ text, label = 'Copy command' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => void navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); });
  return <div className="cmd">
    <span className="cmd-prompt" aria-hidden="true">$</span>
    <code>{text}</code>
    <button type="button" aria-label={label} onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
  </div>;
}

/** Plays the lines once the terminal scrolls into view; without motion (or JS) every line is simply there. */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'armed' | 'play'>('idle');
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < innerHeight * 0.85) return;  // already on screen: no need to animate
    setState('armed');
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setState('play'); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, state };
}

/** A terminal window. Margin notes sit beside each line on wide screens and under it on phones. */
export function Terminal({ title = 'you@linux: ~', lines, label, children }: { title?: string; lines: Line[]; label: string; children?: ReactNode }) {
  const { ref, state } = useReveal();
  const notes = lines.some(l => l.note);
  return <figure className={`term${notes ? ' has-notes' : ''}`} data-reveal={state} ref={ref} aria-label={label}>
    <figcaption className="term-bar"><span className="term-mark" aria-hidden="true">N</span><span>{title}</span></figcaption>
    <div className="term-body">
      {lines.map((l, i) => <div className={`ln ln-${l.k === "$" ? "cmd" : l.k || "out"}`} key={i} style={{ '--i': i } as CSSProperties}>
        <span className="ln-text">
          {l.k === '$' && <span className="p" aria-hidden="true">$ </span>}
          {l.k === 'you' && <span className="p">you&gt; </span>}
          {l.t}
        </span>
        {l.note && <span className="ln-note"><span aria-hidden="true"># </span>{l.note}</span>}
      </div>)}
      <div className="ln ln-cursor" style={{ '--i': lines.length } as CSSProperties} aria-hidden="true"><span className="p">$ </span><span className="cursor" /></div>
    </div>
    {children}
  </figure>;
}

/** "If it says …, see …": links a message straight to its fix on the help page. */
export function IfYouSee({ items }: { items: [string, string][] }) {
  return <div className="if-see"><span className="if-see-label">If it says</span>
    <ul>{items.map(([says, id]) => <li key={id}><Link to={`/help#${id}`}><code>{says}</code><span>what to do →</span></Link></li>)}</ul>
  </div>;
}
