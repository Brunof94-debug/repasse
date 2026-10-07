import {
  AccountRole,
  address,
  createClient,
  generateKeyPairSigner,
  getAddressDecoder,
  getBase58Encoder,
  type Instruction,
  type KeyPairSigner,
} from '@solana/kit';
import { solanaRpc } from '@solana/kit-plugin-rpc';
import { signer as signerPlugin } from '@solana/kit-plugin-signer';
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { getAddMemoInstruction, MEMO_PROGRAM_ADDRESS } from '@solana-program/memo';

export const DEVNET_RPC_URL = 'https://api.devnet.solana.com';
export const DEVNET_USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
export const DEVNET_GENESIS_HASH = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
export const USDC_DECIMALS = 6;
const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const COMPUTE_BUDGET_PROGRAM = 'ComputeBudget111111111111111111111111111111';
const MAX_U64 = (1n << 64n) - 1n;

export interface InvoiceRecipient {
  name: string;
  address: string;
  /** Integer micro-USDC, never a floating-point currency amount. */
  amountAtomic: string;
}

export interface Invoice {
  id: string;
  reference: string;
  title: string;
  createdAt: string;
  expiresAt: string;
  recipients: InvoiceRecipient[];
}

/** Public handle only. Secret CryptoKeys stay in this module's WeakMap. */
export interface SessionWallet {
  readonly address: string;
  readonly createdAt: number;
  readonly testOnly: true;
}
const sessionSigners = new WeakMap<SessionWallet, KeyPairSigner>();

export type RpcCall = (
  method: string,
  params: readonly unknown[],
  endpoint: string,
) => Promise<unknown>;

export interface NetworkOptions {
  rpcUrl?: string;
  /** Optional independent provider; the verifier rejects another network. */
  secondaryRpcUrl?: string;
  /** Read-only transport injection for deterministic tests. */
  rpc?: RpcCall;
  signal?: AbortSignal;
}

export interface WalletBalance {
  solLamports: bigint;
  usdcAtomic: bigint;
}

export interface BuiltSplitTransaction {
  readonly instructions: readonly Instruction[];
  readonly digest: string;
  readonly reference: string;
  readonly memo: string;
  readonly totalAtomic: bigint;
  readonly senderAddress: string;
}

export type VerificationStatus = 'pending' | 'confirmed' | 'finalized' | 'invalid' | 'error';
export interface VerifiedRecipient extends InvoiceRecipient {
  tokenAccount: string;
  receivedAtomic: string;
}
export interface VerificationResult {
  status: VerificationStatus;
  /** True only for a successful, strictly validated finalized transaction. */
  valid: boolean;
  signature: string;
  digest?: string;
  reference?: string;
  slot?: number;
  blockTime?: number;
  sender?: string;
  recipients?: VerifiedRecipient[];
  reasons: string[];
  warnings: string[];
  rpcUrl: string;
  crossChecked: boolean;
  explorerUrl: string;
}

class RpcError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message);
    this.name = 'RpcError';
  }
}
class InvalidProof extends Error {}

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidProof('Resposta da rede incompleta ou malformada.');
  }
  return value as Record<string, unknown>;
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new InvalidProof('Dados da transação incompletos.');
  return value;
}
function integerAmount(value: unknown): bigint {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value)) {
    throw new InvalidProof('Quantidade de tokens inválida.');
  }
  return BigInt(value);
}
function asAddress(value: string): string {
  return address(value);
}
function checkedText(value: string, max: number, field: string): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new Error(`${field} inválido.`);
  }
  return value.trim();
}

/** Canonical public invoice data. Names/title are hashed, never copied into the memo. */
export function canonicalInvoice(invoice: Invoice): string {
  const id = checkedText(invoice.id, 80, 'Identificador');
  const reference = asAddress(invoice.reference);
  const title = checkedText(invoice.title, 120, 'Título');
  const created = new Date(invoice.createdAt);
  const expires = new Date(invoice.expiresAt);
  if (!Number.isFinite(created.getTime()) || !Number.isFinite(expires.getTime()) || expires <= created) {
    throw new Error('Datas da cobrança inválidas.');
  }
  if (!Array.isArray(invoice.recipients) || invoice.recipients.length < 2 || invoice.recipients.length > 4) {
    throw new Error('A cobrança deve ter de 2 a 4 colaboradores.');
  }
  const seen = new Set<string>();
  let total = 0n;
  const recipients = invoice.recipients.map((recipient) => {
    const recipientAddress = asAddress(recipient.address);
    if (seen.has(recipientAddress)) throw new Error('Colaboradores devem ter endereços diferentes.');
    seen.add(recipientAddress);
    const amount = integerAmount(recipient.amountAtomic);
    if (amount <= 0n || amount > MAX_U64) throw new Error('Valor do repasse inválido.');
    total += amount;
    return {
      name: checkedText(recipient.name, 80, 'Nome'),
      address: recipientAddress,
      amountAtomic: amount.toString(),
    };
  });
  if (total > MAX_U64) throw new Error('Total da cobrança inválido.');
  return JSON.stringify({
    version: 1,
    network: 'solana-devnet',
    mint: DEVNET_USDC_MINT,
    id,
    reference,
    title,
    createdAt: created.toISOString(),
    expiresAt: expires.toISOString(),
    recipients,
  });
}

export async function invoiceDigest(invoice: Invoice): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalInvoice(invoice));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Random public reference, not a wallet and not a signing key. */
export function createReference(): string {
  return getAddressDecoder().decode(crypto.getRandomValues(new Uint8Array(32)));
}

export async function createSessionWallet(): Promise<SessionWallet> {
  const keypair = await generateKeyPairSigner();
  const wallet: SessionWallet = Object.freeze({
    address: keypair.address,
    createdAt: Date.now(),
    testOnly: true as const,
  });
  sessionSigners.set(wallet, keypair);
  return wallet;
}

export function walletAddress(wallet: SessionWallet): string {
  if (!sessionSigners.has(wallet)) throw new Error('Sessão expirada. Crie uma nova carteira de teste.');
  return wallet.address;
}

/** Explicit disposal; refreshing the page also drops every in-memory key. */
export function destroySessionWallet(wallet: SessionWallet): void {
  sessionSigners.delete(wallet);
}

export function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;
}

function rpcUrl(options: NetworkOptions): string {
  const endpoint = options.rpcUrl ?? DEVNET_RPC_URL;
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new Error('Use um endpoint RPC HTTPS da devnet.');
  }
  return endpoint;
}

async function callRpc(method: string, params: readonly unknown[], options: NetworkOptions, endpoint = rpcUrl(options)): Promise<unknown> {
  if (options.rpc) return options.rpc(method, params, endpoint);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 15_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const retry = response.headers.get('Retry-After');
      throw new RpcError(response.status === 429
        ? `Rede ocupada. Tente novamente${retry ? ` após ${retry} segundos` : ' em alguns segundos'}.`
        : `RPC indisponível (HTTP ${response.status}).`);
    }
    const payload = object(await response.json());
    if (payload.error) {
      const error = object(payload.error);
      throw new RpcError(String(error.message ?? 'Erro RPC.'), Number(error.code));
    }
    if (!Object.hasOwn(payload, 'result')) throw new RpcError('Resposta RPC sem resultado.');
    return payload.result;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

export async function checkGenesis(options: NetworkOptions = {}): Promise<void> {
  const hash = await callRpc('getGenesisHash', [], options);
  if (hash !== DEVNET_GENESIS_HASH) throw new InvalidProof('A rede consultada não é a Solana devnet. Operação bloqueada.');
}

/** Requests free test SOL only; the returned signature still needs confirmation. */
export async function fundTestSol(wallet: SessionWallet, options: NetworkOptions = {}): Promise<string> {
  const recipient = walletAddress(wallet);
  await checkGenesis(options);
  const result = await callRpc('requestAirdrop', [recipient, 50_000_000], options);
  if (typeof result !== 'string') throw new RpcError('Airdrop não retornou assinatura.');
  return result;
}

async function tokenAccount(owner: string): Promise<string> {
  const [ata] = await findAssociatedTokenPda({
    owner: address(owner),
    mint: address(DEVNET_USDC_MINT),
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  return ata;
}

export async function balance(wallet: SessionWallet | string, options: NetworkOptions = {}): Promise<WalletBalance> {
  const owner = typeof wallet === 'string' ? asAddress(wallet) : walletAddress(wallet);
  await checkGenesis(options);
  const ata = await tokenAccount(owner);
  const [solResponse, tokenResponse] = await Promise.all([
    callRpc('getBalance', [owner, { commitment: 'confirmed' }], options),
    callRpc('getAccountInfo', [ata, { encoding: 'jsonParsed', commitment: 'confirmed' }], options),
  ]);
  const solValue = object(solResponse).value;
  if (typeof solValue !== 'number' || !Number.isSafeInteger(solValue) || solValue < 0) {
    throw new RpcError('Saldo SOL inválido.');
  }
  const value = object(tokenResponse).value;
  let usdcAtomic = 0n;
  if (value !== null) {
    const account = object(value);
    const info = object(object(object(account.data).parsed).info);
    const amount = object(info.tokenAmount);
    if (account.owner !== TOKEN_PROGRAM_ADDRESS || info.owner !== owner || info.mint !== DEVNET_USDC_MINT || amount.decimals !== USDC_DECIMALS) {
      throw new InvalidProof('A conta consultada não corresponde ao USDC devnet esperado.');
    }
    usdcAtomic = integerAmount(amount.amount);
  }
  return { solLamports: BigInt(solValue), usdcAtomic };
}

export async function buildSplitTransaction(invoice: Invoice, wallet: SessionWallet): Promise<BuiltSplitTransaction> {
  const publicAddress = walletAddress(wallet);
  const signingKey = sessionSigners.get(wallet)!;
  const canonical = JSON.parse(canonicalInvoice(invoice)) as Invoice;
  if (new Date(canonical.expiresAt).getTime() <= Date.now()) throw new Error('Esta cobrança expirou.');
  if (new Date(canonical.createdAt).getTime() > Date.now() + 60_000) throw new Error('Data de criação da cobrança está no futuro.');
  if (canonical.recipients.some((recipient) => recipient.address === publicAddress)) {
    throw new Error('A carteira pagadora não pode ser um dos colaboradores desta demonstração.');
  }
  const digest = await invoiceDigest(invoice);
  const memo = `REPASSE:v1:${digest}:${canonical.reference}`;
  const source = address(await tokenAccount(publicAddress));
  const instructions: Instruction[] = [];
  for (const recipient of canonical.recipients) {
    const destination = address(await tokenAccount(recipient.address));
    instructions.push(getCreateAssociatedTokenIdempotentInstruction({
      payer: signingKey,
      ata: destination,
      owner: address(recipient.address),
      mint: address(DEVNET_USDC_MINT),
    }));
    const transfer = getTransferCheckedInstruction({
      source,
      mint: address(DEVNET_USDC_MINT),
      destination,
      authority: signingKey,
      amount: BigInt(recipient.amountAtomic),
      decimals: USDC_DECIMALS,
    });
    // A non-signing read-only reference makes the payment discoverable by address.
    instructions.push({
      ...transfer,
      accounts: [...transfer.accounts, { address: address(canonical.reference), role: AccountRole.READONLY }],
    });
  }
  instructions.push(getAddMemoInstruction({ memo, signers: [signingKey] }));
  return Object.freeze({
    instructions: Object.freeze(instructions),
    digest,
    reference: canonical.reference,
    memo,
    totalAtomic: canonical.recipients.reduce((sum, recipient) => sum + BigInt(recipient.amountAtomic), 0n),
    senderAddress: publicAddress,
  });
}

/** All transfers are submitted in one transaction; the planner rejects multi-tx splits. */
export async function signAndSendSplit(invoice: Invoice, wallet: SessionWallet, options: NetworkOptions = {}): Promise<{ signature: string; digest: string }> {
  await checkGenesis(options);
  const prepared = await buildSplitTransaction(invoice, wallet);
  const client = createClient()
    .use(signerPlugin(sessionSigners.get(wallet)!))
    .use(solanaRpc({ rpcUrl: rpcUrl(options) }));
  const result = await client.sendTransaction([...prepared.instructions]);
  return { signature: result.context.signature, digest: prepared.digest };
}

function validSignature(value: string): void {
  try {
    if (getBase58Encoder().encode(value).length !== 64) throw new Error('size');
  } catch {
    throw new InvalidProof('Assinatura de transação inválida.');
  }
}

function accountKey(value: unknown): { pubkey: string; signer: boolean } {
  const entry = object(value);
  if (typeof entry.pubkey !== 'string' || typeof entry.signer !== 'boolean') {
    throw new InvalidProof('A transação deve conter endereços e assinantes decodificados.');
  }
  return { pubkey: entry.pubkey, signer: entry.signer };
}

function tokenBalance(value: unknown): { index: number; mint: string; owner: string; amount: bigint; decimals: number; program: string } {
  const entry = object(value);
  const ui = object(entry.uiTokenAmount);
  return {
    index: Number(entry.accountIndex),
    mint: String(entry.mint),
    owner: String(entry.owner),
    amount: integerAmount(ui.amount),
    decimals: Number(ui.decimals),
    program: String(entry.programId),
  };
}

async function verifyOnEndpoint(invoice: Invoice, signature: string, options: NetworkOptions): Promise<VerificationResult> {
  const endpoint = rpcUrl(options);
  const result: VerificationResult = {
    status: 'pending', valid: false, signature, reasons: [], warnings: [], rpcUrl: endpoint,
    crossChecked: false, explorerUrl: explorerUrl(signature),
  };
  await checkGenesis(options);
  const [transactionResponse, statusResponse] = await Promise.all([
    callRpc('getTransaction', [signature, { encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 0 }], options),
    callRpc('getSignatureStatuses', [[signature], { searchTransactionHistory: true }], options),
  ]);
  const statusValue = array(object(statusResponse).value)[0];
  if (statusValue !== null && statusValue !== undefined && object(statusValue).err !== null) {
    throw new InvalidProof('A transação falhou na blockchain. Nenhum repasse foi concluído.');
  }
  if (transactionResponse === null || statusValue === null || statusValue === undefined) {
    result.reasons.push('A transação ainda não foi encontrada e confirmada neste RPC.');
    return result;
  }
  const finality = object(statusValue).confirmationStatus;
  if (finality !== 'confirmed' && finality !== 'finalized') {
    result.reasons.push('A transação ainda aguarda confirmação.');
    return result;
  }
  const tx = object(transactionResponse);
  const meta = object(tx.meta);
  if (meta.err !== null) throw new InvalidProof('A transação falhou na blockchain.');
  const transaction = object(tx.transaction);
  if (array(transaction.signatures)[0] !== signature) throw new InvalidProof('A resposta da rede não corresponde à assinatura informada.');
  const message = object(transaction.message);
  const keys = array(message.accountKeys).map(accountKey);
  const instructions = array(message.instructions).map(object);
  const canonical = JSON.parse(canonicalInvoice(invoice)) as Invoice;
  const digest = await invoiceDigest(invoice);
  const expectedMemo = `REPASSE:v1:${digest}:${canonical.reference}`;
  const memos = instructions.filter((instruction) => instruction.programId === MEMO_PROGRAM_ADDRESS);
  if (memos.length !== 1 || memos[0].parsed !== expectedMemo) {
    throw new InvalidProof('O digest ou a referência da cobrança não corresponde ao memo da transação.');
  }
  const referenceKey = keys.find((key) => key.pubkey === canonical.reference);
  if (!referenceKey || referenceKey.signer) throw new InvalidProof('A referência pública da cobrança não consta na transação.');
  if (typeof tx.blockTime !== 'number') throw new InvalidProof('A rede não retornou o horário do pagamento.');
  const paymentTime = tx.blockTime * 1000;
  if (paymentTime < new Date(canonical.createdAt).getTime() - 60_000 || paymentTime > new Date(canonical.expiresAt).getTime()) {
    throw new InvalidProof('O pagamento ocorreu fora da validade desta cobrança.');
  }
  const allowed = new Set<string>([TOKEN_PROGRAM_ADDRESS, MEMO_PROGRAM_ADDRESS, ASSOCIATED_TOKEN_PROGRAM, COMPUTE_BUDGET_PROGRAM]);
  if (instructions.some((instruction) => !allowed.has(String(instruction.programId)))) {
    throw new InvalidProof('A transação contém instruções externas ao repasse esperado.');
  }
  const tokenInstructions = instructions.filter((instruction) => instruction.programId === TOKEN_PROGRAM_ADDRESS);
  if (tokenInstructions.length !== canonical.recipients.length || tokenInstructions.some((instruction) => object(instruction.parsed).type !== 'transferChecked')) {
    throw new InvalidProof('A transação deve conter exatamente um TransferChecked direto por colaborador.');
  }
  const pre = array(meta.preTokenBalances).map(tokenBalance);
  const post = array(meta.postTokenBalances).map(tokenBalance);
  const verified: VerifiedRecipient[] = [];
  const matched = new Set<number>();
  let sender: string | undefined;
  let sourceAccount: string | undefined;
  let total = 0n;
  for (const recipient of canonical.recipients) {
    const expectedAta = await tokenAccount(recipient.address);
    const matching = tokenInstructions.flatMap((instruction, index) => {
      const info = object(object(instruction.parsed).info);
      return info.destination === expectedAta ? [{ info, index }] : [];
    });
    if (matching.length !== 1 || matched.has(matching[0].index)) {
      throw new InvalidProof('Falta o repasse direto para um dos colaboradores.');
    }
    const { info, index } = matching[0];
    matched.add(index);
    const amount = object(info.tokenAmount);
    const expected = BigInt(recipient.amountAtomic);
    if (info.mint !== DEVNET_USDC_MINT || amount.decimals !== USDC_DECIMALS || integerAmount(amount.amount) !== expected) {
      throw new InvalidProof('Mint, precisão ou valor de um dos repasses não corresponde à cobrança.');
    }
    // The RPC parser labels the authority "multisigAuthority" when a readonly
    // reference follows it. That label alone never establishes signing authority.
    const authority = info.authority ?? info.multisigAuthority;
    if ((info.authority && info.multisigAuthority && info.authority !== info.multisigAuthority)
      || typeof authority !== 'string' || typeof info.source !== 'string'
      || !keys.some((key) => key.pubkey === authority && key.signer)) {
      throw new InvalidProof('A autoridade pagadora não assinou o repasse.');
    }
    if (sender && (sender !== authority || sourceAccount !== info.source)) {
      throw new InvalidProof('Todos os repasses devem partir da mesma conta pagadora.');
    }
    sender = authority;
    sourceAccount = info.source;
    if (canonical.recipients.some((item) => item.address === sender)) throw new InvalidProof('O pagador não pode receber seu próprio repasse nesta demonstração.');
    if (sourceAccount !== await tokenAccount(sender)) throw new InvalidProof('A origem não é a conta USDC associada do pagador.');
    const accountIndex = keys.findIndex((key) => key.pubkey === expectedAta);
    const postEntries = post.filter((entry) => entry.index === accountIndex);
    const preEntries = pre.filter((entry) => entry.index === accountIndex);
    if (accountIndex < 0 || postEntries.length !== 1 || preEntries.length > 1) throw new InvalidProof('Saldo final do colaborador ausente ou ambíguo.');
    const destinationPost = postEntries[0];
    const destinationPre = preEntries[0];
    for (const entry of [destinationPost, ...(destinationPre ? [destinationPre] : [])]) {
      if (entry.mint !== DEVNET_USDC_MINT || entry.owner !== recipient.address || entry.decimals !== USDC_DECIMALS || entry.program !== TOKEN_PROGRAM_ADDRESS) {
        throw new InvalidProof('A conta de destino tem mint ou proprietário inesperado.');
      }
    }
    if (!destinationPre) {
      const createsDestination = instructions.some((instruction) => {
        if (instruction.programId !== ASSOCIATED_TOKEN_PROGRAM) return false;
        const parsed = object(instruction.parsed);
        const create = object(parsed.info);
        return ['create', 'createIdempotent'].includes(String(parsed.type)) && create.account === expectedAta && create.wallet === recipient.address && create.mint === DEVNET_USDC_MINT;
      });
      if (!createsDestination) throw new InvalidProof('Saldo anterior ausente sem criação da conta de destino.');
    }
    const delta = destinationPost.amount - (destinationPre?.amount ?? 0n);
    if (delta !== expected) throw new InvalidProof('O saldo recebido pelo colaborador não corresponde ao valor esperado.');
    total += expected;
    verified.push({ ...recipient, tokenAccount: expectedAta, receivedAtomic: delta.toString() });
  }
  const sourceIndex = keys.findIndex((key) => key.pubkey === sourceAccount);
  const sourcePre = pre.filter((entry) => entry.index === sourceIndex);
  const sourcePost = post.filter((entry) => entry.index === sourceIndex);
  if (sourcePre.length !== 1 || sourcePost.length !== 1) throw new InvalidProof('Não foi possível verificar o débito total do pagador.');
  for (const entry of [...sourcePre, ...sourcePost]) {
    if (entry.owner !== sender || entry.mint !== DEVNET_USDC_MINT || entry.decimals !== USDC_DECIMALS || entry.program !== TOKEN_PROGRAM_ADDRESS) {
      throw new InvalidProof('A conta de origem tem mint ou proprietário inesperado.');
    }
  }
  if (sourcePre[0].amount - sourcePost[0].amount !== total) throw new InvalidProof('O débito total do pagador não corresponde à divisão.');
  result.status = finality;
  result.valid = finality === 'finalized';
  result.digest = digest;
  result.reference = canonical.reference;
  result.slot = Number(tx.slot);
  result.blockTime = tx.blockTime;
  result.sender = sender;
  result.recipients = verified;
  if (finality === 'confirmed') result.reasons.push('Repasse correto e confirmado; aguardando finalização para emitir o recibo.');
  return result;
}

/** Stateless verification; a second valid payment is possible and must be shown as such. */
export async function verifySignature(invoice: Invoice, signature: string, options: NetworkOptions = {}): Promise<VerificationResult> {
  const base: VerificationResult = {
    status: 'error', valid: false, signature, reasons: [], warnings: [], rpcUrl: options.rpcUrl ?? DEVNET_RPC_URL,
    crossChecked: false, explorerUrl: explorerUrl(signature),
  };
  try {
    try {
      canonicalInvoice(invoice);
    } catch (error) {
      throw new InvalidProof(error instanceof Error ? error.message : 'Cobrança inválida.');
    }
    validSignature(signature);
    const result = await verifyOnEndpoint(invoice, signature, options);
    if (options.secondaryRpcUrl && result.valid) {
      if (new URL(options.secondaryRpcUrl).host === new URL(result.rpcUrl).host) {
        result.warnings.push('O segundo endpoint usa o mesmo host; não representa um provedor independente.');
      } else {
        try {
          const second = await verifyOnEndpoint(invoice, signature, { ...options, rpcUrl: options.secondaryRpcUrl, secondaryRpcUrl: undefined });
          if (second.status === 'invalid') throw new InvalidProof('O segundo RPC rejeitou a prova.');
          if (!second.valid) result.warnings.push('O segundo RPC ainda não finalizou ou indexou a transação.');
          else if (second.digest !== result.digest || second.slot !== result.slot || second.sender !== result.sender) {
            throw new InvalidProof('Os RPCs retornaram provas divergentes.');
          } else result.crossChecked = true;
        } catch (error) {
          if (error instanceof InvalidProof) throw error;
          result.warnings.push('O segundo RPC está indisponível; prova verificada apenas no primeiro.');
        }
      }
    }
    return result;
  } catch (error) {
    base.status = error instanceof InvalidProof || !(error instanceof Error) ? 'invalid' : 'error';
    base.reasons.push(error instanceof Error ? error.message : 'Falha ao verificar o pagamento.');
    return base;
  }
}

/** UI helper: detect duplicate valid signatures, never claim on-chain prevention. */
export function duplicatePaymentWarning(results: readonly VerificationResult[]): string | undefined {
  const paid = new Set(results.filter((result) => result.valid).map((result) => result.signature));
  return paid.size > 1 ? 'Há mais de um pagamento finalizado para esta cobrança. Confira os recibos; o protocolo não impede pagamentos repetidos.' : undefined;
}
