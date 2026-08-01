// Shared page chrome — head metadata, navigation, footer — used by
// tools/build-pages.mjs (the six handwritten pages + 404) and
// tools/build-contracts.mjs (the generated contract pages).
// Change nav/footer/head here, run `npm run build`, commit the output.

import { SITE_ORIGIN } from './docs.mjs';

// The Onym mark: a ring with two gaps, drawn with currentColor so it
// follows the theme (the old PNG was light-only).
export const MARK = `<svg class="mark" width="21" height="21" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3.4" stroke-dasharray="22.3 5.95 22.3 6" transform="rotate(24 12 12)"/></svg>`;

// `up` is the relative prefix to the site root: '' for root pages,
// '/' for pages addressed absolutely (404), '../../' inside contracts/.
export function head({ title, desc, path, up, ogType = 'website', ogDesc, noindex = false }) {
  const url = `${SITE_ORIGIN}/${path}`;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${ogDesc || desc}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_ORIGIN}/assets/og-card.png">`}
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f5f5f3">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f1115">
<link rel="icon" type="image/png" sizes="32x32" href="${up}assets/favicon-32.png">
<link rel="apple-touch-icon" href="${up}assets/apple-touch-icon.png">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${up}assets/fonts/InstrumentSans-Variable.woff2">
<script src="${up}theme.js"></script>
<link rel="stylesheet" href="${up}styles.css">`;
}

export function nav({ up, current }) {
  const cur = name => (current === name ? ' aria-current="page"' : '');
  return `<a class="skip" href="#main">Skip to content</a>
<nav class="site" aria-label="Main">
  <div class="wrap navbar">
    <a class="brand" href="${up}index.html">${MARK}<span class="wordmark">onym<span>.foundation</span></span></a>
    <div class="navlinks" id="sitemenu">
      <a href="${up}seats.html"${cur('seats')}>Seats</a>
      <a href="${up}governance.html"${cur('governance')}>Governance</a>
      <a href="${up}transparency.html"${cur('transparency')}>Transparency</a>
      <a class="pill accent" href="${up}sponsors.html"${cur('sponsors')}>Become a founding sponsor</a>
    </div>
    <div class="navctl">
      <button class="themebtn" type="button" aria-label="Color theme: system — activate to change">Auto</button>
      <button class="menubtn" type="button" aria-expanded="false" aria-controls="sitemenu">Menu</button>
    </div>
  </div>
</nav>`;
}

export function footer({ up, simple = false }) {
  const groups = simple ? '' : `    <div class="fgroups">
      <div><span class="eyebrow">Foundation</span><a href="${up}governance.html">Governance</a><a href="${up}transparency.html">Transparency</a><a href="mailto:lead@onym.app">Contact</a></div>
      <div><span class="eyebrow">Network</span><a href="https://onym.app">onym.app</a><a href="${up}seats.html">Seats</a><a href="${up}contracts/WHITEPAPER.html">Whitepaper</a><a href="https://github.com/onymchat/onym-system">Source repository</a></div>
      <div><span class="eyebrow">Take a seat</span><a href="mailto:lead@onym.app?subject=Seat%20interest" data-seat="&lt;tell us which&gt;">Register interest — lead@onym.app</a></div>
      <div><span class="eyebrow">Legal</span><a href="${up}governance.html#status">Status notice</a><a href="${up}governance.html#legal">Imprint</a></div>
    </div>
`;
  return `<footer>
  <div class="wrap">
${groups}    <p class="legalline${simple ? ' bare' : ''}">The Onym Foundation is being formed as an MTÜ under Estonian law. No legal entity exists yet.</p>
  </div>
</footer>
<script src="${up}main.js"></script>`;
}

export function page({ meta, content }) {
  const up = meta.root ? '/' : (meta.up ?? '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head({ ...meta, up })}
</head>
<body>
${nav({ up, current: meta.current ?? null })}
${content}
${footer({ up, simple: meta.simpleFooter })}
</body>
</html>
`;
}
