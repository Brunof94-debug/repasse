# REPASSE — submission record

Status: **Both submissions confirmed on 7 October 2026.** Colosseum displayed **Submitted** at **10:24 AM PDT / 14:24 Brasília** and **Your project is entered for judging**. Superteam Earn then displayed **Submission created successfully** and **Submission Received!** for the Superteam Brasil x SolarEcoFund listing; the listing now offers **Edit Submission**. Repository, app, real devnet payment evidence and three English videos are published. Public playback was verified for all three unlisted YouTube videos. Eligibility, accounts, founder profile, registration and required contact are complete. There are no remaining submission steps.

## Founder profile

**Bruno Fernandes · Brazil · Solo builder · Intermediate programming experience · University degree in Accounting.** GitHub: [Brunof94-debug](https://github.com/Brunof94-debug).

English bio:

> I'm Bruno Fernandes, a solo builder based in Brazil with intermediate programming experience. I'm developing REPASSE with AI assistance to explore how small studios can settle collaborators' shares and verify a job payment through Solana. My focus is a functional devnet prototype and customer validation.

The entrant confirmed a higher-education degree in Ciências Contábeis and that he is not currently studying. No employment history, startup experience or additional professional credentials have been supplied.

## Global submission — English

**Product:** REPASSE  
**One line:** One job payment, every collaborator's agreed share, and a verifiable receipt.

**Description:** REPASSE is a devnet prototype for small studios receiving USDC and working with two to four collaborators. It fixes each collaborator's share in a job invoice, builds one atomic Solana transaction that pays recipients directly, and verifies the evidence against the original invoice. The focus is collective settlement with reconciliation attached: the job is paid and each agreed share is accounted for.

**Customer/problem hypothesis:** Brazilian design or software studios already receiving USDC may spend meaningful effort calculating, sending and reconciling collaborator payments. This workflow and customer demand have not been validated through interviews or pilots.

**Solana integration:** The invoice digest commits the network, mint, recipients, integer amounts and other agreed invoice fields. The signed transaction contains direct SPL-token transfers and a Memo binding the payment to that invoice. Verification checks finalized successful execution, chain, mint, recipient accounts/owners, exact credits, payer debit and the digest/reference. The job payment is not held in a platform wallet.

**Demonstrated evidence:** One real devnet transaction credited **4 / 3 / 2 test USDC**, totaling **9**, at slot **508446011**. The matching digest and read-only audit are documented in [PROOF.md](PROOF.md). This is technical evidence, not customer traction; Circle test tokens have no monetary value.

**Tools:** TypeScript, Vite, Solana Kit, SPL Token and Memo program clients; Circle devnet USDC. OpenAI Codex assisted implementation and materials. No custom on-chain program is required by this prototype.

**Differentiation:** The agreed allocation, collective settlement and proof of each share are connected to one job. We do not claim exclusivity, market leadership or a validated competitive moat.

**Business/distribution:** Start with focused interviews and supervised pilots for Brazilian studios already comfortable with stablecoins. Test willingness to pay for reconciliation history or team-management features. Pricing and distribution remain hypotheses; see [BUSINESS.md](BUSINESS.md).

**Traction:** No validated customer interviews, users, pilots, partnerships or revenue.

**Development history:** Original implementation began on **7 October 2026**, inside the competition window. No original application code was reused from the previous Week 1 project. The app is MIT licensed, and third-party dependencies retain their declared licenses and are listed in package-lock.json.

## Links and deliverables

| Item | Status |
|---|---|
| Repository | [Brunof94-debug/repasse](https://github.com/Brunof94-debug/repasse) — created |
| App | [English interface](https://brunof94-debug.github.io/repasse/?lang=en) — published and verified |
| Logo | Published original SVG and 512px PNG in public/repasse-mark.svg and public/repasse-mark.png |
| Real payment | [Proof, transaction and audit](PROOF.md) — completed |
| English global pitch, maximum 2 minutes | [Submitted YouTube pitch](https://youtu.be/LW3WnEtRoE4) · [Site player](https://brunof94-debug.github.io/repasse/global-pitch.html) — local 119.750 seconds; hosted 119.781 seconds, playback verified |
| English regional pitch, 2–3 minutes | [Submitted YouTube pitch](https://youtu.be/Dety0pZjV2Y) · [Site player](https://brunof94-debug.github.io/repasse/pitch.html) — local 151.04 seconds; hosted 151.081 seconds, playback verified |
| English demo, maximum 3 minutes | [Submitted YouTube demo](https://youtu.be/R_PfSJy_BXA) · [Site player](https://brunof94-debug.github.io/repasse/demo.html) — local 123.97 seconds; hosted 124.001 seconds, playback verified |
| Colosseum project link | [REPASSE](https://colosseum.com/arena/projects/repasse) — **submitted and entered for judging** |
| Brazilian track | [Superteam Brasil x SolarEcoFund](https://superteam.fun/earn/listing/side-track-superteam-brasil) — **submission received** |
| Product social accounts | None supplied or created |

## Superteam Brasil / SolarEcoFund — Portuguese

**REPASSE — um job pago, as partes de todos conciliadas.**

Protótipo em Solana devnet para pequenos estúdios que recebem USDC e trabalham com 2–4 colaboradores. O pagador revisa uma divisão acordada e assina uma transação atômica com repasses diretos. O comprovante verifica rede, mint, destinatários, valores e memo com o digest da cobrança. Uma transação real de **9 USDC de teste** distribuiu **4 / 3 / 2**, com prova e auditoria públicas no repositório.

**Equipe:** Bruno Fernandes, Brasil, solo, programação intermediária, desenvolvimento e materiais com assistência de IA.  
**Categoria:** pagamentos/stablecoins.  
**Estágio:** protótipo devnet; tokens sem valor financeiro. Demanda, usuários e receita não validados.  
**Negócio:** hipótese de atender estúdios brasileiros já familiarizados com stablecoins; entrevistas, pilotos e preço ainda por validar.

**Link principal enviado ao Earn:** [REPASSE no Colosseum](https://colosseum.com/arena/projects/repasse). A submissão brasileira foi enviada após a confirmação global. Repositório, app, vídeo regional, demonstração e prova foram incluídos no formulário.

## Submission confirmations and next steps

- **Confirmed by the entrant:** residence in Brazil, age 18 or older on **14 September 2026**, intermediate programming experience, and no external financing for REPASSE.
- **Completed:** Colosseum account and Arena profile as **brunof94_debug**, Crypto World's Fair registration (Brazil/Solana), Code of Ethics acceptance, submission founder profile, and Earn account/profile with the same public handle. The entrant authorized the official terms/privacy, global rules and YouTube uploads. Both project submissions are confirmed.
- **Video requirements verified in the actual form:** Colosseum requires YouTube/Loom/Vimeo demo up to 3 minutes and a separate pitch up to 2 minutes. The Brazilian listing requests a 2–3 minute pitch. Separate global and regional variants meet those limits; all three final YouTube links are unlisted and play without errors.
- **Contact requirement:** The entrant's Telegram username was accepted by Colosseum.
- **Global submission is final:** team, project details, videos, founder profile and survey are locked. The live product link, access instructions and notes for judges can still change until the deadline.
- Both entries were submitted before **13 October 2026, 03:59 Brasília** (12 October, 23:59 California).
- Regional winner announcement is scheduled by **10 November 2026**. Continue checking official accounts and organizer communications.
- Mainnet payout wallet, KYC and prize-acceptance documents are **not completed** and apply only if organizers request them. No real-funds wallet was created. The demo uses only valueless test tokens.

[Regional rules](https://superteam.fun/earn/listing/side-track-superteam-brasil) · [Global FAQ](https://colosseum.com/hackathon) · [Official global rules](https://colosseum.com/legal/Crypto%20World%27s%20Fair%20Hackathon%20Rules.pdf) · [Colosseum terms](https://colosseum.com/legal/Colosseum%20-%20Terms%20of%20Service.pdf) · [Colosseum privacy](https://colosseum.com/legal/Colosseum%20-%20Privacy%20Policy.pdf) · [Earn terms](https://superteam.fun/earn/terms-of-use.pdf) · [Earn privacy](https://superteam.fun/earn/privacy-policy.pdf) · [Earn KYC/payout FAQ](https://docs.superteam.fun/the-superteam-handbook/community/faqs/superteam-earn-faq).

Submission receipt confirms entry, not selection for a prize. Organizer review and any winner verification remain outside the completed submission steps.
