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
| `site/*.html` | The six pages: home, seats, governance, transparency, sponsors, pledge (+ `404.html`) |
| `site/contracts/**` | Pre-rendered seat contract documents — **generated, do not edit by hand** |
| `site/styles.css`, `site/main.js` | The design system and the only script (mobile nav, scroll reveal, mailto builders) |
| `site/_headers` | Deployment headers (CSP etc.) in Netlify/Cloudflare Pages format |
| `tools/docs.mjs` | Manifest of contract documents with **pinned commit SHAs** |
| `tools/build-contracts.mjs` | Fetches the pinned docs and renders `site/contracts/` + `sitemap.xml` |
| `tools/check-links.mjs` | Internal link and anchor checker |
| `tests/` | Unit tests (render/resolution) and browser tests (390px/1440px layout, mobile menu, axe accessibility) |

## Preview locally

```sh
python3 -m http.server 8080 --directory site
# → http://localhost:8080
```

Any static file server works; no build step is needed to preview pages you
edit by hand.

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
  formation) must be reviewed by Estonian counsel before the founding round
  opens for real money.
