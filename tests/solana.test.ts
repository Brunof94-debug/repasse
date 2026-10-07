import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  address,
  getBase58Decoder,
} from '@solana/kit';
import {
  findAssociatedTokenPda,
  parseTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { MEMO_PROGRAM_ADDRESS, parseAddMemoInstruction } from '@solana-program/memo';
import {
  DEVNET_GENESIS_HASH,
  DEVNET_USDC_MINT,
  balance,
  buildSplitTransaction,
  canonicalInvoice,
  createReference,
  createSessionWallet,
  destroySessionWallet,
  duplicatePaymentWarning,
  fundTestSol,
  invoiceDigest,
  verifySignature,
  walletAddress,
  type Invoice,
  type RpcCall,
} from '../src/solana.js';

const SIGNATURE = getBase58Decoder().decode(new Uint8Array(64).fill(7));
const SECOND_SIGNATURE = getBase58Decoder().decode(new Uint8Array(64).fill(8));
const ATA_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const NOW = Date.now();

function invoice(): Invoice {
  return {
    id: 'invoice-001', reference: createReference(), title: 'Repasse de teste',
    createdAt: new Date(NOW - 60_000).toISOString(),
    expiresAt: new Date(NOW + 3_600_000).toISOString(),
    recipients: [
      { name: 'Ana', address: createReference(), amountAtomic: '120000' },
      { name: 'Bruno', address: createReference(), amountAtomic: '80000' },
    ],
  };
}

async function ata(owner: string): Promise<string> {
  return (await findAssociatedTokenPda({ owner: address(owner), mint: address(DEVNET_USDC_MINT), tokenProgram: TOKEN_PROGRAM_ADDRESS }))[0];
}

// This is intentionally a synthetic RPC fixture, never a published blockchain receipt.
async function proof(input = invoice()) {
  const payer = createReference();
  const source = await ata(payer);
  const destinations = await Promise.all(input.recipients.map((recipient) => ata(recipient.address)));
  const digest = await invoiceDigest(input);
  const keys = [payer, source, ...destinations, DEVNET_USDC_MINT, TOKEN_PROGRAM_ADDRESS, MEMO_PROGRAM_ADDRESS, ATA_PROGRAM, input.reference];
  const tokenBalance = (index: number, owner: string, amount: string) => ({
    accountIndex: index, mint: DEVNET_USDC_MINT, owner, programId: TOKEN_PROGRAM_ADDRESS,
    uiTokenAmount: { amount, decimals: 6, uiAmount: null, uiAmountString: '' },
  });
  const total = input.recipients.reduce((sum, recipient) => sum + BigInt(recipient.amountAtomic), 0n);
  const transaction = {
    slot: 508440475, blockTime: Math.floor(NOW / 1000), version: 0,
    transaction: {
      signatures: [SIGNATURE],
      message: {
        accountKeys: keys.map((pubkey, index) => ({ pubkey, signer: index === 0, writable: index < destinations.length + 2 })),
        instructions: [
          ...input.recipients.flatMap((recipient, index) => [
            { programId: ATA_PROGRAM, program: 'spl-associated-token-account', parsed: { type: 'createIdempotent', info: { account: destinations[index], wallet: recipient.address, mint: DEVNET_USDC_MINT, source: payer, tokenProgram: TOKEN_PROGRAM_ADDRESS } } },
            { programId: TOKEN_PROGRAM_ADDRESS, program: 'spl-token', parsed: { type: 'transferChecked', info: { authority: payer, source, destination: destinations[index], mint: DEVNET_USDC_MINT, tokenAmount: { amount: recipient.amountAtomic, decimals: 6 } } } },
          ]),
          { programId: MEMO_PROGRAM_ADDRESS, program: 'spl-memo', parsed: `REPASSE:v1:${digest}:${input.reference}` },
        ],
      },
    },
    meta: {
      err: null, innerInstructions: [],
      preTokenBalances: [tokenBalance(1, payer, '1000000')],
      postTokenBalances: [
        tokenBalance(1, payer, (1_000_000n - total).toString()),
        ...input.recipients.map((recipient, index) => tokenBalance(index + 2, recipient.address, recipient.amountAtomic)),
      ],
    },
  };
  let status: unknown = { err: null, confirmationStatus: 'finalized', slot: transaction.slot };
  let returnedTransaction: unknown = transaction;
  let genesis = DEVNET_GENESIS_HASH;
  let networkError = false;
  const calls: string[] = [];
  const rpc: RpcCall = async (method) => {
    calls.push(method);
    if (networkError) throw new Error('RPC fora do ar');
    if (method === 'getGenesisHash') return genesis;
    if (method === 'getTransaction') return returnedTransaction;
    if (method === 'getSignatureStatuses') return { value: [status] };
    throw new Error(`Unexpected RPC call: ${method}`);
  };
  return {
    invoice: input, transaction, rpc, calls, destinations, payer, source,
    setStatus(value: unknown) { status = value; },
    setTransaction(value: unknown) { returnedTransaction = value; },
    setGenesis(value: string) { genesis = value; },
    failNetwork() { networkError = true; },
  };
}

test('canonical invoice commits names, title, order, dates, reference and exact integer amounts', async () => {
  const input = invoice();
  const canonical = JSON.parse(canonicalInvoice(input));
  assert.equal(canonical.network, 'solana-devnet');
  assert.equal(canonical.mint, DEVNET_USDC_MINT);
  const digest = await invoiceDigest(input);
  assert.match(digest, /^[a-f0-9]{64}$/);
  for (const altered of [
    { ...input, title: 'Outro projeto' },
    { ...input, reference: createReference() },
    { ...input, expiresAt: new Date(NOW + 7_200_000).toISOString() },
    { ...input, recipients: [...input.recipients].reverse() },
    { ...input, recipients: input.recipients.map((recipient, index) => index === 0 ? { ...recipient, name: 'Outro nome' } : recipient) },
    { ...input, recipients: input.recipients.map((recipient, index) => index === 0 ? { ...recipient, amountAtomic: '120001' } : recipient) },
  ]) assert.notEqual(await invoiceDigest(altered), digest);
  assert.equal(await invoiceDigest({ ...input, title: ` ${input.title} ` }), digest);
});

test('reject malformed domain inputs before a transaction can be built', () => {
  const input = invoice();
  assert.throws(() => canonicalInvoice({ ...input, recipients: input.recipients.slice(0, 1) }));
  assert.throws(() => canonicalInvoice({ ...input, recipients: Array(5).fill(input.recipients[0]) }));
  assert.throws(() => canonicalInvoice({ ...input, recipients: [input.recipients[0], input.recipients[0]] }));
  for (const amountAtomic of ['-1', '0', '1.2', '001', '18446744073709551616']) {
    assert.throws(() => canonicalInvoice({ ...input, recipients: [{ ...input.recipients[0], amountAtomic }, input.recipients[1]] }));
  }
  assert.throws(() => canonicalInvoice({ ...input, expiresAt: input.createdAt }));
  assert.throws(() => canonicalInvoice({ ...input, reference: 'invalid' }));
});

test('session handle serializes only public metadata and explicit disposal removes signing capability', async () => {
  const wallet = await createSessionWallet();
  assert.deepEqual(Object.keys(wallet).sort(), ['address', 'createdAt', 'testOnly']);
  assert.equal(walletAddress(wallet), wallet.address);
  assert.equal(JSON.stringify(wallet).includes('private'), false);
  destroySessionWallet(wallet);
  assert.throws(() => walletAddress(wallet), /Sessão expirada/);
});

test('builder emits one atomic instruction list with direct transfers, readonly reference and digest-only memo', async () => {
  const wallet = await createSessionWallet();
  const input = invoice();
  const built = await buildSplitTransaction(input, wallet);
  assert.equal(built.instructions.length, 5);
  assert.equal(built.totalAtomic, 200000n);
  const transfers = built.instructions.filter((instruction) => instruction.programAddress === TOKEN_PROGRAM_ADDRESS);
  assert.equal(transfers.length, 2);
  for (const [index, transfer] of transfers.entries()) {
    const parsed = parseTransferCheckedInstruction(transfer as Parameters<typeof parseTransferCheckedInstruction>[0]);
    assert.equal(parsed.data.amount, BigInt(input.recipients[index].amountAtomic));
    assert.equal(parsed.data.decimals, 6);
    assert.equal(parsed.accounts.mint.address, DEVNET_USDC_MINT);
    assert.equal(parsed.accounts.destination.address, await ata(input.recipients[index].address));
    assert.equal(transfer.accounts?.at(-1)?.address, input.reference);
    assert.equal(transfer.accounts?.at(-1)?.role, 0);
  }
  const memoInstruction = built.instructions.find((instruction) => instruction.programAddress === MEMO_PROGRAM_ADDRESS)!;
  const memo = parseAddMemoInstruction(memoInstruction as Parameters<typeof parseAddMemoInstruction>[0]).data.memo;
  assert.equal(memo, `REPASSE:v1:${await invoiceDigest(input)}:${input.reference}`);
  assert.equal(memo.includes(input.title), false);
  assert.equal(memo.includes(input.recipients[0].name), false);
  await assert.rejects(() => buildSplitTransaction({ ...input, expiresAt: new Date(NOW - 1000).toISOString() }, wallet), /expirou/);
  await assert.rejects(() => buildSplitTransaction({ ...input, recipients: [{ ...input.recipients[0], address: wallet.address }, input.recipients[1]] }, wallet), /pagadora/);
  destroySessionWallet(wallet);
});

test('strict verifier accepts a finalized split with exact owners and token deltas', async () => {
  const fixture = await proof();
  const result = await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc });
  assert.equal(result.status, 'finalized', result.reasons.join('; '));
  assert.equal(result.valid, true);
  assert.equal(result.sender, fixture.payer);
  assert.equal(result.recipients?.length, 2);
  assert.equal(result.recipients?.[0].receivedAtomic, '120000');
  assert.equal(result.crossChecked, false);
  assert.match(result.explorerUrl, /cluster=devnet$/);
});

test('confirmed is not a finalized receipt; missing/processed/indexing states remain pending', async () => {
  const fixture = await proof();
  fixture.setStatus({ err: null, confirmationStatus: 'confirmed' });
  const confirmed = await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc });
  assert.equal(confirmed.status, 'confirmed');
  assert.equal(confirmed.valid, false);
  fixture.setStatus({ err: null, confirmationStatus: 'processed' });
  assert.equal((await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc })).status, 'pending');
  fixture.setStatus(null);
  assert.equal((await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc })).status, 'pending');
  fixture.setStatus({ err: null, confirmationStatus: 'finalized' });
  fixture.setTransaction(null);
  assert.equal((await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc })).status, 'pending');
});

test('RPC outage is an error; wrong chain and failed execution are invalid proofs', async () => {
  const outage = await proof();
  outage.failNetwork();
  assert.equal((await verifySignature(outage.invoice, SIGNATURE, { rpc: outage.rpc })).status, 'error');
  const wrongChain = await proof();
  wrongChain.setGenesis('mainnet-genesis');
  const wrong = await verifySignature(wrongChain.invoice, SIGNATURE, { rpc: wrongChain.rpc });
  assert.equal(wrong.status, 'invalid');
  assert.deepEqual(wrongChain.calls, ['getGenesisHash']);
  const failed = await proof();
  failed.setStatus({ err: { InstructionError: [1, 'InsufficientFunds'] }, confirmationStatus: 'finalized' });
  assert.equal((await verifySignature(failed.invoice, SIGNATURE, { rpc: failed.rpc })).status, 'invalid');
});

test('reject altered memo digest/reference, wrong token and direct transfer amounts', async () => {
  for (const mutation of ['memo', 'reference', 'mint', 'amount', 'owner', 'delta', 'debit', 'missing', 'extra', 'authority', 'outside']) {
    const fixture = await proof();
    const instructions = fixture.transaction.transaction.message.instructions as any[];
    if (mutation === 'memo') instructions.at(-1).parsed += ':altered';
    if (mutation === 'reference') fixture.transaction.transaction.message.accountKeys.at(-1)!.pubkey = createReference();
    if (mutation === 'mint') instructions[1].parsed.info.mint = createReference();
    if (mutation === 'amount') instructions[1].parsed.info.tokenAmount.amount = '120001';
    if (mutation === 'owner') fixture.transaction.meta.postTokenBalances[1].owner = createReference();
    if (mutation === 'delta') fixture.transaction.meta.postTokenBalances[1].uiTokenAmount.amount = '119999';
    if (mutation === 'debit') fixture.transaction.meta.postTokenBalances[0].uiTokenAmount.amount = '799999';
    if (mutation === 'missing') instructions.splice(1, 1);
    if (mutation === 'extra') instructions.push(structuredClone(instructions[1]));
    if (mutation === 'authority') instructions[1].parsed.info.authority = createReference();
    if (mutation === 'outside') fixture.transaction.blockTime = Math.floor(new Date(fixture.invoice.expiresAt).getTime() / 1000) + 1;
    const result = await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc });
    assert.equal(result.status, 'invalid', `${mutation}: ${result.reasons.join('; ')}`);
    assert.equal(result.valid, false);
  }
  const fixture = await proof();
  assert.equal((await verifySignature({ ...fixture.invoice, title: 'Alterada' }, SIGNATURE, { rpc: fixture.rpc })).status, 'invalid');
  assert.equal((await verifySignature(fixture.invoice, 'not-a-signature', { rpc: fixture.rpc })).status, 'invalid');
});

test('new ATA needs an explicit correct creation; existing ATA verifies delta rather than final balance', async () => {
  const fixture = await proof();
  const instructions = fixture.transaction.transaction.message.instructions;
  instructions.splice(0, 1);
  assert.equal((await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc })).status, 'invalid');
  fixture.transaction.meta.preTokenBalances.push({
    ...structuredClone(fixture.transaction.meta.postTokenBalances[1]),
    uiTokenAmount: { ...fixture.transaction.meta.postTokenBalances[1].uiTokenAmount, amount: '60000' },
  });
  fixture.transaction.meta.postTokenBalances[1].uiTokenAmount.amount = '180000';
  assert.equal((await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc })).status, 'finalized');
});

test('an invoice expired now can still prove an earlier payment inside its validity window', async () => {
  const input = invoice();
  input.createdAt = new Date(NOW - 86_400_000).toISOString();
  input.expiresAt = new Date(NOW - 43_200_000).toISOString();
  const fixture = await proof(input);
  fixture.transaction.blockTime = Math.floor((NOW - 60_000_000) / 1000);
  assert.equal((await verifySignature(input, SIGNATURE, { rpc: fixture.rpc })).status, 'finalized');
});

test('independent second RPC validates the same proof; wrong-chain secondary never cross-checks', async () => {
  const fixture = await proof();
  const result = await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc, secondaryRpcUrl: 'https://independent-rpc.example.test' });
  assert.equal(result.valid, true);
  assert.equal(result.crossChecked, true);
  const sameHost = await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc, secondaryRpcUrl: 'https://api.devnet.solana.com/second' });
  assert.equal(sameHost.crossChecked, false);
  assert.ok(sameHost.warnings.length);
  const wrongChainRpc: RpcCall = (method, params, endpoint) => endpoint.includes('independent') && method === 'getGenesisHash'
    ? Promise.resolve('wrong-chain') : fixture.rpc(method, params, endpoint);
  assert.equal((await verifySignature(fixture.invoice, SIGNATURE, { rpc: wrongChainRpc, secondaryRpcUrl: 'https://independent-rpc.example.test' })).status, 'invalid');
});

test('duplicate helper warns about two valid transactions without claiming replay prevention', async () => {
  const fixture = await proof();
  const result = await verifySignature(fixture.invoice, SIGNATURE, { rpc: fixture.rpc });
  assert.equal(duplicatePaymentWarning([result, result]), undefined);
  assert.match(duplicatePaymentWarning([result, { ...result, signature: SECOND_SIGNATURE }])!, /não impede pagamentos repetidos/);
});

test('funding and balance are devnet-only and do not export or transmit a private key', async () => {
  const wallet = await createSessionWallet();
  const calls: Array<{ method: string; params: readonly unknown[] }> = [];
  const rpc: RpcCall = async (method, params) => {
    calls.push({ method, params });
    if (method === 'getGenesisHash') return DEVNET_GENESIS_HASH;
    if (method === 'requestAirdrop') return SIGNATURE;
    if (method === 'getBalance') return { value: 50_000_000 };
    if (method === 'getAccountInfo') return { value: null };
    throw new Error(method);
  };
  assert.equal(await fundTestSol(wallet, { rpc }), SIGNATURE);
  assert.deepEqual(calls[1], { method: 'requestAirdrop', params: [wallet.address, 50_000_000] });
  assert.deepEqual(await balance(wallet, { rpc }), { solLamports: 50_000_000n, usdcAtomic: 0n });
  assert.equal(JSON.stringify(calls).includes('private'), false);
  await assert.rejects(() => fundTestSol(wallet, { rpc: async () => 'mainnet-genesis' }), /não é a Solana devnet/);
  destroySessionWallet(wallet);
});

async function realRpcFixture() {
  const saved = JSON.parse(await readFile(new URL('./fixtures/real-split-rpc.json', import.meta.url), 'utf8'));
  const rpc: RpcCall = async (method) => {
    if (method === 'getGenesisHash') return saved.genesisHash;
    if (method === 'getTransaction') return saved.transaction;
    if (method === 'getSignatureStatuses') return saved.status;
    throw new Error(`Unexpected RPC method: ${method}`);
  };
  return { saved, rpc };
}

test('actual devnet RPC fixture accepts parser multisigAuthority label only because the authority itself signed', async () => {
  const { saved, rpc } = await realRpcFixture();
  const result = await verifySignature(saved.invoice, saved.signature, { rpc });
  assert.equal(result.status, 'finalized', result.reasons.join('; '));
  assert.equal(result.valid, true);
  assert.equal(result.slot, 508446011);
  assert.equal(result.digest, '896b56164ba552bb5212347eb0a695aab1a2c2104f1d79584142985fc8e4773c');
  assert.deepEqual(result.recipients?.map((recipient) => recipient.receivedAtomic), ['4000000', '3000000', '2000000']);
  const transfers = saved.transaction.transaction.message.instructions.filter((instruction: any) => instruction.programId === TOKEN_PROGRAM_ADDRESS);
  assert.equal(transfers.every((instruction: any) => instruction.parsed.info.multisigAuthority === result.sender), true);
});

test('parser multisigAuthority fallback rejects an unsigned authority and retains source-owner checks', async () => {
  const unsigned = await realRpcFixture();
  unsigned.saved.transaction.transaction.message.accountKeys[0].signer = false;
  assert.equal((await verifySignature(unsigned.saved.invoice, unsigned.saved.signature, { rpc: unsigned.rpc })).status, 'invalid');
  const wrongOwner = await realRpcFixture();
  wrongOwner.saved.transaction.meta.preTokenBalances[0].owner = createReference();
  assert.equal((await verifySignature(wrongOwner.saved.invoice, wrongOwner.saved.signature, { rpc: wrongOwner.rpc })).status, 'invalid');
  const conflicting = await realRpcFixture();
  conflicting.saved.transaction.transaction.message.instructions[2].parsed.info.authority = createReference();
  assert.equal((await verifySignature(conflicting.saved.invoice, conflicting.saved.signature, { rpc: conflicting.rpc })).status, 'invalid');
});
