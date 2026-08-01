# onym.foundation

Static website for the Onym Foundation — the institution being formed (as an
Estonian MTÜ) to fund audits, grants, conformance infrastructure, and a
permanent endowment for the [Onym network](https://onym.app) of independently
owned seats.

Everything served lives in `site/`. There is no framework and no runtime
dependency: plain HTML, one stylesheet, one small script.

## Layout

| Path | What it is |
|---|---|
| `pages/*.html` | **Page sources** (content + a `<!--page {…}-->` meta comment) — edit these |
| `tools/partials.mjs` | Shared head/nav/footer chrome used by both builders — edit nav/footer here |
| `site/*.html`, `site/contracts/**` | **Generated output** — never edit by hand; CI fails on drift |
| `site/styles.css` | The design system: semantic light/dark tokens, type scale, utilities |
| `site/theme.js`, `site/main.js` | Pre-paint theme application; menu, theme toggle, scroll reveal, mailto builders |
| `site/assets/fonts/` | Self-hosted Instrument Sans (variable) + IBM Plex Mono, with OFL licenses |
| `site/_headers` | Deployment headers (CSP without `unsafe-inline`, etc.) in Netlify/Cloudflare Pages format |
| `tools/docs.mjs` | Manifest of contract documents with **pinned commit SHAs** |
| `tools/build-pages.mjs`, `tools/build-contracts.mjs` | `npm run build` renders `site/` from `pages/` and the pinned docs + `sitemap.xml` |
| `tools/check-links.mjs` | Internal link and anchor checker |
| `tests/` | Unit tests (render/resolution) and browser tests (390px/1440px layout, mobile menu, fonts, dark mode, theme persistence, axe) |

The site has a system-aware dark theme with a manual Auto/Light/Dark control in
the navigation; the choice persists in `localStorage` and is applied by
`theme.js` before first paint. All colors flow through the semantic tokens at
the top of `styles.css` — style components through tokens, never with literal
colors.

## Preview locally

```sh
python3 -m http.server 8080 --directory site
# → http://localhost:8080
```

Any static file server works. After editing `pages/`, `tools/partials.mjs`,
or `tools/docs.mjs`, run `npm run build` and commit the regenerated `site/`
output together with the source change — CI fails if they drift.

## Update contract content

Contract pages are rendered from the public
[`onymchat/onym-system`](https://github.com/onymchat/onym-system) repository
at commits pinned in `tools/docs.mjs`. To pull newer content:

1. Update the SHA(s) in `REFS` (and add/remove entries in `DOCS` if documents
   moved — in-review proposals carry `review: true` and live on their PR
   branches until merged, then move to `main`).
2. `npm run build`
3. `npm test && npm run check:links && npm run check:html`
4. Commit the regenerated `site/contracts/` together with the manifest change.

## Tests and checks

```sh
npm test              # unit + browser tests (browser part needs Chrome; set CHROME_PATH to override)
npm run check:links   # every internal href/src and #anchor resolves
npm run check:html    # html-validate over all pages
```

CI runs all three plus a fresh contract build on every push.

## Deployment

Deploy the `site/` directory to any static host. On Netlify/Cloudflare Pages
the `_headers` file applies the security headers (CSP, Referrer-Policy,
X-Content-Type-Options, frame denial); on other hosts translate it into the
server config. The canonical origin is `https://onym.foundation`.

## Content notes

- The site's honesty constraints are deliberate: the Foundation does not yet
  exist, governance is labeled *proposed*, empty registers are shown as empty,
  and the pledge flow operates by countersigned email with nothing collected.
  Keep these properties when editing copy.
- The sponsor and pledge language (tiers, terms, conversion, lapse on failed
  formation), the fund/endowment policy (Founding Fund vs. reserves vs.
  permanent endowment; 5% distribution target, 7% exception), gift terms,
  the Investment Policy Statement, and tax treatment must be reviewed by
  Estonian legal/accounting counsel before the founding round opens for real
  money. The 5%/7% figures are proposed internal governance limits, not
  requirements of Estonian law.
