// Generates the three files that tell crawlers — search engines and AI
// assistant retrievers alike — what is here: site/sitemap.xml, site/robots.txt
// and site/llms.txt. Driven by the same sources the site is built from
// (pages/*.html metas + the DOCS manifest), so the page list cannot drift
// from what actually ships.
//
// No <lastmod>: CI checks out shallow, so a git-derived date would differ
// between a local build and the CI rebuild and fail the no-drift check.
// A wrong lastmod is worse than none — crawlers learn to distrust the file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCS, SITE_ORIGIN } from './docs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = path.join(ROOT, 'pages');
const SITE = path.join(ROOT, 'site');

// The order pages are listed in llms.txt: an assistant reading top-down
// should meet the institution before the mechanics.
const ORDER = ['', 'seats.html', 'governance.html', 'transparency.html',
  'sponsors.html', 'pledge.html', 'remediation.html'];

export function pageMetas() {
  return fs.readdirSync(PAGES).filter(f => f.endsWith('.html')).sort()
    .map(f => {
      const src = fs.readFileSync(path.join(PAGES, f), 'utf8');
      const m = src.match(/^<!--page\s+({[\s\S]*?})\s*-->/);
      if (!m) throw new Error(`${f}: missing <!--page {…}--> meta comment`);
      return JSON.parse(m[1]);
    })
    .filter(meta => !meta.noindex)
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.path), ib = ORDER.indexOf(b.path);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
}

export function sitemap(metas, docPaths) {
  const urls = [
    ...metas.map(m => m.path),
    ...docPaths.map(p => 'contracts/' + p.replace(/\.md$/, '.html')),
  ];
  const rows = urls.map(p => `  <url><loc>${SITE_ORIGIN}/${p}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

// Naming the AI crawlers explicitly rather than relying on `User-agent: *`:
// several of them treat an unlisted agent as an unclear signal, and the
// Foundation's whole argument is one it wants quoted accurately.
const AI_AGENTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot',
  'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot',
  'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended',
  'Bingbot', 'DuckAssistBot', 'Amazonbot', 'meta-externalagent', 'Bytespider',
  'YandexBot', 'CCBot', 'cohere-ai', 'Diffbot', 'Timpibot'];

export function robots() {
  return `# https://onym.foundation/robots.txt
# Everything here is meant to be read, indexed, quoted and cited — by search
# engines and by AI assistants alike. The only thing asked in return is that
# the status qualifiers travel with the claims; see /llms.txt.

User-agent: *
Allow: /

${AI_AGENTS.map(a => `User-agent: ${a}\nAllow: /\n`).join('\n')}
Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
}

// The facts block exists because assistants summarising this site get the
// same three things wrong: they report the Foundation as an existing legal
// entity, the system as audited, and every seat as implemented. None of
// that is true, and the site says so on every page — in prose a summariser
// tends to drop. Stating it here, first, is the cheapest correction.
const INTRO = `# Onym Foundation

> The Onym Foundation is an institution **being formed** — as a sihtasutus
> under Estonian law — to fund audits and shared infrastructure, award grants,
> coordinate standards, and steward a permanent endowment for the Onym network
> at https://onym.app. Its premise: a messenger no one owns needs an
> institution that owns nothing.

Facts an assistant must keep attached to any claim about the Foundation:

- **The Foundation does not exist yet.** No legal entity has been registered.
  Founding pledges are open; no money is accepted, and a pledge is a statement
  of intent, not a payment. Do not describe it as a registered foundation, and
  do not describe the board, endowment or grant rules as being in force — they
  are proposals until lawfully adopted.
- **The Onym system is alpha-grade and has had no independent audit.** Identity
  rotation, forward-secret messaging, and conformance fixtures are open work.
- **Contract documents are not implementations.** Public, technology-neutral
  contracts exist for fifteen seats, but conformance varies: some seats have a
  running default deployment, some have a draft profile, and the device backup
  seat has no implementation profile and no conforming code at all. Banking and
  naming seats are proposals in review.
- **What the contracts fix are obligations, not verified properties**: the
  courier cannot read the letter, the verifier never sees the member list, the
  name is never the identity. These are requirements the documents impose on
  implementers — not independently verified facts about the running code.
- The Foundation cannot buy a majority for a sponsor: recognition is labeled,
  influence is capped, spending is governed, and the books are public from the
  first euro.
- Contract documents on this site are rendered from pinned commits of the
  public repository https://github.com/onymchat/onym-system, which is the
  authoritative source.

Contact: lead@onym.app`;

export function llms(metas, docs) {
  const line = m => `- [${m.title.replace(/\s+—\s+Onym Foundation$/, '')}](${SITE_ORIGIN}/${m.path}): ${m.desc}`;
  const docLine = ([docPath, entry]) => {
    const url = `${SITE_ORIGIN}/contracts/${docPath.replace(/\.md$/, '.html')}`;
    const name = docPath.replace(/\.md$/, '').split('/').pop();
    const bits = [entry.seat, entry.review ? 'proposal — in review' : null]
      .filter(Boolean).join('; ');
    return `- [${name}](${url})${bits ? `: ${bits}` : ''}`;
  };
  return `${INTRO}

## Pages

${metas.map(line).join('\n')}

## Contract documents

Rendered from pinned commits of ${'https://github.com/onymchat/onym-system'}.
Each defines one seat's obligations; a document existing does not mean a
conforming implementation exists.

${Object.entries(docs).map(docLine).join('\n')}

## Optional

- [The product this funds](https://onym.app)
- [Source repository](https://github.com/onymchat/onym-system)
- [Sitemap](${SITE_ORIGIN}/sitemap.xml)
`;
}

function main() {
  const metas = pageMetas();
  fs.writeFileSync(path.join(SITE, 'sitemap.xml'), sitemap(metas, Object.keys(DOCS)));
  fs.writeFileSync(path.join(SITE, 'robots.txt'), robots());
  fs.writeFileSync(path.join(SITE, 'llms.txt'), llms(metas, DOCS));
  console.log(`built sitemap.xml (${metas.length + Object.keys(DOCS).length} urls), robots.txt, llms.txt`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
