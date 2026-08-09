import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FOUNDATION_POLICY_PATH = path.join(ROOT, 'governance', 'foundation-policy.json');

const integer = (value, name, minimum = 0) => {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer >= ${minimum}`);
  }
};

export function validateFoundationPolicy(policy) {
  if (policy.status !== 'proposed_non_operational') {
    throw new Error('foundation policy must remain proposed_non_operational until legal adoption');
  }

  const b = policy.board;
  const e = policy.endowment;
  const g = policy.grantmaking;
  const t = policy.transition;
  if (!b || !e || !g || !t) {
    throw new Error('foundation policy requires board, endowment, grantmaking, and transition sections');
  }

  for (const [name, value] of Object.entries(b)) integer(value, `board.${name}`, 1);
  for (const [name, value] of Object.entries(e)) integer(value, `endowment.${name}`, 1);
  for (const [name, value] of Object.entries(g)) integer(value, `grantmaking.${name}`, 1);
  for (const [name, value] of Object.entries(t)) integer(value, `transition.${name}`, 1);

  if (b.sponsorSeats + b.ecosystemSeats + b.publicInterestSeats !== b.totalSeats) {
    throw new Error('board class seats must sum to board.totalSeats');
  }
  if (b.sponsorSeats >= Math.ceil(b.totalSeats / 2)) {
    throw new Error('sponsor directors must not be able to form a board majority');
  }
  if (b.ordinaryApprovalVotes > b.totalSeats || b.exceptionalApprovalVotes > b.totalSeats) {
    throw new Error('approval thresholds cannot exceed total board seats');
  }
  if (b.ordinaryApprovalVotes < Math.floor(b.totalSeats / 2) + 1) {
    throw new Error('ordinary approval must require a board majority');
  }
  if (b.exceptionalApprovalVotes <= b.ordinaryApprovalVotes) {
    throw new Error('exceptional approval must be stricter than ordinary approval');
  }
  const nonSponsorSeats = b.totalSeats - b.sponsorSeats;
  if (b.ordinaryMinimumNonSponsorVotes > nonSponsorSeats ||
      b.exceptionalMinimumNonSponsorVotes > nonSponsorSeats) {
    throw new Error('minimum non-sponsor votes cannot exceed non-sponsor seats');
  }
  for (const rule of ['ordinary', 'exceptional']) {
    const ecosystemMinimum = b[`${rule}MinimumEcosystemVotes`];
    const publicInterestMinimum = b[`${rule}MinimumPublicInterestVotes`];
    const nonSponsorMinimum = b[`${rule}MinimumNonSponsorVotes`];
    const approvalVotes = b[`${rule}ApprovalVotes`];
    if (ecosystemMinimum > b.ecosystemSeats || publicInterestMinimum > b.publicInterestSeats) {
      throw new Error(`${rule} class vote minimum cannot exceed its board class`);
    }
    if (ecosystemMinimum + publicInterestMinimum < nonSponsorMinimum) {
      throw new Error(`${rule} class vote minimums must enforce the non-sponsor minimum`);
    }
    if (ecosystemMinimum + publicInterestMinimum > approvalVotes) {
      throw new Error(`${rule} class vote minimums cannot exceed the approval threshold`);
    }
  }
  if (e.exceptionalMaximumBasisPoints <= e.ordinaryMaximumBasisPoints) {
    throw new Error('exceptional endowment ceiling must exceed the ordinary ceiling');
  }
  if (e.ordinaryMaximumBasisPoints % 100 || e.exceptionalMaximumBasisPoints % 100) {
    throw new Error('website policy percentages must use whole percentage points');
  }
  if (g.minimumGrantEur > g.annualGrantBudgetTargetEur) {
    throw new Error('the minimum grant cannot exceed the annual grant budget target');
  }
  return policy;
}

export function loadFoundationPolicy(file = FOUNDATION_POLICY_PATH) {
  return validateFoundationPolicy(JSON.parse(fs.readFileSync(file, 'utf8')));
}

export const FOUNDATION_POLICY = loadFoundationPolicy();

// Thousands separators without depending on the runtime's ICU data.
const eur = amount => String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function policyView(policy) {
  const ordinaryRate = policy.endowment.ordinaryMaximumBasisPoints / 10000;
  return {
    ...policy,
    board: {
      ...policy.board,
      nonSponsorSeats: policy.board.totalSeats - policy.board.sponsorSeats,
    },
    endowment: {
      ...policy.endowment,
      ordinaryMaximumPercent: policy.endowment.ordinaryMaximumBasisPoints / 100,
      exceptionalMaximumPercent: policy.endowment.exceptionalMaximumBasisPoints / 100,
      corpusTarget: eur(policy.endowment.corpusTargetEur),
      // What the target corpus yields at the ordinary ceiling — never above it.
      corpusTargetAppropriation: eur(Math.round(policy.endowment.corpusTargetEur * ordinaryRate)),
    },
    grantmaking: {
      ...policy.grantmaking,
      annualGrantBudgetTarget: eur(policy.grantmaking.annualGrantBudgetTargetEur),
      fullyEndowedCorpus: eur(Math.round(policy.grantmaking.annualGrantBudgetTargetEur / ordinaryRate)),
      minimumGrant: eur(policy.grantmaking.minimumGrantEur),
      // A ceiling the arithmetic implies, not a number of grants the board owes.
      maximumGrantsPerYear: Math.floor(
        policy.grantmaking.annualGrantBudgetTargetEur / policy.grantmaking.minimumGrantEur),
    },
  };
}

function valueAt(object, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value?.[key], object);
}

export function renderPolicyTokens(source, policy = FOUNDATION_POLICY) {
  const view = policyView(validateFoundationPolicy(policy));
  const rendered = source.replace(/\{\{policy\.([\w.]+)\}\}/g, (token, dottedPath) => {
    const value = valueAt(view, dottedPath);
    if (value === undefined || value === null || typeof value === 'object') {
      throw new Error(`unknown or non-scalar foundation policy token: ${token}`);
    }
    return String(value);
  });
  const unresolved = rendered.match(/\{\{policy\.[^}]+\}\}/);
  if (unresolved) throw new Error(`unresolved foundation policy token: ${unresolved[0]}`);
  return rendered;
}
