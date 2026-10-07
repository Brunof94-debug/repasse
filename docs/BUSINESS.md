# REPASSE — honest business hypothesis

Status: **Unvalidated hypothesis.** No completed customer interviews, users, pilots, revenue, pricing tests, partnerships or distribution commitments have been supplied. This document is a plan, not traction evidence.

## Product focus

REPASSE aims to help a small studio close a paid job with the collaborators' shares already settled and reconciled. A job has one agreed allocation; a single Solana transaction pays 2–4 recipients directly; verification connects each amount and recipient to the original invoice digest. The invoice, collective settlement and receipt form one workflow.

The hackathon MVP runs on Solana devnet using Circle's test USDC, which has no monetary value. Technical results can demonstrate the flow; they cannot establish market demand or readiness for commercial mainnet operations.

## Initial customer hypothesis

Brazilian design or software studios with 2–4 collaborators, serving clients who already pay in USDC. Begin with teams already comfortable with stablecoin wallets rather than assuming all freelancers want crypto payments.

Potential user roles:

- **Studio lead:** defines the job allocation and needs an understandable record of each share.
- **Client/payer:** wants to review the destination and amount of one job payment.
- **Collaborator:** wants to verify the agreed amount reached the correct wallet.

These roles and motivations need interviews. Bruno has intermediate programming experience; no professional studio-management background has been supplied, so founder-market fit must be explained through evidence and learning rather than invented credentials.

## Problem to validate

Hypothesis: collecting a job payment and then calculating, transferring and reconciling collaborator shares creates meaningful coordination work or errors for some studios.

Questions that could disprove the idea:

- Do these teams actually receive enough USDC payments to care?
- Do they want the client to pay collaborators directly, or do they need the studio to receive everything first?
- Is the agreed allocation known before payment? How often does it change?
- Do their accounting tools already solve the workflow satisfactorily?
- Does exposing recipients or shares to a payer create a confidentiality problem?
- Are refund, dispute, fee, tax-document or access-control needs more important than the atomic split?
- Would a receipt with chain evidence be understood and used, or merely add another tool?

## Validation plan

All targets below are proposed learning goals, not completed results.

| Stage | Proposed activity | Evidence to retain | Decision |
|---|---|---|---|
| Problem interviews | Speak with 8–10 relevant studio leads and, where appropriate, collaborators. Outreach only with explicit authorization. | Consented notes about actual recent jobs, payment method, existing tools, mistakes and time spent. | Continue only if a repeated workflow problem appears in the target segment. |
| Workflow observation | Ask 2–3 interested teams to walk through a redacted past job and the current reconciliation process. | Before/after workflow, constraints, privacy preferences and objections. | Decide whether payer-direct settlement fits the real agreement. |
| Devnet usability pilot | Invite 3–5 consenting teams to try a supervised test-USDC job. | Completion rate, errors, abandoned steps, confidence in the receipt, time to finish. | Fix confusing payment/receipt steps before a commercial experiment. |
| Commercial feasibility review | Investigate wallet support, authoritative invoice storage, operations, refunds and applicable obligations before mainnet launch. | Documented decisions and unresolved dependencies. | Keep the product in devnet until the necessary conditions are met. |
| Willingness to pay | Test a specific paid offer with teams that repeatedly use the validated flow. | Actual accepted/rejected offer or payment intent, clearly separated from verbal enthusiasm. | Choose or abandon a pricing model based on evidence. |

No interview notes, screenshots, pilot metrics or customer quotes should be added until the activity has actually happened and consent permits their use.

## Go-to-market hypothesis

First distribution: focused founder introductions and Brazilian builder/freelance communities, with permission to contact or post. Present one clear three-person job example and ask for workflow feedback. A public product page and readable receipt can support sharing; no channel should be called successful before measured results exist.

Avoid broad claims about all Brazilian freelancers or a numerical total addressable market without sourced research. The first market argument is a precise segment and a testable workflow. Expand beyond it only after learning whether this segment uses and values the product.

## Possible business model

Candidate model: a free basic workflow plus a paid studio plan for reconciliation history, team administration, permissions or accounting exports. Feature availability must be distinguished from this roadmap.

Pricing is **PENDING — unvalidated**. Do not call a proposed fee current revenue. Avoid assuming a percentage of funds can be captured by the MVP's direct-transfer architecture. A fixed software subscription may be simpler to test; costs, willingness to pay and commercial requirements remain unknown.

## Differentiation to demonstrate

The strongest demo shows one immutable job agreement, one atomic transaction and a receipt that checks every share. The visible benefit is completing a collective job payment with reconciliation attached.

This is a positioning hypothesis, not a verified claim that no competitor offers similar functionality. Compare actual competing workflows during customer research, including ordinary invoicing/accounting tools and manual stablecoin transfers. Do not claim exclusivity, market leadership or an established moat.

## Metrics worth measuring after validation begins

- Percentage of intended jobs that reach a matching verified receipt.
- Time and number of manual steps to settle and reconcile the collaborators' shares.
- Incorrect allocations or payment attempts detected before/after signing.
- Whether a studio repeats the workflow on a second real job.
- How often collaborators inspect or use the receipt.
- Paid-plan acceptance and support burden if a commercial pilot becomes appropriate.

All current measured values: **PENDING — no customer data**.

## MVP boundaries and known dependencies

- No production/mainnet, Pix, foreign-exchange, lending, yield or custody claim.
- A devnet receipt is technical payment evidence, not a tax invoice or proof that a job was delivered.
- Browser storage alone is not authoritative shared invoice state. A production workflow needs decisions about original terms, access control, recovery and independent verification.
- A single atomic transaction ensures all included transfers execute together; it does not by itself prevent a second separately signed payment across devices. Replay handling and payment status need honest limits.
- Test SOL/USDC faucets, RPC availability, confirmation delays and devnet resets can interrupt demonstrations.
- Refunds, disputes, partial or excess payments and changing allocations need explicit product policy before commercial use.
- Commercial readiness requires separate review of operational and applicable legal requirements; being noncustodial does not settle that question.

## What can truthfully appear in the hackathon pitch now

“Our initial customer and paid plan are hypotheses. We have no validated users or revenue yet. The prototype focuses on proving the atomic split and strict receipt verification. Our next step is to learn whether this removes meaningful coordination work for small studios already receiving USDC.”

Update that statement only when stronger evidence exists. Keep planned activities distinct from completed outcomes.
