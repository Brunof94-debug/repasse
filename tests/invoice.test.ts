import test from 'node:test';
import assert from 'node:assert/strict';
import {parseUSDC, formatUSDC, validateInvoice, encodeInvoice, decodeInvoice, exportCSV} from '../src/invoice';
const invoice = {
  id:'test-job-2026', reference:'11111111111111111111111111111111', title:'Identidade São João',
  createdAt:'2026-10-07T10:00:00.000Z', expiresAt:'2026-10-14T10:00:00.000Z',
  recipients:[{name:'Design',address:'11111111111111111111111111111111',amountAtomic:'1250000'}, {name:'Dev',address:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',amountAtomic:'500001'}],
};
test('money stays exact at six decimal places', () => {
  assert.equal(parseUSDC('1,250001'), 1250001n);
  assert.equal(formatUSDC(1250001n,'en'),'1.250001');
  for(const value of ['1e3','-2','0','1.0000001',' 2.3.4 ','NaN']) assert.throws(()=>parseUSDC(value));
});
test('shared invoices preserve UTF-8 and exact amounts', () => {
  assert.deepEqual(decodeInvoice(encodeInvoice(invoice)),invoice);
  assert.throws(()=>decodeInvoice('a'.repeat(6001)));
});
test('duplicate destinations and invalid ranges are rejected', () => {
  assert.throws(()=>validateInvoice({...invoice,recipients:[invoice.recipients[0],invoice.recipients[0]]}));
  assert.throws(()=>validateInvoice({...invoice,expiresAt:invoice.createdAt}));
  assert.throws(()=>validateInvoice({...invoice,recipients:[invoice.recipients[0]]}));
});
test('CSV neutralizes spreadsheet formulas in untrusted names', () => {
  const csv = exportCSV({...invoice,title:'=HYPERLINK("https://example.com")'});
  assert.match(csv,/"'=HYPERLINK/);
  assert.match(csv,/1\.25/);
});
