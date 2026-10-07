# REPASSE — public devnet payment proof

This is a real, successful Solana **devnet** transaction made with test tokens. It is not a mainnet payment or a transfer of money with financial value. Circle identifies this devnet mint as its test USDC; testnet USDC has no financial value and is not backed by US dollars. [Circle contract addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses).

## Transaction

- Signature: `2ypiteP4b9kdMAgNNpoVh5XwWfR8wH1rFRQojsZYTThXKDxAkBzXsMiy8P5n3mDqSn5rzGbTMf1gzVHg5iyTTFEn`
- [Open this transaction in Solana Explorer, devnet](https://explorer.solana.com/tx/2ypiteP4b9kdMAgNNpoVh5XwWfR8wH1rFRQojsZYTThXKDxAkBzXsMiy8P5n3mDqSn5rzGbTMf1gzVHg5iyTTFEn?cluster=devnet).
- Execution: `meta.err: null`.
- Finality observed: `finalized`.
- Transaction slot: `508446011`.
- On-chain block time: `2026-10-07T11:53:55Z`, or **7 October 2026, 08:53:55 BRT (UTC−03:00)**.
- Public RPC snapshot captured: `2026-10-07T11:55:49.0714179Z`.
- RPC: `https://api.devnet.solana.com`.
- Devnet genesis: `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`.
- Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.
- Token program: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`; precision: **6 decimals**.
- Payer: `Gi1pnTspHWvD3rgpEzCM56QuKa7u7NxfsARTVwenZ4Sj`.
- Payer's USDC token account: `Epd6ahsCWwSihfTXfjQcTLiLw67G6Xct5cTsStq9w922`.

The payer's recorded balance changed from **20,000,000** to **11,000,000** atomic units: a debit of **9,000,000**, equal to **9 USDC of test tokens**. The transaction contains three direct `TransferChecked` instructions, destination account creation instructions, a compute budget instruction and one memo. They executed in one transaction.

## Recipient credits

The following destination accounts had no prior token-balance entry and were created by explicit associated-token-account instructions in this transaction. Their recorded final balances match the invoice exactly.

| Invoice label | Public recipient address | Destination token account | Atomic credit | Test USDC credit |
|---|---|---|---:|---:|
| Design | `DmiEoX2pvQDrjSjfsfGJxFSzFLBwWwA9w9LueyNw3WFC` | `AyNboBY1jz31GvQ4gwNgGBSNPREF7T9a9LtuWWG1RCQK` | 4,000,000 | 4.000000 |
| Dev | `Fz2MggnL9uYWDHQCMd5QvAnAqXgnXsGU62vgfHMerAcd` | `5du1GeibgzLCRzgktMcEfeuuK8AhsfS4rYWSA7BkC6fU` | 3,000,000 | 3.000000 |
| Content | `BvMVwzzvrQUhyJT5RfUpnqeKuJ8Ywhpnpizk8vVLnVm2` | `B3HqZzr18LDNFZTTKAJo8iZfDtcqbHWSqLAy3MwKDHDG` | 2,000,000 | 2.000000 |

## Invoice binding

- Invoice ID: `dd13b6cf-cd21-4d1e-8419-077fd113adc1`.
- Title stored in the public off-chain invoice: `Brand identity · Studio 003`.
- Created: `2026-10-07T11:42:25.968Z`.
- Expires: `2026-10-14T11:42:25.968Z`.
- Public reference: `EtGQHhE7NQw6CuVe7HQaPKbLdX3AK8CUGHNxWx65jRCi`.
- SHA-256 digest: `896b56164ba552bb5212347eb0a695aab1a2c2104f1d79584142985fc8e4773c`.

Exact on-chain memo:

```text
REPASSE:v1:896b56164ba552bb5212347eb0a695aab1a2c2104f1d79584142985fc8e4773c:EtGQHhE7NQw6CuVe7HQaPKbLdX3AK8CUGHNxWx65jRCi
```

The digest commits the canonical invoice version, network, mint, ID, reference, title, dates, recipient names, addresses, order and integer amounts. Names and title are present in the public invoice file; they are represented by the digest in the on-chain memo. Altering those invoice fields makes the verifier reject this transaction as its receipt.

## Reproduce the read-only audit

From the project directory:

```sh
npm install
npx tsx scripts/audit-proof.ts public/demo-proof.json
```

The audit reads public data and submits no transaction. The observed result was `status: "finalized"`, `valid: true`, the digest above and all three exact recipient credits. Verification checks the devnet genesis, transaction signature, execution success, finality, invoice validity window, memo, reference, direct transfers, mint, decimals, associated-account addresses, owners, destination balance increases and total payer debit.

Only the public Solana RPC was used for this recorded audit; **no independent second-provider confirmation is claimed**. A second devnet RPC can be configured with `REPASSE_SECONDARY_DEVNET_RPC_URL` when running the audit.

Public artifacts:

- [Invoice and signature](../public/demo-proof.json).
- [Reduced real RPC snapshot and provenance](../tests/fixtures/real-split-rpc.json).
- [Read-only audit script](../scripts/audit-proof.ts).

The RPC snapshot omits unrelated logs, inner instructions, SOL balances and fee fields. It retains the actual fields used by the verifier. Offline regression tests replay it, including the RPC parser's `multisigAuthority` label caused by the extra reference account. The verifier accepts that label only when the authority itself is a transaction signer; removing that signature or changing the source owner is rejected.

No private key is included in these artifacts. The app's test signing session keeps its key only in memory. This receipt proves this particular test payment; it does not prevent another payment for the same invoice, guarantee future RPC availability, or turn the prototype into a production settlement service. Devnet history can be reset. [Solana cluster documentation](https://solana.com/docs/references/clusters).
