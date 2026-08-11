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
| FND-02 | Foundation + Estonian counsel | Put both organs, the three nõukogu classes, founding-transition, conflict, vacancy, and removal rules into the articles/policies | adopted documents and legal opinion are published | before money |
| FND-03 | Foundation | Publish document precedence and fail-closed conflict handling | governance page and activation checklist | before money |
| FND-04 | Foundation | Publish control-group, common-infrastructure, grant/procurement conflict, and incident-coordination rules | adopted grant/procurement and incident policies | before grants/procurement |
| FND-05 | Foundation | Define the founding budget, custody matrix, investment policy, complaint route, and public reporting schemas | documents appear in the transparency register | before conversion of pledges |
| SYS-01 | `onym-system` | Create one normative registry for seat types, profile IDs, schema IDs, common manifest headers, and aliases | machine-readable registry + CI + cross-document fixtures | before paid listings |
| SYS-02 | `onym-system` | Specify canonical `ServiceManifest`, `SeatOffer`, `ChannelOffer`, `PaymentRequired`, and `SeatEntitlement` objects | canonical encoding, signatures, revocation, schemas, and vectors | before paid listings |
| SYS-03 | `onym-system` + implementations | Implement identity continuity and exit: descriptor, capabilities, seat keys, rotation, revocation, full export, and notary migration | third-party conformance and adversarial exit drill | before decentralization claims |
| SYS-04 | `onym-system` | Reconcile individual defaults, replaceable read/submit providers, and group-governed notary migration | corrected interface text and migration fixtures | before conformance claims |
| SYS-05 | `onym-system` | Define route-level incident coordination and the billing broker's marketplace duties | accountable assembler/incident profile and broker insolvency, audit, complaint, and exit rules | before commercial channel launch |
| SYS-06 | `onym-system` | Merge or remove the arbitration dependency on the unmerged bank boundary; harmonize the Foundation rule across whitepaper/profile/examples | no broken main-branch link; one Foundation formula; link and constitutional-constant CI | before next whitepaper draft |
| SYS-07 | `onym-system` | Give the merged device backup contract ([onym-system#24](https://github.com/onymchat/onym-system/pull/24)) its first implementation profile, and settle the two design gaps its §17 records | a profile pinning the digest, sealing, and proof-of-possession suites, with fixtures for restore, terms regression, erasure receipts, lapse, and export; plus a verifiable increment scheme that leaks no change map and a workable third-party-retention disclosure | before paid backup listings or an operator grant |
| SYS-08 | `onym-system` | Add a **sealed single-holder custody profile** under the Recovery Trustee seat: one holder, material it cannot unwrap alone, notice-and-delay release, published beside the existing custodial cloud profile rather than replacing it | profile merged with an adversarial review showing the holder alone cannot recover the artifact, and the cloud profile's custody class restated in the same commit | before the Foundation funds or lists a single-holder custody operator |

SYS-07 and SYS-08 record where the two durable-copy arrangements actually
stand, which is not where an earlier version of this ledger put them. Device
backup is a seat, and its contract is now merged upstream rather than merely
described here — but no implementation profile pins it to a concrete stack, so
nothing conforms to it and no operator can yet be measured against it. Seed
custody is **not** a seat: it is how the Recovery Trustee
seat's profiles differ, and one of them —
`recovery/Recovery-Trustee-Cloud.md` — already publishes a 1-of-1 custodial
holder whose operator can technically recover the artifact it stores. The
missing piece upstream is therefore narrower than a seat: a sealed
single-holder profile, published next to the custodial one so a person
choosing one holder can see which they are choosing.

A merged contract is still not a funded seat: neither gate opens until the
profile work above lands, and step 8 of the sequence below — broadened in
the previous change to cover every layer, since a service-market seat is no
more exempt than an application one — still puts protocol-kernel and exit work
ahead of new seats in the spending order. The boundary is published first
because both arrangements create durable copies of what the network otherwise
keeps short-lived or on one device, and that cost belongs in the public record
before an operator prices it.

## Founding governance work

The public governance proposal now supplies a concrete direction for all nine
board seats:

- Sponsor-class Directors: selection route undecided and bracketed. The
  Sponsor Council is not constituted: paid sponsorship confers recognition
  only and no contribution reaches a seat.
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
appointments. The final articles of the sihtasutus determine the lawful appointment path.

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
8. Fund the protocol-kernel and exit work before expanding new seats at any
   layer — service-market seats included. The earlier wording covered only
   application and organizational seats, which left the service market as an
   unintended exception to a priority that has nothing to do with which layer
   a seat sits in.
