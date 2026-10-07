# Repasse

**One job payment. Every collaborator's share. A verifiable receipt.**

A new, open-source prototype built for Crypto World's Fair 2026 by Bruno Fernandes (Brazil, solo). The initial customer hypothesis is a small Brazilian design or software studio that already receives stablecoins and works with two to four collaborators.

## Try the prototype

Public demo: https://brunof94-debug.github.io/repasse/ (deployment being prepared).

**Solana devnet only. Test SOL and Circle test USDC have no financial value.** This repository and demo are educational hackathon materials, not a commercial payment service.

1. Create an invoice with 2–4 public Solana addresses and exact shares.
2. Review the allocation and share the invoice URL. The URL contains public invoice details; verify the intended recipients with your team.
3. Create a temporary test session. Obtain free devnet SOL and USDC from the linked official faucets. The signing key stays in this tab's memory; refreshing the page loses it.
4. Pay once. The app puts associated token account creation, each SPL `TransferChecked`, a public reference, and a digest-bound Memo into **one atomic transaction**.
5. Verify the signature against the invoice. A finalized receipt requires the expected network, successful execution, exact Circle mint, six decimal precision, signer, source, recipients, amounts, balance changes, reference, digest and validity window.
6. Export CSV or JSON and independently inspect the public Solana Explorer transaction.

The public proof fixture is being prepared. Once added, visitors can verify a real prior devnet payment without creating a wallet or using a faucet.

## What is implemented

- Portuguese and English interface; intentional green, cream and amber visual identity.
- Exact integer money parsing, 2–4 distinct recipients and shareable UTF-8 invoices.
- Session-only noncustodial test signing; no seed phrase, private key or backend credential stored.
- Direct, atomic Circle devnet USDC splits using existing SPL Token and Memo programs.
- Strict RPC verification; pending, confirmed, finalized, invalid and unavailable states remain distinct.
- Reference-based discovery with bounded history and duplicate-payment warnings.
- Human-readable receipt, Explorer link and safe CSV export.
- Meaningful tests for wrong networks, wrong tokens, incorrect amounts, missing or changed memos, failed transactions, altered balances, missing destinations, finality and duplicate payment discovery.

## Run locally

Requires Node.js 22 or 24.

```sh
npm ci
npm test
npm run dev
```

```sh
npm run build
npm run preview
```

The Vite base is relative, so the build supports a GitHub Pages repository subpath. The deployment workflow tests and builds before publishing.

## Audit a real receipt

```sh
npx tsx scripts/audit-proof.ts public/demo-proof.json
```

The audit is read-only. Optional `REPASSE_DEVNET_RPC_URL` and `REPASSE_SECONDARY_DEVNET_RPC_URL` can point to devnet RPCs. The verifier checks the genesis hash. A second provider is reported as independent only when it is on a different host and produces a matching finalized result.

## Architecture

The static client holds the invoice; its canonical JSON includes version, network, mint, identifier, reference, title, dates and ordered recipients. SHA-256 binds those values to an on-chain memo; names and job descriptions are not copied to the memo in plaintext. This proves a transaction matches the displayed invoice, **not the legal identity of the invoice creator or delivery of the work**.

There is no custom on-chain program. Existing Solana programs handle all-or-nothing execution; the verifier additionally checks recipient credits and the payer's total debit. Receipt metadata can be exported, but callers must re-verify the blockchain rather than trust a downloaded status field.

## Practical limits

- Devnet and its public RPC/faucets can be unavailable, rate-limited or reset. A fixture's history may eventually disappear.
- The frontend cannot prevent every duplicate payment across devices. Discovery is bounded, and missing history is never presented as proof of no prior payment.
- No fiat conversion, Pix, off-ramp, escrow, refund guarantee, yield or mainnet payment support.
- No customer interviews, pilots, users or revenue are claimed. Customer discovery and the business model remain hypotheses; see [business plan](docs/BUSINESS.md).
- Production would require persistent invoice authentication, independent verification, operational controls, an external wallet integration, and a separate review before accepting real funds.
- Technical receipt only; it does not replace a tax invoice.

## Hackathon materials

[Pitch](docs/PITCH.md), [demo](docs/DEMO.md), [business hypotheses](docs/BUSINESS.md), [submission draft](docs/SUBMISSION.md). These documents explicitly distinguish unfinished submission steps from completed evidence. The final global entry and both videos will be in English.

Original Repasse development began on 7 October 2026, inside the competition window. No original application code was reused from the previous Week 1 project. OpenAI Codex assisted implementation, tests and materials; Bruno is the entrant and reviews the submission. No invented customer validation or professional credentials.

## Dependencies and license

App source: MIT, see [LICENSE](LICENSE). Third-party packages retain their own licenses. The exact dependency versions and integrity hashes are in `package-lock.json`: Solana Kit, RPC and signer plugins, Token and Memo clients, Vite, TypeScript and tsx. External Google Fonts: DM Sans and Manrope, SIL Open Font License. Solana and Circle names identify the protocols used; this prototype is not endorsed by them.
