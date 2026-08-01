# Institutional remediation plan

Status: active draft plan, 1 August 2026

This plan responds to the institutional review of `onym-system`. It separates
work this Foundation repository can own from protocol work that belongs in the
authoritative system repository. Completing an item here does not make the
Foundation operational: incorporation, adopted governing documents, legal and
accounting review, a lawful board, custody, and explicit activation are still
required.

## Decisions made in this repository

The proposed Foundation policy now has one machine-readable source in
`governance/foundation-policy.json`:

- ordinary endowment appropriation: up to 5% of the trailing twelve
  quarter-end average, subject to law, restrictions, prudence, liquidity, and
  an approved budget;
- exceptional ceiling: up to 7% for one financial year;
- ordinary budget and endowment-appropriation approval: six of nine directors,
  including four non-sponsor directors and at least two directors from each
  non-sponsor class; and
- exceptional approval: seven of nine directors, including four non-sponsor
  directors and at least two directors from each non-sponsor class.

The stronger fixed exceptional vote replaces the ambiguous phrase “two-thirds
of disinterested directors.” No spending rule is legally in force. Upstream
whitepaper and sponsor-profile prose must be harmonized before the Foundation
accepts money.

## Work ledger

| ID | Owner | Action | Acceptance evidence | Gate |
|---|---|---|---|---|
| FND-01 | Foundation | Generate every public numeric governance claim from `foundation-policy.json` | build/tests reject unknown tokens and conflicting percentages or vote rules | before merge |
| FND-02 | Foundation + Estonian counsel | Put Sponsor, Ecosystem, Public-Interest, founding-transition, conflict, vacancy, and removal rules into the MTÜ articles/policies | adopted documents and legal opinion are published | before money |
| FND-03 | Foundation | Publish document precedence and fail-closed conflict handling | governance page and activation checklist | before money |
| FND-04 | Foundation | Publish control-group, common-infrastructure, grant/procurement conflict, and incident-coordination rules | adopted grant/procurement and incident policies | before grants/procurement |
| FND-05 | Foundation | Define the founding budget, custody matrix, investment policy, complaint route, and public reporting schemas | documents appear in the transparency register | before conversion of pledges |
| SYS-01 | `onym-system` | Create one normative registry for seat types, profile IDs, schema IDs, common manifest headers, and aliases | machine-readable registry + CI + cross-document fixtures | before paid listings |
| SYS-02 | `onym-system` | Specify canonical `ServiceManifest`, `SeatOffer`, `ChannelOffer`, `PaymentRequired`, and `SeatEntitlement` objects | canonical encoding, signatures, revocation, schemas, and vectors | before paid listings |
| SYS-03 | `onym-system` + implementations | Implement identity continuity and exit: descriptor, capabilities, seat keys, rotation, revocation, full export, and notary migration | third-party conformance and adversarial exit drill | before decentralization claims |
| SYS-04 | `onym-system` | Reconcile individual defaults, replaceable read/submit providers, and group-governed notary migration | corrected interface text and migration fixtures | before conformance claims |
| SYS-05 | `onym-system` | Define route-level incident coordination and the billing broker's marketplace duties | accountable assembler/incident profile and broker insolvency, audit, complaint, and exit rules | before commercial channel launch |
| SYS-06 | `onym-system` | Merge or remove the arbitration dependency on the unmerged bank boundary; harmonize the Foundation rule across whitepaper/profile/examples | no broken main-branch link; one Foundation formula; link and constitutional-constant CI | before next whitepaper draft |

## Founding governance work

The public governance proposal now supplies a concrete direction for all nine
board seats:

- Sponsor Directors: Sponsor Council election by single transferable vote.
- Ecosystem Directors: Ecosystem Council election by single transferable vote,
  from a published eligibility snapshot based on material contribution or
  operation—not payment.
- Public-Interest Directors: open nominations and a ranked election by a
  non-pay-to-enter Public Interest Council whose published electorate has
  relevant civil-society, rights, consumer-protection, privacy, security,
  open-standards, or non-profit-governance work; sponsors, paid operators, and
  Foundation counterparties are excluded by a strict independence lookback.
- Initial directors: openly nominated transitional appointees with a maximum
  twelve-month term. Class elections occur within 180 days after the first
  accepted contribution. The transitional board cannot approve an exceptional
  endowment draw. If successors are not lawfully seated before the deadline,
  the Foundation stops new commitments and begins an orderly wind-down.

These are design commitments for legal drafting, not self-executing
appointments. The final MTÜ articles determine the lawful appointment path.

## Operational stop conditions

The Foundation must remain non-operational if any of the following is true:

1. public summaries and pinned upstream drafts disagree about money or votes;
2. the articles do not implement the published board classes and elections;
3. custody, budget, gift-acceptance, conflicts, investment, privacy, incident,
   complaint, and record-retention policies are absent;
4. the legal entity, board, bank/custodian, or signature authority is absent;
5. a pledge would convert under terms different from those the sponsor sees;
   or
6. a Foundation-funded default, catalog, audit, or grant conceals common
   control or material infrastructure concentration.

## Sequence

1. Merge the repository consistency safeguards in this change.
2. Open matching `onym-system` changes for SYS-01, SYS-04, and SYS-06.
3. Obtain Estonian legal/accounting review and publish draft articles and
   policies for comment.
4. Incorporate and appoint only the time-bounded transitional board.
5. Publish budget, custody, conflicts, and control-group registers.
6. Accept contribution conversions only after every stop condition clears.
7. Run the first class elections within the machine-readable deadline.
8. Fund the protocol-kernel and exit work before expanding new application or
   organizational seats.
