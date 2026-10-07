import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findInvoicePayments } from '../src/discovery.js';
import { DEVNET_GENESIS_HASH, createReference, type Invoice, type RpcCall } from '../src/solana.js';
import { getBase58Decoder } from '@solana/kit';

const signatureA = getBase58Decoder().decode(new Uint8Array(64).fill(20));
const signatureB = getBase58Decoder().decode(new Uint8Array(64).fill(21));
function invoice(): Invoice {
  return {
    id: 'discovery-001', reference: createReference(), title: 'Public reference search',
    createdAt: new Date(Date.now() - 60_000).toISOString(), expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    recipients: [{ name: 'One', address: createReference(), amountAtomic: '1000' }, { name: 'Two', address: createReference(), amountAtomic: '1000' }],
  };
}

test('discovery uses only the public reference and preserves pending versus network errors', async () => {
  const input = invoice();
  const calls: Array<{ method: string; params: readonly unknown[] }> = [];
  const rpc: RpcCall = async (method, params) => {
    calls.push({ method, params });
    if (method === 'getGenesisHash') return DEVNET_GENESIS_HASH;
    if (method === 'getSignaturesForAddress') return [{ signature: signatureA }, { signature: signatureB }];
    if (method === 'getTransaction') {
      if (params[0] === signatureB) throw new Error('RPC is unavailable');
      return null;
    }
    if (method === 'getSignatureStatuses') return { value: [null] };
    throw new Error(`Unexpected RPC: ${method}`);
  };
  const result = await findInvoicePayments(input, { rpc, limit: 5 });
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.results.map((entry) => entry.status), ['pending', 'error']);
  assert.equal(result.warning, undefined);
  assert.deepEqual(calls.find((entry) => entry.method === 'getSignaturesForAddress')?.params, [input.reference, { limit: 5, commitment: 'confirmed' }]);
  assert.equal(JSON.stringify(calls).includes('private'), false);
});

test('history candidates never become valid receipts merely because a reference matches', async () => {
  const rpc: RpcCall = async (method) => {
    if (method === 'getGenesisHash') return DEVNET_GENESIS_HASH;
    if (method === 'getSignaturesForAddress') return [{ signature: 'malformed' }];
    throw new Error(`Unexpected RPC: ${method}`);
  };
  const result = await findInvoicePayments(invoice(), { rpc });
  assert.equal(result.status, 'complete');
  assert.equal(result.results[0].status, 'invalid');
  assert.equal(result.results[0].valid, false);
});

test('empty history is complete, not paid; outage and wrong network stop discovery', async () => {
  const empty: RpcCall = async (method) => method === 'getGenesisHash' ? DEVNET_GENESIS_HASH : [];
  const result = await findInvoicePayments(invoice(), { rpc: empty });
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.results, []);
  const outage = await findInvoicePayments(invoice(), { rpc: async () => { throw new Error('Offline'); } });
  assert.equal(outage.status, 'error');
  assert.match(outage.reasons[0], /Offline/);
  const calls: string[] = [];
  const wrongNetwork = await findInvoicePayments(invoice(), { rpc: async (method) => { calls.push(method); return 'not-devnet'; } });
  assert.equal(wrongNetwork.status, 'error');
  assert.deepEqual(calls, ['getGenesisHash']);
});

test('history limit is bounded and repeated RPC rows are verified once', async () => {
  const input = invoice();
  const calls: string[] = [];
  const rpc: RpcCall = async (method) => {
    calls.push(method);
    if (method === 'getGenesisHash') return DEVNET_GENESIS_HASH;
    if (method === 'getSignaturesForAddress') return [{ signature: signatureA }, { signature: signatureA }];
    if (method === 'getTransaction') return null;
    if (method === 'getSignatureStatuses') return { value: [null] };
    throw new Error(method);
  };
  const result = await findInvoicePayments(input, { rpc, limit: 2 });
  assert.equal(result.limitReached, true);
  assert.equal(result.results.length, 1);
  assert.equal(calls.filter((method) => method === 'getTransaction').length, 1);
  for (const limit of [0, 11, 1.5]) assert.equal((await findInvoicePayments(input, { rpc, limit })).status, 'error');
});
