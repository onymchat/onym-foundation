// Checks every internal href/src in site/**/*.html: the target file must
// exist, and fragment links must point at a real id in the target document.
// External URLs are not fetched (that's a deploy-time concern, not a
// correctness gate); mailto: and http(s): are skipped.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');

const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(SITE);

const ids = new Map(); // file → Set of ids
function idsOf(file) {
  if (!ids.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])));
  }
  return ids.get(file);
}

let errors = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  // the deployed CSP has no unsafe-inline: any style attribute is dead weight
  const inline = html.match(/\sstyle="/g);
  if (inline) {
    console.error(`${path.relative(SITE, file)} → ${inline.length} inline style attribute(s); CSP blocks these`);
    errors++;
  }
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|data:)/.test(ref)) continue;
    const [target, fragment] = ref.split('#');
    let targetFile;
    if (target === '') {
      targetFile = file;
    } else {
      const base = target.startsWith('/') ? path.join(SITE, target) : path.resolve(path.dirname(file), target);
      targetFile = base;
    }
    if (!fs.existsSync(targetFile)) {
      console.error(`${path.relative(SITE, file)} → broken: ${ref}`);
      errors++;
      continue;
    }
    if (fragment && targetFile.endsWith('.html') && !idsOf(targetFile).has(fragment)) {
      console.error(`${path.relative(SITE, file)} → missing anchor: ${ref}`);
      errors++;
    }
  }
}

console.log(`${htmlFiles.length} pages checked${errors ? `, ${errors} broken link(s)` : ', all internal links resolve'}`);
process.exit(errors ? 1 : 0);
