import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, headingId, resolveMdHref, DOCS, DOCUMENT_NOTICES, REFS } from '../tools/docs.mjs';
import { renderDoc, pageHtml } from '../tools/build-contracts.mjs';
import { FOUNDATION_POLICY, renderPolicyTokens, validateFoundationPolicy } from '../tools/foundation-policy.mjs';

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

test('foundation policy: structural and anti-capture invariants hold', () => {
  const p = FOUNDATION_POLICY;
  assert.equal(p.status, 'proposed_non_operational');
  assert.equal(p.board.sponsorSeats + p.board.ecosystemSeats + p.board.publicInterestSeats,
    p.board.totalSeats);
  assert.ok(p.board.sponsorSeats < Math.ceil(p.board.totalSeats / 2));
  assert.ok(p.board.exceptionalApprovalVotes > p.board.ordinaryApprovalVotes);
  assert.ok(p.board.ordinaryMinimumEcosystemVotes + p.board.ordinaryMinimumPublicInterestVotes >=
    p.board.ordinaryMinimumNonSponsorVotes);
  assert.ok(p.board.exceptionalMinimumEcosystemVotes + p.board.exceptionalMinimumPublicInterestVotes >=
    p.board.exceptionalMinimumNonSponsorVotes);
  assert.ok(p.endowment.exceptionalMaximumBasisPoints > p.endowment.ordinaryMaximumBasisPoints);

  const invalid = structuredClone(p);
  invalid.board.sponsorSeats = 5;
  invalid.board.ecosystemSeats = 1;
  assert.throws(() => validateFoundationPolicy(invalid), /majority/);
});

test('foundation policy: page tokens render and unknown tokens fail', () => {
  assert.equal(renderPolicyTokens('ordinary={{policy.endowment.ordinaryMaximumPercent}}%'), 'ordinary=5%');
  assert.equal(renderPolicyTokens('votes={{policy.board.exceptionalApprovalVotes}}/{{policy.board.totalSeats}}'), 'votes=7/9');
  assert.throws(() => renderPolicyTokens('{{policy.no.such.value}}'), /unknown/);
});

test('policy: public pages use the one 5% / 7% rule and stronger vote threshold', () => {
  const files = [];
  for (const dir of ['pages', 'site']) {
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.html')) files.push(path.join(dir, f)); // site/contracts/ is upstream-pinned and excluded
    }
  }
  // Upstream-pinned contract pages carry a consistency warning and are
  // excluded. Foundation-authored pages may not reintroduce either the old
  // 4% rule or the ambiguous two-thirds exceptional threshold.
  const banned = [/capped at 4%/i, /4% of trailing/i, /the 4% rule/i,
    /two-thirds vote of disinterested directors/i];
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    if (f.startsWith('site/')) assert.ok(!html.includes('{{policy.'), `${f}: unresolved policy token`);
    for (const re of banned) {
      assert.ok(!re.test(html), `${f}: conflicting governance language matched ${re}`);
    }
  }
  // The generated governance page must state every material constant.
  const gov = fs.readFileSync('site/governance.html', 'utf8');
  assert.ok(gov.includes('capped at 5% of the average value measured at the previous 12 quarter-ends'),
    'governance page must state the 5% ordinary ceiling');
  assert.ok(gov.includes('requires 7 of 9 affirmative votes including at least 4 non-sponsor directors'),
    'governance page must state the fixed exceptional vote and cross-class threshold');
  assert.ok(gov.includes('at least 2 Ecosystem and 2 Public-Interest Directors'),
    'governance page must require support from both non-sponsor classes');
  assert.ok(gov.includes('may not occur in more than 2 consecutive financial years'),
    'governance page must state the consecutive-years limit');
});

test('rendered upstream drafts surface known consistency notices', () => {
  for (const docPath of ['WHITEPAPER.md', 'sponsor/Sponsor-Onym.md',
    'arbitration/Arbitration.md', 'interface/Interface.md']) {
    assert.ok(DOCUMENT_NOTICES[docPath], `${docPath} must have a notice`);
    const html = pageHtml(docPath, { status: 'draft' }, DOCS[docPath], '<p>body</p>', 'Title');
    assert.match(html, /Consistency notice:/);
    assert.match(html, /remediation\.html/);
  }
});

test('manifest: every doc ref has a pinned SHA', () => {
  for (const [p, e] of Object.entries(DOCS)) {
    assert.ok(REFS[e.ref], `${p} references unknown ref ${e.ref}`);
    assert.match(REFS[e.ref], /^[0-9a-f]{40}$/);
  }
});

test('moderation pages distinguish the finalized Apple surface from upstream draft status', () => {
  const docPath = 'moderation/Moderation-DeviceCheck.md';
  const html = pageHtml(docPath, { status: 'draft' }, DOCS[docPath], '<p>body</p>', 'Apple DeviceCheck');
  assert.match(html, /<span class="tag">draft<\/span>/);
  assert.match(html, /<span class="tag">Apple case surface finalized<\/span>/);
  assert.match(html, /<span class="tag">reference implementation<\/span>/);
});
