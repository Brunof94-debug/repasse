import './style.css';
import {createSessionWallet, createReference, fundTestSol, balance, signAndSendSplit, verifySignature, explorerUrl, type Invoice, type SessionWallet, type VerificationResult} from './solana';
import {createInvoice, decodeInvoice, encodeInvoice, exportCSV, formatUSDC, invoiceTotal} from './invoice';
import {findInvoicePayments} from './discovery';

type Language = 'pt' | 'en';
type Draft = {title:string;recipients:Array<{name:string;address:string;amount:string}>};
type ValidatedReceipt = Readonly<{invoice:Invoice;signature:string;digest:string;verifiedAt:string;rpc:string;slot?:number;blockTime?:number}>;
const requestedLanguage = new URLSearchParams(location.search).get('lang');
const savedLanguage = localStorage.getItem('repasse-language');
let lang: Language = requestedLanguage === 'en' || requestedLanguage === 'pt' ? requestedLanguage
  : savedLanguage === 'en' || savedLanguage === 'pt' ? savedLanguage : navigator.language.startsWith('pt') ? 'pt' : 'en';
let mode: 'create' | 'pay' | 'verify' = 'create';
let invoice: Invoice | undefined;
let wallet: SessionWallet | undefined;
let signature = '';
let signatureDraft = '';
let draft: Draft | undefined;
let receipt: ValidatedReceipt | undefined;
let verified = false;
let busy = false;
let notice = '';
let error = '';
let walletBalances = '';
let historyNotice = '';
let defaultAddresses: string[] = [];
let invoiceRevision = 0;
let appliedHash: string | undefined;
const t = (pt: string, en: string) => lang === 'pt' ? pt : en;
const esc = (text: unknown) => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

function draftFromInvoice(value?: Invoice): Draft {
  return value ? {title:value.title,recipients:value.recipients.map(r=>({name:r.name,address:r.address,amount:formatUSDC(r.amountAtomic,'en').replace(/,/g,'')}))}
    : {title:t('Identidade visual · Studio 003','Brand identity · Studio 003'),recipients:defaultAddresses.slice(0,3).map((address,i)=>({name:['Design','Dev',t('Conteúdo','Content')][i],address,amount:['4.00','3.00','2.00'][i]}))};
}
function clearVerification() {verified=false;receipt=undefined;}
function captureInputs() {
  const form=document.querySelector<HTMLFormElement>('#invoice-form');
  if(form){
    const data=new FormData(form);
    draft={title:String(data.get('title')??''),recipients:Array.from(form.querySelectorAll<HTMLElement>('[data-row]')).map(row=>({
      name:String(data.get(`name-${row.dataset.row}`)??''),address:String(data.get(`address-${row.dataset.row}`)??''),amount:String(data.get(`amount-${row.dataset.row}`)??'')
    }))};
  }
  const input=document.querySelector<HTMLTextAreaElement>('#verify-form textarea');
  if(input){signatureDraft=input.value;if(receipt&&signatureDraft.trim()!==receipt.signature)clearVerification();}
}
function currentReceipt(): ValidatedReceipt | undefined {
  if(!verified||!receipt||!invoice||receipt.signature!==signature||receipt.signature!==signatureDraft.trim())return;
  if(encodeInvoice(receipt.invoice)!==encodeInvoice(invoice))return;
  return receipt;
}
function setInvoice(value: Invoice | undefined, paymentSignature='', nextMode: typeof mode = paymentSignature?'verify':'pay') {
  invoiceRevision++;
  invoice=value;signature=paymentSignature;signatureDraft=paymentSignature;clearVerification();historyNotice='';notice='';error='';
  draft=value?draftFromInvoice(value):(draft??draftFromInvoice());
  mode=value?nextMode:'create';
}
function writeInvoiceHash(value: Invoice, paymentSignature='', replace=false) {
  const hash=`#i=${encodeInvoice(value)}${paymentSignature?`&s=${encodeURIComponent(paymentSignature)}`:''}`;
  if(location.hash!==hash)history[replace?'replaceState':'pushState'](null,'',`${location.pathname}${location.search}${hash}`);
  appliedHash=location.hash;
}
function applyLocationHash() {
  if(appliedHash===location.hash)return;
  captureInputs();appliedHash=location.hash;
  try {
    const params=new URLSearchParams(location.hash.slice(1));
    setInvoice(params.has('i')?decodeInvoice(params.get('i')!):undefined,params.get('s')??'');
  }catch(e){setInvoice(undefined);error=displayError(e instanceof Error?e.message:String(e));}
}
function saveReceipt(value: Invoice, requestedSignature: string, result: VerificationResult) {
  if(!result.valid||result.status!=='finalized'||result.signature!==requestedSignature||!result.digest)throw new Error(t('A transação não tem um recibo finalizado válido.','This transaction has no valid finalized receipt.'));
  const snapshot=structuredClone(value);
  snapshot.recipients.forEach(Object.freeze);Object.freeze(snapshot.recipients);Object.freeze(snapshot);
  receipt=Object.freeze({invoice:snapshot,signature:requestedSignature,digest:result.digest,verifiedAt:new Date().toISOString(),rpc:result.rpcUrl,slot:result.slot,blockTime:result.blockTime});
  verified=true;
}
function goToMode(next: typeof mode) {captureInputs();mode=next;error='';notice='';render();}
function displayError(message: string) {
  if(lang==='pt')return message;
  const translations: Record<string,string> = {
    'Cobrança inválida.':'Invalid invoice.',
    'Identificador inválido.':'Invalid invoice identifier.',
    'Dê um nome curto ao trabalho.':'Enter a short project name.',
    'Referência da cobrança inválida.':'Invalid invoice reference.',
    'Data inválida.':'Invalid date.',
    'Vencimento anterior à criação.':'Expiry must follow creation.',
    'Escolha de 2 a 4 pessoas.':'Choose two to four people.',
    'Informe o nome de cada pessoa.':'Enter each participant’s name.',
    'Cada pessoa precisa ter um endereço diferente.':'Each participant must have a different address.',
    'Valor inválido.':'Invalid amount.',
    'Link de cobrança inválido.':'Invalid invoice link.',
    'Use um valor positivo com até 6 casas decimais.':'Use a positive amount with up to six decimal places.',
    'Cada pessoa precisa receber um valor maior que zero.':'Each share must be greater than zero.',
    'Assinatura de transação inválida.':'Invalid transaction signature.',
    'O digest ou a referência da cobrança não corresponde ao memo da transação.':'The invoice fingerprint or reference does not match this transaction.',
    'A transação falhou na blockchain. Nenhum repasse foi concluído.':'The transaction failed on-chain. No shares were paid.',
    'A transação falhou na blockchain.':'The transaction failed on-chain.',
    'Mint, precisão ou valor de um dos repasses não corresponde à cobrança.':'The token, precision or a share’s amount does not match this invoice.',
    'Falta o repasse direto para um dos colaboradores.':'A direct payment to one participant is missing.',
    'A autoridade pagadora não assinou o repasse.':'The payer did not sign this payment.',
    'O pagamento ocorreu fora da validade desta cobrança.':'Payment occurred outside this invoice’s validity window.',
    'A transação contém instruções externas ao repasse esperado.':'This transaction contains actions outside the expected split.',
    'A rede consultada não é a Solana devnet. Operação bloqueada.':'The endpoint is not Solana devnet. Operation blocked.',
    'Esta cobrança expirou.':'This invoice expired.',
    'A carteira pagadora não pode ser um dos colaboradores desta demonstração.':'The payer cannot also be a recipient in this demo.',
  };
  if(translations[message])return translations[message];
  if(message.startsWith('Endereço Solana inválido:'))return message.replace('Endereço Solana inválido:','Invalid Solana address:');
  if(/Rede ocupada|Internal error|airdrop limit|faucet has run dry|429/i.test(message))return 'The public RPC or faucet is busy or rate-limited. Try later or use the linked official faucet.';
  if(/[áéíóúãõç]|cobrança|repasse|colaborador|não|saldo|inválid|indisponível|payer/i.test(message))return 'Unable to validate this operation. Check the invoice, recipients, amount and network, then try again.';
  return message;
}

const icon = `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M18 26h21c15 0 15 15 0 15H18m22 0 20 14m-21-14v18" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><circle cx="18" cy="26" r="5" fill="currentColor"/><circle cx="60" cy="55" r="5" fill="currentColor"/><circle cx="39" cy="59" r="5" fill="currentColor"/></svg>`;

function render() {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.title = t('Repasse — Cada parte no lugar.', 'Repasse — Every share, settled.');
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="shell">
      <header><a class="brand" href="${location.pathname}" aria-label="Repasse">${icon}<span>repasse<span class="brand-dot">.</span></span></a>
        <div class="header-actions"><a href="#how" id="how-link">${t('Como funciona','How it works')}</a><button class="lang" id="language">${lang === 'pt' ? 'EN' : 'PT'}</button><span class="network"><i></i>Solana devnet</span></div>
      </header>
      <main>
        <section class="hero">
          <div><p class="eyebrow">${t('TRABALHO EM EQUIPE. PAGAMENTO DIRETO.','TEAMWORK. DIRECT PAYMENT.')}</p>
            <h1>${t('Uma cobrança.<br>Cada parte<br><em>no lugar.</em>','One invoice.<br>Every share,<br><em>settled.</em>')}</h1>
            <p class="intro">${t('Divida o pagamento do seu próximo projeto entre quem fez o trabalho. Sem o repasse manual, sem perder o comprovante.','Split your next project payment among the people who did the work. Skip the manual payouts. Keep the proof.')}</p>
            <div class="hero-links"><button class="primary" id="start">${t('Montar uma cobrança','Create an invoice')} <span>↗</span></button><button class="text-button" id="load-proof">${t('Ver um repasse real de teste','See a real test payment')} →</button></div>
            <p class="test-note">${t('Protótipo na rede de testes. USDC de teste não tem valor financeiro.','Test network prototype. Test USDC has no financial value.')}</p>
          </div>
          <div class="flow-art" aria-label="${t('Um pagamento dividido entre três colaboradores','One payment split among three collaborators')}">
            <div class="art-top"><span>STUDIO / 003</span><span class="art-badge">${t('REPASSE DIRETO','DIRECT SPLIT')}</span></div>
            <div class="payer"><span class="avatar client">↗</span><div><small>${t('CLIENTE','CLIENT')}</small><strong>9.00 <span>USDC</span></strong></div><span class="thin-arrow">↓</span></div>
            <div class="route"><span></span><div>${t('Uma transação','One transaction')}</div><span></span></div>
            <div class="team"><div><span class="avatar amber">M</span><b>4.00</b><small>Design</small></div><div><span class="avatar green">L</span><b>3.00</b><small>Dev</small></div><div><span class="avatar coral">R</span><b>2.00</b><small>${t('Conteúdo','Content')}</small></div></div>
            <div class="art-foot"><span>↳ ${t('Cada parte vai direto ao destino','Each share goes directly to its recipient')}</span><span>01 → 03</span></div>
          </div>
        </section>
        <section class="workspace" id="workspace" aria-labelledby="workspace-title">
          <div class="section-heading"><div><p class="eyebrow">${t('DO JOB AO COMPROVANTE','FROM JOB TO RECEIPT')}</p><h2 id="workspace-title">${t('Feche o trabalho.','Close the job.')}</h2></div><span class="chip">${t('2–4 pessoas · USDC de teste','2–4 people · Test USDC')}</span></div>
          <nav class="tabs" aria-label="${t('Etapas da cobrança','Invoice steps')}">${(['create','pay','verify'] as const).map((tab,i)=>`<button data-mode="${tab}" aria-pressed="${mode===tab}" class="${mode===tab?'active':''}"><span>0${i+1}</span>${tab==='create'?t('Cobrar','Create'):tab==='pay'?t('Pagar','Pay'):t('Comprovar','Verify')}</button>`).join('')}</nav>
          <div class="work-grid"><div class="work-main">${mode === 'create' ? createView() : mode === 'pay' ? payView() : verifyView()}</div><aside>${summaryView()}</aside></div>
          ${error ? `<div class="notice error" role="alert">${esc(error)}</div>` : ''}${notice ? `<div class="notice" role="status">${esc(notice)}</div>` : ''}
          ${busy ? `<div class="notice progress" role="status">${t('Consultando a Solana…','Working with Solana…')}</div>` : ''}
        </section>
        <section class="wallet-panel" aria-labelledby="wallet-title"><div><p class="eyebrow">${t('PARA EXPERIMENTAR','TRY IT YOURSELF')}</p><h2 id="wallet-title">${t('Seu bolso de testes.','Your test wallet.')}</h2><p>${t('Um endereço temporário para esta aba. Sem conta, senha ou dinheiro real. Ao atualizar ou fechar a página, você perde o acesso a esta sessão.','A temporary address for this tab. No account, password or real money. Refreshing or closing the page loses this session’s signing access.')}</p></div>
          <div class="wallet-controls">${wallet ? `<label>${t('Endereço da sessão','Session address')}<input readonly value="${esc(wallet.address)}" aria-label="${t('Endereço da sessão','Session address')}"></label><p class="balance">${esc(walletBalances || t('Consulte o saldo de teste.','Check your test balance.'))}</p><div class="button-row"><button class="secondary" id="fund-sol" ${busy?'disabled':''}>${t('Pedir SOL de teste','Request test SOL')}</button><a class="secondary link-button" href="https://faucet.circle.com/" target="_blank" rel="noopener">${t('Obter USDC de teste','Get test USDC')} ↗</a><button class="text-button" id="refresh-balance" ${busy?'disabled':''}>${t('Atualizar saldo','Refresh balance')}</button></div>` : `<button class="primary" id="new-wallet">${t('Criar sessão de teste','Create test session')} ↗</button><small>${t('A chave fica somente na memória desta aba.','The key stays only in this tab’s memory.')}</small>`}</div>
        </section>
        <section class="how" id="how"><div class="section-heading"><h2>${t('Menos etapas.<br>Mais clareza.','Fewer steps.<br>More clarity.')}</h2><p>${t('Tudo o que precisa acontecer,<br>na mesma transação.','Everything that needs to happen,<br>in the same transaction.')}</p></div><div class="how-cards"><article><span>01</span><h3>${t('Combine as partes','Agree on the shares')}</h3><p>${t('Escolha de duas a quatro pessoas, confira os endereços e fixe o valor de cada parte na cobrança.','Choose two to four people, review their addresses and fix each share in the invoice.')}</p></article><article><span>02</span><h3>${t('Um pagamento, juntos','One payment, together')}</h3><p>${t('Todas as transferências entram em uma transação Solana. Ela conclui por inteiro ou falha por inteiro.','All transfers are part of one Solana transaction. They succeed together or fail together.')}</p></article><article><span>03</span><h3>${t('Comprove cada repasse','Verify every share')}</h3><p>${t('O recibo confere token, referência, destinos e valores na rede. Exporte os detalhes e consulte a transação.','The receipt checks the token, reference, recipients and amounts on the network. Export the details and inspect the transaction.')}</p></article></div></section>
      </main>
      <footer><span>repasse. <small>2026</small></span><p>${t('Prova de pagamento de teste. Não substitui nota fiscal.','Test payment evidence. Does not replace a tax invoice.')}</p><a href="https://github.com/Brunof94-debug/repasse" target="_blank" rel="noopener">${t('Código aberto','Open source')} ↗</a></footer>
    </div>`;
  bind();
}

function createView() {
  draft??=draftFromInvoice(invoice);
  return `<div class="view-heading"><h3>${t('Quem fez parte do trabalho?','Who worked on the project?')}</h3><p>${t('Defina os destinos antes de compartilhar.','Set the recipients before sharing.')}</p></div>
    <form id="invoice-form"><label>${t('Nome do trabalho','Project name')}<input name="title" required maxlength="100" value="${esc(draft.title)}" placeholder="${t('Ex.: Identidade visual','E.g. Brand identity')}"></label>
      <div id="recipients">${draft.recipients.map((r,i)=>recipientRow(r,i)).join('')}</div>
      <div class="form-bottom"><button type="button" class="text-button" id="add-person">+ ${t('Adicionar pessoa','Add person')}</button><button class="primary" ${busy?'disabled':''}>${t('Revisar cobrança','Review invoice')} →</button></div>
      <small class="privacy">${t('O link contém os detalhes da cobrança. Compartilhe apenas o que pode ser público. Na rede, registramos somente uma impressão digital desses dados.','The link contains the invoice details. Share only what can be public. On-chain, we record only a fingerprint of these details.')}</small>
    </form>`;
}
function recipientRow(r: Draft['recipients'][number],i:number) {
  return `<fieldset class="recipient" data-row="${i}"><legend><span>${String(i+1).padStart(2,'0')}</span> ${t('Colaborador','Collaborator')}</legend><div class="recipient-top"><label>${t('Nome','Name')}<input name="name-${i}" aria-label="${t('Nome','Name')} ${i+1}" required maxlength="40" value="${esc(r.name)}"></label><label class="amount-input">${t('Parte em USDC de teste','Share in test USDC')}<input name="amount-${i}" aria-label="${t('Valor','Amount')} ${i+1}" required inputmode="decimal" value="${esc(r.amount)}"></label>${i>=2?`<button type="button" class="remove" data-remove="${i}" aria-label="${t('Remover pessoa','Remove person')} ${i+1}">×</button>`:''}</div><label>${t('Endereço Solana','Solana address')}<input class="address-input" name="address-${i}" aria-label="${t('Endereço','Address')} ${i+1}" required value="${esc(r.address)}" spellcheck="false" autocomplete="off"></label></fieldset>`;
}
function payView() {
  if(!invoice) return emptyView();
  const expired = Date.now() > Date.parse(invoice.expiresAt);
  const verified=!!currentReceipt();
  return `<div class="view-heading"><h3>${t('Revise antes de pagar.','Review before paying.')}</h3><p>${esc(invoice.title)}</p></div><div class="total"><small>${t('TOTAL · USDC DE TESTE','TOTAL · TEST USDC')}</small><strong>${formatUSDC(invoiceTotal(invoice),lang)}<span> USDC</span></strong></div>
    <div class="payouts">${invoice.recipients.map((r,i)=>`<div><span class="avatar ${['amber','green','coral','light'][i]}">${esc(r.name.slice(0,1).toUpperCase())}</span><div><b>${esc(r.name)}</b><code title="${esc(r.address)}">${esc(r.address)}</code></div><strong>${formatUSDC(r.amountAtomic,lang)}</strong></div>`).join('')}</div>
    <p class="subtle">${t('Pagamento direto aos endereços acima. O Repasse não recebe os tokens. Confirme os destinatários com sua equipe.','Payment goes directly to the addresses above. Repasse never receives the tokens. Confirm recipients with your team.')}</p>
    <div class="button-row"><button class="primary" id="pay-invoice" ${busy || !wallet || expired || verified?'disabled':''}>${verified?t('Já verificado','Already verified'):expired?t('Cobrança vencida','Invoice expired'):t('Pagar com sessão de teste','Pay with test session')} ↗</button><button class="secondary" id="share">${t('Copiar link','Copy link')} ↗</button></div>
    ${!wallet?`<p class="subtle">${t('Crie sua sessão de teste abaixo e obtenha tokens sem valor nos faucets.','Create your test session below and get valueless tokens from the faucets.')}</p>`:''}
    <p class="subtle">${t('Válida até','Valid until')} ${new Date(invoice.expiresAt).toLocaleDateString(lang === 'pt'?'pt-BR':'en-US')}. ${t('Este protótipo não impede pagamentos duplicados entre dispositivos.','This prototype cannot prevent duplicate payments across devices.')}</p>${historyView()}`;
}
function verifyView() {
  if(!invoice) return emptyView();
  const proof=currentReceipt();
  return `<div class="view-heading"><h3>${t('A assinatura precisa contar a mesma história.','The signature must tell the same story.')}</h3><p>${t('Conferimos a cobrança com os registros da rede.','We match the invoice against the network records.')}</p></div><form id="verify-form"><label>${t('Assinatura da transação','Transaction signature')}<textarea name="signature" required rows="3" spellcheck="false" placeholder="${t('Cole uma assinatura Solana…','Paste a Solana signature…')}">${esc(signatureDraft)}</textarea></label><button class="primary" ${busy?'disabled':''}>${t('Verificar na Solana','Verify on Solana')} ↗</button></form>
    ${proof?`<div id="verified-receipt"><div class="receipt"><span class="receipt-mark">✓</span><div><small>${t('COMPROVANTE VERIFICADO','VERIFIED RECEIPT')}</small><h3>${t('Cada parte chegou.','Every share arrived.')}</h3><p>${esc(proof.invoice.title)} · ${formatUSDC(invoiceTotal(proof.invoice),lang)} USDC ${t('de teste','test tokens')}</p></div></div><div class="checks">${[t('Rede devnet correta','Correct devnet network'),t('Transação concluída sem erro','Successful transaction'),t('USDC Circle de teste','Circle test USDC'),t('Todos os destinos e valores','All recipients and amounts'),t('Referência e dados da cobrança','Invoice reference and fingerprint')].map(s=>`<span>✓ ${s}</span>`).join('')}</div><div class="button-row"><a class="secondary link-button" href="${explorerUrl(proof.signature)}" target="_blank" rel="noopener">${t('Abrir no Explorer','Open in Explorer')} ↗</a><button class="secondary" id="csv" ${busy?'disabled':''}>${t('Baixar CSV','Download CSV')} ↓</button><button class="text-button" id="receipt-json" ${busy?'disabled':''}>${t('Baixar recibo','Download receipt')} ↓</button></div><p class="subtle">${t('Consulta pelo RPC público da Solana. O comprovante demonstra esta transação, não a entrega do trabalho.','Checked through Solana’s public RPC. This receipt proves this transaction, not delivery of the work.')}</p></div>`:''}${historyView()}`;
}
function historyView(){return `<div class="history"><button class="text-button" id="find-payments" ${busy?'disabled':''}>${t('Buscar pagamentos desta cobrança','Find payments for this invoice')} ↗</button>${historyNotice?`<p class="subtle" role="status">${esc(historyNotice)}</p>`:''}</div>`;}
function summaryView() {
  const verified=!!currentReceipt();
  return `<div class="summary-label"><span>${t('VISÃO GERAL','OVERVIEW')}</span><span>↗</span></div><h3>${invoice?esc(invoice.title):t('Seu próximo<br>trabalho, organizado.','Your next<br>project, organized.')}</h3><dl><div><dt>${t('Pessoas','People')}</dt><dd>${invoice?.recipients.length || '2–4'}</dd></div><div><dt>${t('Transações','Transactions')}</dt><dd>01</dd></div><div><dt>${t('Custódia da plataforma','Platform custody')}</dt><dd>${t('Nenhuma','None')}</dd></div><div><dt>${t('Rede','Network')}</dt><dd>Solana devnet</dd></div><div><dt>${t('Status','Status')}</dt><dd class="${verified?'success':''}">${verified?t('Verificado','Verified'):invoice?t('A conferir','Unverified'):t('Rascunho','Draft')}</dd></div></dl><div class="summary-note"><span>✳</span><p>${t('Uma transação. Todas as partes. Um comprovante que pode ser conferido.','One transaction. Every share. A receipt anyone can check.')}</p></div>${invoice?`<div class="invoice-id">ID ${esc(invoice.id.slice(0,8))}</div>`:''}`;
}
function emptyView() {return `<div class="empty"><span>↳</span><h3>${t('Comece pela cobrança.','Start with an invoice.')}</h3><p>${t('Monte as partes ou carregue um pagamento real de teste.','Set the shares or load a real test payment.')}</p><button class="primary" id="back-create">${t('Montar cobrança','Create invoice')} →</button></div>`;}

async function action(work:(current:()=>boolean)=>Promise<void>) {
  if(busy) return;
  captureInputs();
  const revision=invoiceRevision;
  const current=()=>revision===invoiceRevision;
  busy=true; error='';notice='';render();
  try {await work(current);} catch(e){if(current())error=displayError(e instanceof Error?e.message:String(e));} finally {busy=false;render();}
}
function bind() {
  document.querySelector('#language')?.addEventListener('click',()=>{captureInputs();lang=lang==='pt'?'en':'pt';localStorage.setItem('repasse-language',lang);render();});
  document.querySelector('#how-link')?.addEventListener('click',event=>{event.preventDefault();document.querySelector('#how')?.scrollIntoView({behavior:'smooth'});});
  document.querySelector('.brand')?.addEventListener('click',event=>{event.preventDefault();goToMode('create');window.scrollTo({top:0,behavior:'smooth'});});
  document.querySelectorAll<HTMLElement>('[data-mode]').forEach(el=>el.addEventListener('click',()=>goToMode(el.dataset.mode as typeof mode)));
  document.querySelector('#start')?.addEventListener('click',()=>{goToMode('create');document.querySelector('#workspace')?.scrollIntoView({behavior:'smooth'});});
  document.querySelector('#back-create')?.addEventListener('click',()=>goToMode('create'));
  document.querySelector('#load-proof')?.addEventListener('click',()=>action(async current=>{
    const response = await fetch('./proof.json');
    if(!response.ok) throw new Error(t('O comprovante público ainda está sendo preparado. Você já pode criar uma cobrança.','The public receipt is still being prepared. You can create an invoice now.'));
    const proof = await response.json();if(!current())return;
    setInvoice(decodeInvoice(proof.invoice),proof.signature,'verify');writeInvoiceHash(invoice!,signature);
    notice=t('Comprovante carregado. Clique em verificar para consultar a rede agora.','Receipt loaded. Click verify to check the network now.');
    document.querySelector('#workspace')?.scrollIntoView();
  }));
  document.querySelector('#invoice-form')?.addEventListener('input',()=>captureInputs());
  document.querySelector('#invoice-form')?.addEventListener('submit',event=>{
    event.preventDefault();if(busy)return;captureInputs();
    const input=structuredClone(draft!);
    action(async()=>{const next=createInvoice({title:input.title,reference:createReference(),recipients:input.recipients});setInvoice(next);writeInvoiceHash(next);});
  });
  document.querySelector('#add-person')?.addEventListener('click',()=>{
    captureInputs();if(!draft||draft.recipients.length>=4)return;
    const used=new Set(draft.recipients.map(r=>r.address));
    const nextAddress=defaultAddresses.find(address=>!used.has(address))??createReference();
    draft.recipients.push({name:'',address:nextAddress,amount:'1.00'});render();
  });
  bindRemovals();
  document.querySelector('#share')?.addEventListener('click',()=>{
    if(!invoice)return;const sharedInvoice=structuredClone(invoice);
    action(async current=>{await navigator.clipboard.writeText(`${location.origin}${location.pathname}#i=${encodeInvoice(sharedInvoice)}`);if(current())notice=t('Link copiado. Confira os endereços com sua equipe antes de pagar.','Link copied. Confirm recipients with your team before paying.');});
  });
  document.querySelector('#new-wallet')?.addEventListener('click',()=>action(async()=>{wallet=await createSessionWallet();notice=t('Sessão criada. Copie seu endereço para obter SOL e USDC de teste.','Session created. Copy its address to get test SOL and USDC.');}));
  document.querySelector('#fund-sol')?.addEventListener('click',()=>action(async()=>{await fundTestSol(wallet!);notice=t('SOL de teste solicitado. Atualize o saldo em alguns segundos.','Test SOL requested. Refresh the balance in a few seconds.');}));
  document.querySelector('#refresh-balance')?.addEventListener('click',()=>action(async()=>{const result=await balance(wallet!);walletBalances=`${Number(result.solLamports)/1e9} SOL · ${formatUSDC(result.usdcAtomic,lang)} USDC ${t('de teste','test tokens')}`;}));
  document.querySelector('#pay-invoice')?.addEventListener('click',()=>{
    if(busy||!invoice||!wallet)return;const paidInvoice=structuredClone(invoice);const payer=wallet;
    clearVerification();
    action(async current=>{const result=await signAndSendSplit(paidInvoice,payer);if(!current())return;signature=result.signature;signatureDraft=signature;mode='verify';historyNotice='';writeInvoiceHash(paidInvoice,signature);notice=t('Transação enviada. Verifique quando a rede concluir a confirmação.','Transaction sent. Verify after the network completes confirmation.');});
  });
  document.querySelector<HTMLTextAreaElement>('#verify-form textarea')?.addEventListener('input',event=>{
    signatureDraft=(event.target as HTMLTextAreaElement).value;
    if(receipt&&signatureDraft.trim()!==receipt.signature){
      clearVerification();document.querySelector('#verified-receipt')?.remove();
      notice='';error='';document.querySelectorAll('.workspace .notice:not(.progress)').forEach(element=>element.remove());
      const summary=document.querySelector('.work-grid aside');if(summary)summary.innerHTML=summaryView();
    }
  });
  document.querySelector('#verify-form')?.addEventListener('submit',event=>{
    event.preventDefault();if(busy||!invoice)return;captureInputs();
    const checkedInvoice=structuredClone(invoice);const requestedSignature=signatureDraft.trim();
    signature=requestedSignature;signatureDraft=requestedSignature;clearVerification();writeInvoiceHash(checkedInvoice,requestedSignature,true);
    action(async current=>{
      const result=await verifySignature(checkedInvoice,requestedSignature);if(!current())return;
      if(result.valid&&result.status==='finalized'){
        saveReceipt(checkedInvoice,requestedSignature,result);writeInvoiceHash(checkedInvoice,requestedSignature,true);
        notice=t('Pagamento finalizado e compatível com esta cobrança.','Finalized payment matches this invoice.');
      }else if(result.status==='pending'||result.status==='confirmed'){
        notice=t('Aguardando a finalização da rede. Consulte novamente em alguns segundos.','Waiting for network finality. Check again in a few seconds.');
      }else if(result.status==='error'){
        error=t('Não foi possível consultar a rede. Isso não determina se o pagamento é válido. ','The network could not be queried. This does not determine whether the payment is valid. ')+displayError(result.reasons.join(' · '));
      }else{
        error=displayError(result.reasons.join(' · ')||t('A transação não confere com esta cobrança.','Transaction does not match this invoice.'));
      }
    });
  });
  document.querySelector('#csv')?.addEventListener('click',()=>{
    const proof=currentReceipt();if(busy||!proof)return;
    download(exportCSV(proof.invoice,proof.signature,'finalized'),`repasse-${proof.invoice.id.slice(0,8)}.csv`,'text/csv;charset=utf-8');
  });
  document.querySelector('#find-payments')?.addEventListener('click',()=>{
    if(busy||!invoice)return;const searchedInvoice=structuredClone(invoice);historyNotice='';
    action(async current=>{
    const found = await findInvoicePayments(searchedInvoice,{limit:5});if(!current())return;
    if(found.status==='error')throw new Error(found.reasons.join(' · '));
    const valid=found.results.filter(result=>result.valid);
    const incomplete=found.results.some(result=>['pending','confirmed','error'].includes(result.status));
    historyNotice=valid.length>1?t(`${valid.length} pagamentos finalizados encontrados. Há pagamentos repetidos; confira os recibos.`,`${valid.length} finalized payments found. There are repeated payments; review the receipts.`):valid.length===1?t('Um pagamento finalizado e compatível foi encontrado.','One finalized matching payment was found.'):t('Nenhum pagamento finalizado e compatível foi encontrado nesta consulta.','No finalized matching payment was found in this query.');
    historyNotice+=' '+t('Busca limitada às 5 transações mais recentes da referência; não garante histórico completo.','Search covers the reference’s five latest transactions; it does not guarantee a complete history.');
    if(incomplete)historyNotice+=' '+t('Há resultados pendentes ou indisponíveis.','Some results are pending or unavailable.');
    });
  });
  document.querySelector('#receipt-json')?.addEventListener('click',()=>{
    const proof=currentReceipt();if(busy||!proof)return;
    download(JSON.stringify({version:1,network:'solana-devnet',invoice:proof.invoice,digest:proof.digest,signature:proof.signature,status:'finalized',verifiedAt:proof.verifiedAt,rpc:proof.rpc,slot:proof.slot,blockTime:proof.blockTime,explorer:explorerUrl(proof.signature)},null,2),`repasse-${proof.invoice.id.slice(0,8)}.json`,'application/json');
  });
}
function bindRemovals(){document.querySelectorAll<HTMLElement>('[data-remove]').forEach(button=>{button.onclick=()=>{captureInputs();if(draft&&draft.recipients.length>2){draft.recipients.splice(Number(button.dataset.remove),1);render();}};});}
function download(content:string,name:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

async function initialize() {
  try {defaultAddresses=await Promise.all(Array.from({length:4},()=>createReference()));
    draft=draftFromInvoice();applyLocationHash();
  } catch(e){error=e instanceof Error?e.message:String(e);}
  render();
}
window.addEventListener('hashchange',()=>{applyLocationHash();render();});
initialize();
