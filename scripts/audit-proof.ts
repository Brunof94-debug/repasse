import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { verifySignature, type Invoice } from '../src/solana.js';

// Read-only audit. Input contains public invoice data, never a private key.
// npx tsx scripts/audit-proof.ts public/demo-proof.json
// npx tsx scripts/audit-proof.ts invoice.json <devnet-signature>
const [inputPath, signatureArgument] = process.argv.slice(2);
if (!inputPath) {
  console.error('Uso: npx tsx scripts/audit-proof.ts <invoice-ou-proof.json> [assinatura-devnet]');
  process.exitCode = 1;
} else {
  try {
    const document = JSON.parse(await readFile(resolve(inputPath), 'utf8')) as { invoice?: Invoice; signature?: string } & Invoice;
    const invoice = document.invoice ?? document;
    const signature = signatureArgument ?? document.signature;
    if (!signature) throw new Error('O arquivo deve conter uma assinatura pública ou recebê-la como segundo argumento.');
    const result = await verifySignature(invoice, signature, {
      rpcUrl: process.env.REPASSE_DEVNET_RPC_URL,
      secondaryRpcUrl: process.env.REPASSE_SECONDARY_DEVNET_RPC_URL,
    });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.valid ? 0 : result.status === 'pending' || result.status === 'confirmed' ? 2 : result.status === 'invalid' ? 1 : 3;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Falha ao auditar a prova pública.');
    process.exitCode = 3;
  }
}
