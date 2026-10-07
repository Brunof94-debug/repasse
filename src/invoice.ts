import { isAddress } from '@solana/kit';
import type { Invoice } from './solana';

export function parseUSDC(value: string): bigint {
  const clean = value.trim().replace(',', '.');
  if (!/^(0|[1-9]\d{0,8})(\.\d{1,6})?$/.test(clean)) throw new Error('Use um valor positivo com até 6 casas decimais.');
  const [whole, fraction = ''] = clean.split('.');
  const amount = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
  if (amount <= 0n) throw new Error('Cada pessoa precisa receber um valor maior que zero.');
  return amount;
}

export function formatUSDC(value: string | bigint, lang = 'pt'): string {
  const amount = BigInt(value);
  const whole = amount / 1_000_000n;
  const fractional = (amount % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '').padEnd(2, '0');
  return `${whole.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}${lang === 'pt' ? ',' : '.'}${fractional}`;
}

export function invoiceTotal(invoice: Invoice): bigint {
  return invoice.recipients.reduce((sum, recipient) => sum + BigInt(recipient.amountAtomic), 0n);
}

export function validateInvoice(input: unknown): Invoice {
  if (!input || typeof input !== 'object') throw new Error('Cobrança inválida.');
  const invoice = input as Invoice;
  if (typeof invoice.id !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(invoice.id)) throw new Error('Identificador inválido.');
  if (typeof invoice.title !== 'string' || !invoice.title.trim() || invoice.title.length > 100) throw new Error('Dê um nome curto ao trabalho.');
  if (typeof invoice.reference !== 'string' || !isAddress(invoice.reference)) throw new Error('Referência da cobrança inválida.');
  for (const value of [invoice.createdAt, invoice.expiresAt]) {
    if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new Error('Data inválida.');
  }
  if (Date.parse(invoice.expiresAt) <= Date.parse(invoice.createdAt)) throw new Error('Vencimento anterior à criação.');
  if (!Array.isArray(invoice.recipients) || invoice.recipients.length < 2 || invoice.recipients.length > 4) throw new Error('Escolha de 2 a 4 pessoas.');
  const addresses = new Set<string>();
  for (const recipient of invoice.recipients) {
    if (!recipient || typeof recipient.name !== 'string' || !recipient.name.trim() || recipient.name.length > 40) throw new Error('Informe o nome de cada pessoa.');
    if (typeof recipient.address !== 'string' || !isAddress(recipient.address)) throw new Error(`Endereço Solana inválido: ${recipient.name}.`);
    if (addresses.has(recipient.address)) throw new Error('Cada pessoa precisa ter um endereço diferente.');
    addresses.add(recipient.address);
    if (typeof recipient.amountAtomic !== 'string' || !/^[1-9]\d{0,14}$/.test(recipient.amountAtomic)) throw new Error('Valor inválido.');
  }
  if (invoiceTotal(invoice) > 999_999_999_000_000n) throw new Error('Valor total acima do limite do protótipo.');
  return {
    id: invoice.id, reference: invoice.reference, title: invoice.title,
    createdAt: invoice.createdAt, expiresAt: invoice.expiresAt,
    recipients: invoice.recipients.map(({name, address, amountAtomic}) => ({name, address, amountAtomic})),
  };
}

export function createInvoice(input: {title: string; reference: string; recipients: Array<{name: string; address: string; amount: string}>}, now = new Date()): Invoice {
  return validateInvoice({
    id: crypto.randomUUID(), reference: input.reference, title: input.title.trim(),
    createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
    recipients: input.recipients.map(({name, address, amount}) => ({name: name.trim(), address: address.trim(), amountAtomic: parseUSDC(amount).toString()})),
  });
}

export function encodeInvoice(invoice: Invoice): string {
  const bytes = new TextEncoder().encode(JSON.stringify(validateInvoice(invoice)));
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeInvoice(encoded: string): Invoice {
  if (!/^[\w-]+$/.test(encoded) || encoded.length > 6000) throw new Error('Link de cobrança inválido.');
  try {
    const bytes = Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
    return validateInvoice(JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)));
  } catch { throw new Error('Link de cobrança inválido.'); }
}

function csvCell(value: string): string {
  // Prevent spreadsheet formulas in user-provided labels.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportCSV(invoice: Invoice, signature = '', status = 'unverified'): string {
  const rows = [['invoice_id','job','participant','recipient','amount_usdc_test','network','signature','verification'], ...invoice.recipients.map(r => [invoice.id, invoice.title, r.name, r.address, formatUSDC(r.amountAtomic, 'en').replace(/,/g, ''), 'solana-devnet', signature, status])];
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
