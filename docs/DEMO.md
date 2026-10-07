# REPASSE — English product demo

Status: **Final video exported and reviewed locally.** Measured duration: **123.97 seconds (2:04)**, below the three minute maximum. H.264/AAC file decoded completely. A real 9 test-USDC split has been audited. This video is an **edited walkthrough of actual captured steps**, with synthetic English narration; it is not a continuous screen recording.

[Repository](https://github.com/Brunof94-debug/repasse) · [Payment proof and reproduction](PROOF.md) · [English app](https://brunof94-debug.github.io/repasse/?lang=en) · [Watch the demo](https://brunof94-debug.github.io/repasse/demo.html). Public deployment and actual browser playback verified on 7 October 2026; duration loaded as 123.98 seconds, playback advanced, and no media error was reported.

## Demonstrated payment

The real finalized Solana devnet transaction at slot **508446011** credited **Design 4, Dev 3 and Content 2 test USDC**, totaling **9**. The invoice digest is **896b56164ba552bb5212347eb0a695aab1a2c2104f1d79584142985fc8e4773c**.

[Open the real transaction in Explorer](https://explorer.solana.com/tx/2ypiteP4b9kdMAgNNpoVh5XwWfR8wH1rFRQojsZYTThXKDxAkBzXsMiy8P5n3mDqSn5rzGbTMf1gzVHg5iyTTFEn?cluster=devnet).

This is Circle's **test USDC**, with no financial value. A temporary devnet payer was used; no personal/mainnet payout wallet is claimed.

## Narration and actions

| Approximate time | Screen action | English narration |
|---|---|---|
| 0:00–0:15 | Working app and devnet badge. | **“This is REPASSE, a prototype for paying a small studio's collaborators together and reconciling the job. This demo runs on Solana devnet using test USDC with no monetary value.”** |
| 0:15–0:40 | Actual invoice with three recipients and 4 / 3 / 2 amounts. | **“This nine test-USDC job has three collaborators. The shares are four, three, and two. The preview shows each destination and exact amount before payment. These terms become fixed so the receipt can be checked against the original invoice.”** |
| 0:40–1:03 | Original invoice reopened for review; no second payment. | **“Here we reopen the original invoice for review. Its recorded payment used one signed transaction. It contains the transfers to all three collaborators and the invoice digest in a memo. The funds go directly to the recipients. The transfers are atomic: they all succeed, or none of them does.”** |
| 1:03–1:25 | Historical “After submission · before verification” capture, then the verified receipt. The historical balance is not the final balance. | **“Sending a transaction does not immediately mark the invoice paid. REPASSE checks the chain, the USDC mint, recipient addresses, exact amounts, successful execution, and the memo's invoice digest. Only a matching finalized transaction produces a verified receipt.”** |
| 1:25–1:45 | Actual Explorer captures in sequence: finalized summary, token credits/debit, matching memo. | **“Here is the public transaction signature. The Explorer shows the same recipients and transfers. The receipt connects that on-chain evidence to this job, so the studio can see who received each share without reconstructing separate payments.”** |
| 1:45–2:08 | Actual verifier rejection of an invoice mismatch. | **“Now I check a signature against an invoice whose digest does not match. The verifier rejects it. A valid transaction on the network is not enough: it must be the correct payment for this invoice. Wrong tokens, amounts, recipients, or failed transactions must also be rejected.”** |
| 2:08–2:25 | Original verified receipt and closing card. | **“REPASSE's focus is collective settlement with reconciliation already attached. This is a devnet prototype, with user validation and a production launch still ahead. One job, every agreed share, one verifiable receipt.”** |

## Remaining video work

Actual verified, Explorer summary/transfers/memo and rejected-invoice captures were reviewed. The pending image is a historical capture immediately after submission; its wallet balance was shown before refreshing, as labeled in the video. The negative test altered only the invoice title and checked the same real signature, producing a digest mismatch. Narration and visuals match those steps. The public app independently loaded the proof and verified it through the live devnet RPC; public video playback also succeeded.

The recorded proof used the public Solana RPC; no independent second-provider confirmation is claimed. Devnet history can reset. The receipt proves one payment, not job delivery or prevention of a second payment.

[Colosseum video requirements](https://colosseum.com/hackathon) · [Regional English/Solana requirements](https://superteam.fun/earn/listing/side-track-superteam-brasil) · [Circle test USDC](https://developers.circle.com/stablecoins/usdc-contract-addresses).
