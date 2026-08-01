// Pre-renders the onym-system contract documents into static pages under
// site/contracts/, and regenerates site/sitemap.xml. Content is fetched at
// the pinned commits declared in tools/docs.mjs, so builds are reproducible
// and the deployed site does not depend on GitHub at visit time.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import { REPO, REFS, DOCS, SITE_ORIGIN, parseFrontmatter, headingId, resolveMdHref } from './docs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const OUT = path.join(SITE, 'contracts');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderDoc(docPath, markdown) {
  const md = new MarkdownIt({ html: false, linkify: true });

  // route relative .md links through the site; leave the rest alone
  const defaultLink = md.renderer.rules.link_open ||
    ((tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts));
  md.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
    const href = tokens[idx].attrGet('href');
    const resolved = href && resolveMdHref(href, docPath);
    if (resolved) tokens[idx].attrSet('href', resolved);
    return defaultLink(tokens, idx, opts, env, self);
  };

  // GitHub-style ids on headings, so intra-document links keep working
  md.core.ruler.push('heading_ids', state => {
    for (let i = 0; i < state.tokens.length; i++) {
      const t = state.tokens[i];
      if (t.type === 'heading_open' && state.tokens[i + 1]?.type === 'inline') {
        t.attrSet('id', headingId(state.tokens[i + 1].content));
      }
    }
  });

  // tables scroll inside their own container
  md.renderer.rules.table_open = () => '<div class="tscroll"><table>';
  md.renderer.rules.table_close = () => '</table></div>';

  // header cells carry an explicit scope (WCAG H63)
  md.renderer.rules.th_open = (tokens, idx, opts, env, self) => {
    tokens[idx].attrSet('scope', 'col');
    return self.renderToken(tokens, idx, opts);
  };

  return md.render(markdown);
}

export function pageHtml(docPath, meta, entry, bodyHtml, title) {
  const depth = docPath.split('/').length - 1;
  const up = '../'.repeat(depth + 1); // out of contracts/ plus subdirs
  const sha = REFS[entry.ref];
  const github = `https://github.com/${REPO}/blob/${sha}/${docPath}`;
  const latest = `https://github.com/${REPO}/blob/${entry.ref}/${docPath}`;
  const urlPath = '/contracts/' + docPath.replace(/\.md$/, '.html');

  const chips = [];
  if (meta.status) chips.push(`<span class="tag">${esc(meta.status)}</span>`);
  if (entry.review) chips.push('<span class="tag">proposal — in review</span>');
  if (meta.date) chips.push(`<span class="tag">${esc(meta.date)}</span>`);
  if (meta.proposed) chips.push(`<span class="mono" style="font-size:11px">proposed by ${esc(meta.proposed)}</span>`);
  chips.push(`<a class="mono" style="font-size:11px" href="${github}">source on GitHub →</a>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Onym Foundation</title>
<meta name="description" content="${esc(title)} — an open, technology-neutral contract document from the Onym system repository, rendered for reading.">
<link rel="canonical" href="${SITE_ORIGIN}${urlPath}">
<meta property="og:title" content="${esc(title)} — Onym Foundation">
<meta property="og:description" content="Every seat is defined by an open contract. Read it here.">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE_ORIGIN}${urlPath}">
<meta property="og:image" content="${SITE_ORIGIN}/assets/og-card.png">
<meta name="theme-color" content="#f5f5f7">
<link rel="icon" type="image/png" sizes="32x32" href="${up}assets/favicon-32.png">
<link rel="apple-touch-icon" href="${up}assets/apple-touch-icon.png">
<link rel="stylesheet" href="${up}styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<nav class="site" aria-label="Main">
  <div class="wrap navbar">
    <a class="brand" href="${up}index.html"><img src="${up}assets/icon-nav.png" alt="" width="21" height="21">onym<span>.foundation</span></a>
    <span class="chip"><span class="dot"></span>In formation — Estonian MTÜ · founding round open</span>
    <button class="menubtn" type="button" aria-expanded="false" aria-controls="sitemenu">Menu</button>
    <div class="navlinks" id="sitemenu">
      <a href="${up}seats.html" aria-current="page">Seats</a>
      <a href="${up}governance.html">Governance</a>
      <a href="${up}transparency.html">Transparency</a>
      <a class="pill accent" href="${up}sponsors.html">Become a founding sponsor</a>
    </div>
  </div>
</nav>
<main id="main">
  <article class="wrap docpage">
    <p class="mono docback"><a href="${up}index.html">← Foundation</a> · <a href="${up}seats.html">All seats</a></p>
    <header>
      ${entry.seat ? `<p class="eyebrow" style="margin-bottom:12px">${esc(entry.seat)}</p>` : ''}
      <div class="badges">${chips.join('')}</div>
    </header>
    <div class="doc">
${bodyHtml}
    </div>
    <p class="fnote">This document is maintained in the public
      <a href="https://github.com/${REPO}">onym-system repository</a> and rendered here from a pinned commit.
      The repository is the authoritative source — <a href="${latest}">latest version on ${esc(entry.ref)} →</a></p>
  </article>
</main>
<footer>
  <div class="wrap">
    <div class="fgroups">
      <div><span class="eyebrow">Foundation</span><a href="${up}governance.html">Governance</a><a href="${up}transparency.html">Transparency</a><a href="mailto:lead@onym.app">Contact</a></div>
      <div><span class="eyebrow">Network</span><a href="https://onym.app">onym.app</a><a href="${up}seats.html">Seats</a><a href="${up}contracts/WHITEPAPER.html">Whitepaper</a><a href="https://github.com/${REPO}">Source repository</a></div>
      <div><span class="eyebrow">Take a seat</span><a href="mailto:lead@onym.app?subject=Seat%20interest" data-seat="&lt;tell us which&gt;">Register interest — lead@onym.app</a></div>
      <div><span class="eyebrow">Legal</span><a href="${up}governance.html#status">Status notice</a><a href="${up}governance.html#legal">Imprint</a></div>
    </div>
    <p class="legalline">The Onym Foundation is being formed as an MTÜ under Estonian law. No legal entity exists yet.</p>
  </div>
</footer>
<script src="${up}main.js"></script>
</body>
</html>
`;
}

function sitemap(docPaths) {
  const pages = ['', 'seats.html', 'governance.html', 'transparency.html', 'sponsors.html', 'pledge.html',
    ...docPaths.map(p => 'contracts/' + p.replace(/\.md$/, '.html'))];
  const rows = pages.map(p => `  <url><loc>${SITE_ORIGIN}/${p}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

async function fetchDoc(docPath, entry) {
  const sha = REFS[entry.ref];
  const url = `https://raw.githubusercontent.com/${REPO}/${sha}/${docPath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  return res.text();
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  let n = 0;
  for (const [docPath, entry] of Object.entries(DOCS)) {
    const raw = await fetchDoc(docPath, entry);
    const { meta, body } = parseFrontmatter(raw);
    const html = renderDoc(docPath, body);
    const title = (body.match(/^#\s+(.+)$/m) || [, docPath])[1].trim();
    const outFile = path.join(OUT, docPath.replace(/\.md$/, '.html'));
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, pageHtml(docPath, meta, entry, html, title));
    n++;
    process.stdout.write(`\r${n}/${Object.keys(DOCS).length} ${docPath}          `);
  }
  fs.writeFileSync(path.join(SITE, 'sitemap.xml'), sitemap(Object.keys(DOCS)));
  console.log(`\nbuilt ${n} contract pages + sitemap.xml`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e); process.exit(1); });
}
