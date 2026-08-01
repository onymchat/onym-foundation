import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, headingId, resolveMdHref, DOCS, REFS } from '../tools/docs.mjs';
import { renderDoc } from '../tools/build-contracts.mjs';

test('frontmatter: parses status/proposed/date and strips the block', () => {
  const { meta, body } = parseFrontmatter('---\nstatus: draft\nproposed: X & @y\ndate: 01.08.2026\n---\n\n# Title\n');
  assert.equal(meta.status, 'draft');
  assert.equal(meta.proposed, 'X & @y');
  assert.equal(meta.date, '01.08.2026');
  assert.ok(body.startsWith('\n# Title'));
});

test('frontmatter: document without a block is returned untouched', () => {
  const { meta, body } = parseFrontmatter('# Just a title\n');
  assert.deepEqual(meta, {});
  assert.equal(body, '# Just a title\n');
});

test('headingId matches GitHub-style slugs', () => {
  assert.equal(headingId('1. Decision'), '1-decision');
  assert.equal(headingId('Security and privacy invariants'), 'security-and-privacy-invariants');
});

test('resolveMdHref: same-directory doc link becomes a local page', () => {
  assert.equal(resolveMdHref('UI-Message-Nostr.md', 'message/UI-Message.md'),
    '../message/UI-Message-Nostr.html');
});

test('resolveMdHref: parent-relative link with anchor', () => {
  const r = resolveMdHref('../WHITEPAPER.md#16-offers', 'charity/Charity.md');
  assert.equal(r, '../WHITEPAPER.html#16-offers');
});

test('resolveMdHref: doc outside the bundle falls back to pinned GitHub URL', () => {
  const r = resolveMdHref('nonexistent/Thing.md', 'message/UI-Message.md');
  assert.ok(r.startsWith('https://github.com/'));
  assert.ok(r.includes(REFS.main));
});

test('resolveMdHref: external and fragment links are left untouched', () => {
  assert.equal(resolveMdHref('https://onym.app', 'README.md'), null);
  assert.equal(resolveMdHref('#decision', 'README.md'), null);
  assert.equal(resolveMdHref('mailto:lead@onym.app', 'README.md'), null);
});

test('render: <https://…> autolinks become clickable anchors', () => {
  const html = renderDoc('README.md', 'See <https://example.com/x> for details.\n');
  assert.match(html, /<a href="https:\/\/example\.com\/x">/);
});

test('render: bare URLs are linkified', () => {
  const html = renderDoc('README.md', 'See https://example.com/y for details.\n');
  assert.match(html, /<a href="https:\/\/example\.com\/y">/);
});

test('render: mixed ordered list inside unordered list nests correctly', () => {
  const html = renderDoc('README.md', '- outer\n  1. first\n  2. second\n- next\n');
  assert.match(html, /<ul>[\s\S]*<ol>[\s\S]*<li>first<\/li>[\s\S]*<\/ol>[\s\S]*<\/ul>/);
});

test('render: raw HTML in markdown is escaped, not executed', () => {
  const html = renderDoc('README.md', 'A <script>alert(1)</script> placeholder <amount> here.\n');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;') || html.includes('&lt;amount&gt;'));
});

test('render: headings receive GitHub-style ids', () => {
  const html = renderDoc('README.md', '## 3. Why this boundary is necessary\n');
  assert.match(html, /<h2 id="3-why-this-boundary-is-necessary">/);
});

test('render: tables are wrapped in a scroll container', () => {
  const html = renderDoc('README.md', '| a | b |\n|---|---|\n| 1 | 2 |\n');
  assert.match(html, /<div class="tscroll"><table>/);
});

test('render: column alignment becomes classes, never inline styles', () => {
  const html = renderDoc('README.md', '| a | b | c |\n|--:|:-:|:--|\n| 1 | 2 | 3 |\n');
  assert.ok(!html.includes('style='), 'generated output must not carry style attributes (CSP)');
  assert.match(html, /<th[^>]*class="ta-r"/);
  assert.match(html, /<td class="ta-c">/);
  assert.match(html, /<td class="ta-l">/);
});

test('manifest: every doc ref has a pinned SHA', () => {
  for (const [p, e] of Object.entries(DOCS)) {
    assert.ok(REFS[e.ref], `${p} references unknown ref ${e.ref}`);
    assert.match(REFS[e.ref], /^[0-9a-f]{40}$/);
  }
});
