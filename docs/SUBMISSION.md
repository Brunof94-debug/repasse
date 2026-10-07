# REPASSE — submission drafts

Status: **Submission drafts in progress; not submitted.** Repository and app published; a real devnet payment has been audited and verified from the public app. English regional pitch (2:31) and demo (2:04) are published and browser playback was checked. A separate global pitch is ready at exactly 120.000 seconds. Eligibility is confirmed. Colosseum and Earn accounts/profiles are created; Colosseum hackathon registration, Code of Ethics acceptance and the required Telegram contact are complete. The project draft exists on Colosseum. Final YouTube video hosting and both submissions remain **PENDING**.

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
| English global pitch, maximum 2 minutes | [Global pitch player](https://brunof94-debug.github.io/repasse/global-pitch.html) — 120.000 seconds, local export verified; publication in progress |
| English regional pitch, 2–3 minutes | [Watch pitch](https://brunof94-debug.github.io/repasse/pitch.html) — 151.04 seconds, public playback verified |
| English demo, maximum 3 minutes | [Watch demo](https://brunof94-debug.github.io/repasse/demo.html) — 123.97 seconds, public playback verified |
| Colosseum project link | [REPASSE draft](https://colosseum.com/arena/projects/repasse) — **not submitted yet** |
| Product social accounts | None supplied or created |

## Superteam Brasil / SolarEcoFund — Portuguese

**REPASSE — um job pago, as partes de todos conciliadas.**

Protótipo em Solana devnet para pequenos estúdios que recebem USDC e trabalham com 2–4 colaboradores. O pagador revisa uma divisão acordada e assina uma transação atômica com repasses diretos. O comprovante verifica rede, mint, destinatários, valores e memo com o digest da cobrança. Uma transação real de **9 USDC de teste** distribuiu **4 / 3 / 2**, com prova e auditoria públicas no repositório.

**Equipe:** Bruno Fernandes, Brasil, solo, programação intermediária, desenvolvimento e materiais com assistência de IA.  
**Categoria:** pagamentos/stablecoins.  
**Estágio:** protótipo devnet; tokens sem valor financeiro. Demanda, usuários e receita não validados.  
**Negócio:** hipótese de atender estúdios brasileiros já familiarizados com stablecoins; entrevistas, pilotos e preço ainda por validar.

**Link principal Earn:** **PENDING** — usar a página do projeto Colosseum após a submissão global. Repositório e prova acima; app e vídeos com os estados indicados na tabela.

## Remaining registration/submission steps

- **Confirmed by the entrant:** residence in Brazil, age 18 or older on **14 September 2026**, intermediate programming experience, and no external financing for REPASSE.
- **Completed:** Colosseum account and Arena profile as **brunof94_debug**, Crypto World's Fair registration (Brazil/Solana), Code of Ethics acceptance, submission founder profile, and Earn account/profile with the same public handle. The entrant authorized the official terms/privacy and global rules. No project submission has been sent.
- **Video requirements verified in the actual form:** Colosseum requires YouTube/Loom/Vimeo demo up to 3 minutes and a separate pitch up to 2 minutes. The Brazilian listing requests a 2–3 minute pitch. A global variant is ready at exactly 120.000 seconds; the 2:31 regional pitch remains available.
- **Contact requirement:** The entrant's Telegram username was accepted by Colosseum.
- Submit the reviewed English global materials, then the Brazilian track with the Colosseum project link.
- Deadline for both: **13 October 2026, 03:59 Brasília** (12 October, 23:59 California).
- Mainnet payout wallet, KYC and prize-acceptance documents are **PENDING** if required. A test signing session does not complete these requirements.

[Regional rules](https://superteam.fun/earn/listing/side-track-superteam-brasil) · [Global FAQ](https://colosseum.com/hackathon) · [Official global rules](https://colosseum.com/legal/Crypto%20World%27s%20Fair%20Hackathon%20Rules.pdf) · [Colosseum terms](https://colosseum.com/legal/Colosseum%20-%20Terms%20of%20Service.pdf) · [Colosseum privacy](https://colosseum.com/legal/Colosseum%20-%20Privacy%20Policy.pdf) · [Earn terms](https://superteam.fun/earn/terms-of-use.pdf) · [Earn privacy](https://superteam.fun/earn/privacy-policy.pdf) · [Earn KYC/payout FAQ](https://docs.superteam.fun/the-superteam-handbook/community/faqs/superteam-earn-faq).

Acceptance of a devnet-only demo is not expressly guaranteed in the rules. Final form questions and individual KYC requirements must be checked in the actual accounts.
