import {
  DEVNET_RPC_URL,
  canonicalInvoice,
  checkGenesis,
  duplicatePaymentWarning,
  verifySignature,
  type Invoice,
  type NetworkOptions,
  type VerificationResult,
} from './solana.js';

export interface DiscoveryOptions extends NetworkOptions {
  /** Bounded public reference history, default 5, maximum 10. */
  limit?: number;
}

export interface InvoicePayments {
  status: 'complete' | 'error';
  reference: string;
  results: VerificationResult[];
  warning?: string;
  reasons: string[];
  /** True means more history might exist; it does not prove there are more payments. */
  limitReached: boolean;
}

async function referenceHistory(reference: string, limit: number, options: DiscoveryOptions): Promise<unknown> {
  const endpoint = options.rpcUrl ?? DEVNET_RPC_URL;
  const params = [reference, { limit, commitment: 'confirmed' }];
  if (options.rpc) return options.rpc('getSignaturesForAddress', params, endpoint);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 15_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(response.status === 429 ? 'Rede ocupada. Tente a busca novamente em alguns segundos.' : `RPC indisponível (HTTP ${response.status}).`);
    const payload = await response.json() as { result?: unknown; error?: { message?: string } };
    if (payload.error) throw new Error(payload.error.message ?? 'Erro RPC ao buscar pagamentos.');
    if (!Object.hasOwn(payload, 'result')) throw new Error('Resposta RPC sem histórico.');
    return payload.result;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

/** Public read-only discovery. References locate candidates; each still needs strict validation. */
export async function findInvoicePayments(invoice: Invoice, options: DiscoveryOptions = {}): Promise<InvoicePayments> {
  const response: InvoicePayments = {
    status: 'complete', reference: invoice.reference, results: [], reasons: [], limitReached: false,
  };
  try {
    canonicalInvoice(invoice);
    const limit = options.limit ?? 5;
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) throw new Error('A busca deve consultar de 1 a 10 assinaturas.');
    await checkGenesis(options);
    const history = await referenceHistory(invoice.reference, limit, options);
    if (!Array.isArray(history)) throw new Error('Histórico de pagamentos inválido.');
    response.limitReached = history.length >= limit;
    const signatures = new Set<string>();
    for (const entry of history.slice(0, limit)) {
      if (!entry || typeof entry !== 'object' || typeof entry.signature !== 'string') throw new Error('Histórico contém uma assinatura malformada.');
      signatures.add(entry.signature);
    }
    // Sequential verification bounds concurrent requests on the shared devnet RPC.
    for (const signature of signatures) {
      if (options.signal?.aborted) throw new Error('Busca de pagamentos cancelada.');
      response.results.push(await verifySignature(invoice, signature, options));
    }
    response.warning = duplicatePaymentWarning(response.results);
    if (response.limitReached) response.reasons.push('Limite de histórico atingido; podem existir outras transações.');
    return response;
  } catch (error) {
    response.status = 'error';
    response.reasons.push(error instanceof Error ? error.message : 'Não foi possível buscar pagamentos.');
    return response;
  }
}
