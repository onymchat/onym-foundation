// Renders pages/*.html (content + a leading <!--page {…}--> meta comment)
// into site/*.html, wrapping each in the shared chrome from partials.mjs.
// Edit pages/ and partials, never site/*.html directly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page } from './partials.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = path.join(ROOT, 'pages');
const SITE = path.join(ROOT, 'site');

let n = 0;
for (const file of fs.readdirSync(PAGES).filter(f => f.endsWith('.html')).sort()) {
  const src = fs.readFileSync(path.join(PAGES, file), 'utf8');
  const m = src.match(/^<!--page\s+({[\s\S]*?})\s*-->\n?/);
  if (!m) throw new Error(`${file}: missing <!--page {…}--> meta comment`);
  const meta = JSON.parse(m[1]);
  const content = src.slice(m[0].length).trimEnd();
  fs.writeFileSync(path.join(SITE, file), page({ meta, content }));
  n++;
}
console.log(`built ${n} pages from pages/`);
