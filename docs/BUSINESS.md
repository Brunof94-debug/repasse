# REPASSE — business hypothesis

**Unvalidated:** no completed customer interviews, users, pilots, revenue, pricing tests or partnerships. The [real devnet payment](PROOF.md) demonstrates technical operation, not market demand.

## Customer and product

Initial customer hypothesis: a Brazilian design or software studio that already receives USDC and works with 2–4 collaborators. The studio lead defines the allocation, the payer reviews one job payment, and collaborators can check their agreed shares.

REPASSE connects an immutable job agreement, an atomic split and a verified receipt. The intended benefit is closing a collective job payment with reconciliation already attached. The demonstrated prototype paid **4 / 3 / 2 test USDC** in one real Solana devnet transaction. Test tokens have no financial value.

## What needs validation

- Do target studios receive enough USDC payments to care about this workflow?
- Do they want the client to pay collaborators directly, and are the shares known before payment?
- Does existing accounting software already solve the problem well?
- Are exposing shares, refunds, disputes or tax documentation more important obstacles?
- Does a verified receipt reduce work that users notice and value?

These questions could disprove the idea. Bruno has intermediate programming experience; no studio-management background is claimed.

## Adjacent evidence, with limits

These primary sources support investigating the problem. They do **not** validate REPASSE, Brazilian teams of 2–4, or demand for invoice-linked atomic splits.

| Source | Useful observation | Scope and limitation |
|---|---|---|
| [Deel: EDGLRD case study](https://www.deel.com/case-studies/edglrd/) | A design studio categorized as 1–50 employees hired 40 international contractors for a September 2024–January 2025 project. The case describes streamlined payroll review and automated payment. | Supplier-published customer account, with no publication date or independent evaluation shown. Demonstrates a distributed-studio workflow; does not test stablecoins or small-team splits. |
| [Wise/Censuswide survey, 1 May 2024](https://newsroom.wise.com/en-NAM/237198-hidden-costs-complexity-of-international-payments-threaten-small-business-expansion-new-research-reveals/) | 49% of surveyed decision makers agreed that international-payment complexity prevents expansion abroad. | Wise commissioned Censuswide to survey 1,003 US decision makers at businesses with 1–500 employees, 4–16 April 2024. Combines strongly/somewhat agree. Self-report, US geography and broad SMB segment; no inference about Brazilian freelancers or REPASSE demand. |
| [Stripe: stablecoin strategy guide](https://stripe.com/guides/why-your-business-needs-a-stablecoin-strategy) | Stripe reports 30% month-on-month stablecoin transaction-volume growth on its platform in the first half of 2025; describes Remote paying contractors in 68 countries with stablecoins. | Stripe's own operating data and integration account; no absolute volume, analyzed-base size or full methodology given. Evidence of infrastructure use, not demand for this product or team size. |

Our inference: international-payment friction and contractor stablecoin payments are real adjacent workflows worth studying. Whether small studios want a client payment split directly among collaborators remains an open customer question.

## Proposed go-to-market

Begin with focused interviews and founder introductions in Brazilian builder/freelance communities. Community outreach requires authorization. Show a precise three-person job example and ask about an actual recent workflow.

Proposed learning targets, not completed outcomes:

| Step | Activity | Decision evidence |
|---|---|---|
| Problem discovery | 8–10 relevant interviews | A repeated problem grounded in actual jobs, current tools and effort |
| Workflow review | 2–3 redacted past-job walkthroughs | Whether direct settlement fits the agreement and privacy needs |
| Devnet pilot | 3–5 consenting teams | Completion, errors, time and confidence in the receipt |
| Pricing experiment | A concrete offer after repeat use | Accepted/rejected offer and support burden |

## Business model to test

Candidate: free basic workflow plus a paid studio plan for reconciliation history, permissions or team administration. Pricing and feature demand are unvalidated. A fixed software subscription is a hypothesis; the direct-transfer prototype does not currently establish percentage-fee revenue.

Do not claim a market size, successful distribution channel or competitive moat without evidence. Compare the actual workflow against accounting tools, invoice products and manual transfers during discovery.

## Product limits and next evidence

The receipt proves a particular test payment. It does not prove job delivery, replace a tax invoice or prevent a second separately signed payment. Only one public RPC was used for the recorded audit. Devnet history can reset.

Production readiness would require authoritative shared invoice state, wallet support, recovery, access control, refunds/disputes and review of applicable obligations. This prototype makes no mainnet, Pix, foreign-exchange, lending, yield or commercial custody claim.

After pilots begin, measure job completion, reconciliation effort, allocation errors, repeat use, receipt use and willingness to pay. All customer metrics remain **PENDING**.

Pitch-ready statement: “Our initial customer and paid plan are hypotheses. We have no validated users or revenue yet. The prototype demonstrates an atomic split and strict receipt verification. Next we want to learn whether this removes meaningful coordination work for studios already receiving USDC.”
