// Serve dist/ with exactly the production security headers, so the tests run under the real Content-Security-Policy.
// Usage: node scripts/serve-prod.mjs PORT
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../dist/', import.meta.url).pathname;
const headers = {};
for (const line of readFileSync(new URL('../deploy/security-headers.conf', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^add_header\s+(\S+)\s+"?(.*?)"?\s+always;$/);
  if (m) headers[m[1]] = m[2];
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml', '.pdf': 'application/pdf' };
createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, path);
  try { if (!statSync(file).isFile()) throw 0; } catch { file = join(ROOT, 'index.html'); }
  res.writeHead(200, { ...headers, 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(Number(process.argv[2] || 4173), '127.0.0.1');
