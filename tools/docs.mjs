// Source-of-truth manifest for the pre-rendered contract documents.
// Every document is fetched at a pinned commit so a deploy is reproducible
// and a branch deletion cannot break the site. To pull in newer content,
// update the SHA for the ref and re-run `npm run build`.

export const REPO = 'onymchat/onym-system';

export const REFS = {
  main: '00000000ed8164ae7efef4f20c114cb3a22bf813',
  'discovery-seat': 'b1c286b58d1fef638e7dc98fe0dcb4081256441d',
  'worktree-bank-boundary': '85bc43ce476748faf679849666f9334868e74fc8',
  'worktree-association-naming': '4712694da80a9d2f82fff0fa73725af30260eb6b',
  'moderation-seat': '92aefa739fe39c01c0b969427af2ea7ef4920ce7',
};

// path → { ref, seat? (eyebrow label for abstract seat boundaries), review? }
export const DOCS = {
  'README.md':                          { ref: 'main', seat: 'Repository guide' },
  'WHITEPAPER.md':                      { ref: 'main', seat: 'The system model' },
  'interface/Interface.md':             { ref: 'main', seat: 'Interface' },
  'identity/UI-Identity.md':            { ref: 'main', seat: 'Identity — not a seat; stays with the person' },
  'identity/UI-Identity-BIP39.md':      { ref: 'main' },
  'message/UI-Message.md':              { ref: 'main', seat: 'Message carriage' },
  'message/UI-Message-Nostr.md':        { ref: 'main' },
  'blob/UI-Blob.md':                    { ref: 'main', seat: 'Media storage' },
  'blob/UI-Blob-Blossom.md':            { ref: 'main' },
  'notary/UI-Notary.md':                { ref: 'main', seat: 'Group verification' },
  'notary/UI-Notary-Stellar.md':        { ref: 'main' },
  'audit/Audit.md':                     { ref: 'main', seat: 'Audit & attestation' },
  'arbitration/Arbitration.md':         { ref: 'main', seat: 'Arbitration' },
  'discovery/Discovery.md':             { ref: 'main', seat: 'Discovery' },
  'charity/Charity.md':                 { ref: 'main', seat: 'Charitable coordination' },
  'charity/UI-Charity.md':              { ref: 'main' },
  'lead/Lead-Generation.md':            { ref: 'main', seat: 'Distribution (lead generation)' },
  'lead/Lead-Generation-Telegram.md':   { ref: 'main' },
  'acquisition/Acquisition.md':         { ref: 'main', seat: 'Acquisition' },
  'acquisition/Acquisition-App-Store.md':   { ref: 'main' },
  'acquisition/Acquisition-Google-Play.md': { ref: 'main' },
  'recruitment/Recruitment.md':         { ref: 'main', seat: 'Recruitment' },
  'recovery/Recovery-Trustee.md':       { ref: 'main', seat: 'Recovery trustee' },
  'recovery/Recovery-Trustee-Cloud.md': { ref: 'main' },
  'recovery/Recovery-Trustee-Shamir.md':{ ref: 'main' },
  'sponsor/Sponsor.md':                 { ref: 'main', seat: 'Sponsorship' },
  'sponsor/Sponsor-Onym.md':            { ref: 'main' },
  'bank/UI-Bank.md':                    { ref: 'worktree-bank-boundary', seat: 'Banking & payments', review: true },
  'bank/UI-Bank-Stellar.md':            { ref: 'worktree-bank-boundary', review: true },
  'association/Association-Naming.md':  { ref: 'worktree-association-naming', seat: 'Naming & credentials', review: true },
  'moderation/Moderation.md':           { ref: 'moderation-seat', seat: 'Moderation authority', review: true },
  'moderation/Moderation-DeviceCheck.md':   { ref: 'moderation-seat', review: true },
  'moderation/Moderation-Device-Recall.md': { ref: 'moderation-seat', review: true },
};

export const SITE_ORIGIN = 'https://onym.foundation';

// The source repository is authoritative, but these pinned drafts contain
// known cross-document conflicts. Rendering a warning prevents the Foundation
// site from silently presenting contradictory draft rules as one policy.
export const DOCUMENT_NOTICES = {
  'WHITEPAPER.md': 'Known draft conflict: this whitepaper states a 4% ordinary endowment rule, while the Foundation proposal selects 5% ordinary and 7% exceptional limits. No rule is in force; the upstream drafts must be harmonized before the Foundation accepts money.',
  'sponsor/Sponsor-Onym.md': 'Known draft conflict: prose and the example policy record in this profile disagree about ordinary and exceptional endowment percentages and approval thresholds. The Foundation proposal selects 5% ordinary, 7% exceptional, and a seven-of-nine vote including four non-sponsor directors with support from both non-sponsor classes. No rule is in force.',
  'arbitration/Arbitration.md': 'Dependency notice: this draft depends on the bank escrow boundary, which is bundled here from a proposal still in review and is not merged into the onym-system main branch. No arbitration enforcement rail is operational.',
  'interface/Interface.md': 'Known draft conflict: “replaceable at any time” does not permit one user to replace an existing group’s canonical notary. Personal defaults and read/submission providers may be replaceable; canonical group state requires the group’s governed migration rule.',
};

export function parseFrontmatter(md) {
  const meta = {};
  let body = md;
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (m) {
    body = md.slice(m[0].length);
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
      if (kv) meta[kv[1]] = kv[2].trim();
    }
  }
  return { meta, body };
}

export function headingId(text) {
  return text.toLowerCase()
    .replace(/[^\w\s§-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Resolve a markdown link target found in `docPath` to a site href.
// Returns null when the link should be left untouched.
export function resolveMdHref(href, docPath) {
  if (/^(https?:|mailto:)/.test(href) || href.startsWith('#')) return null;
  const m = href.match(/^([^#?]+\.md)(#.*)?$/);
  if (!m) return null;
  const docDir = docPath.includes('/') ? docPath.replace(/\/[^/]*$/, '') : '';
  const stack = [];
  for (const seg of ((docDir ? docDir + '/' : '') + m[1]).split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') stack.pop();
    else stack.push(seg);
  }
  const path = stack.join('/');
  const anchor = m[2] || '';
  const depth = docPath.split('/').length - 1;
  const up = '../'.repeat(depth);
  if (DOCS[path]) return up + path.replace(/\.md$/, '.html') + anchor;
  // Not part of the bundle — point at the authoritative source, pinned.
  const entry = DOCS[docPath];
  const sha = REFS[entry.ref];
  return `https://github.com/${REPO}/blob/${sha}/${path}${anchor}`;
}
