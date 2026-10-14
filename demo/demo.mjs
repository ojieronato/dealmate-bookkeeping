import { createBookkeepingPlugin, emptyBook, applyCommand } from '../src/index.mjs';
import '../src/finance-element.mjs';
// Fictional records only. No live CRM, bank, or Google Sheet connection.
const tenantId='sample-workspace';
const deals=[
  {id:'sample-external',label:'214 Cedar Lane',buyerName:'Sample Buyer Group',stage:'closed',expectedCompanyRevenueCents:1000000},
  {id:'sample-internal',label:'86 Meadow Court',buyerName:'Example Home Buyers',stage:'closed',expectedCompanyRevenueCents:800000},
  {id:'sample-pipeline',label:'730 Willow Street',buyerName:'Sample Buyer Group',stage:'under_contract',expectedCompanyRevenueCents:1750000,expectedCloseOn:'2026-10-28'}
];
const store={
  async read(key){const json=localStorage.getItem(key);return json?JSON.parse(json):undefined;},
  async transact(key,update){
    if(!navigator.locks)throw new Error('This preview requires a browser with Web Locks on localhost or HTTPS.');
    return navigator.locks.request(key,async()=>{const old=await this.read(key);const next=update(old);localStorage.setItem(key,JSON.stringify(next));return structuredClone(next);});
  }
};
const plugin=createBookkeepingPlugin({enabled:true,tenantId,store,crm:{listDeals:async()=>structuredClone(deals)},authorize:async()=>({actorId:'demo-user'})});
async function seed(){
  await store.transact(`dealmate-bookkeeping:v1:${tenantId}`,current=>{
    if(current)return current;let book=emptyBook(tenantId);let seq=0;
    const append=(type,data)=>{book=applyCommand(book,{id:`seed-${++seq}`,type,data},{actorId:'sample-data',timestamp:'2026-10-12T14:00:00.000Z'});};
    append('opening.recorded',{amountCents:0,date:'2026-10-01',accountName:'Sample operating account'});
    append('partner.created',{id:'sample-source',name:'Example Lead Partner'});
    append('receipt.recorded',{id:'receipt-external',dealId:deals[0].id,dealLabel:deals[0].label,buyerName:deals[0].buyerName,hosName:'Sample HOS',grossCents:1000000,receivedOn:'2026-10-03',partnerShares:[{partnerId:'sample-source',amountCents:300000}],hosBps:1000,reserveBps:500,reference:'SAMPLE-001'});
    append('receipt.recorded',{id:'receipt-internal',dealId:deals[1].id,dealLabel:deals[1].label,buyerName:deals[1].buyerName,hosName:'Sample HOS',grossCents:800000,receivedOn:'2026-10-07',partnerShares:[],hosBps:1000,reserveBps:500,reference:'SAMPLE-002'});
    append('expense.recorded',{id:'expense-overhead',payee:'Sample monthly overhead',category:'Software',amountCents:260000,incurredOn:'2026-10-01',dueOn:'2026-10-15',kind:'overhead'});
    append('expense.recorded',{id:'expense-marketing',payee:'Sample lead campaign',category:'Marketing',amountCents:50000,incurredOn:'2026-10-04',dueOn:'2026-10-20',kind:'overhead'});
    append('expense.recorded',{id:'expense-direct',payee:'Sample title service',category:'Closing costs',amountCents:12500,incurredOn:'2026-10-03',dueOn:'2026-10-03',kind:'direct',dealId:deals[0].id});
    append('payment.recorded',{id:'payment-1',kind:'partner',sourceId:'receipt-external',partnerId:'sample-source',amountCents:150000,paidOn:'2026-10-04',reference:'SAMPLE-PAY-1'});
    append('payment.recorded',{id:'payment-2',kind:'expense',sourceId:'expense-overhead',amountCents:160000,paidOn:'2026-10-05',reference:'SAMPLE-PAY-2'});
    append('payment.recorded',{id:'payment-3',kind:'expense',sourceId:'expense-direct',amountCents:12500,paidOn:'2026-10-05',reference:'SAMPLE-PAY-3'});
    append('schedule.created',{id:'schedule-sample',payee:'Example CRM subscription',category:'Software',amountCents:9900,startMonth:'2026-11',day:1});
    append('worker.created',{id:'sample-worker',name:'Sample HOS',kind:'employee'});
    append('payroll.recorded',{id:'sample-payroll',workerId:'sample-worker',periodStart:'2026-10-01',periodEnd:'2026-10-10',postedOn:'2026-10-10',baseCents:60000,bonusCents:10000,hosLinks:[{receiptId:'receipt-external',amountCents:50000}],deductions:[{id:'sample-withheld',label:'Sample withholding',payee:'Example tax authority',amountCents:15000}],employerCosts:[{id:'sample-employer',label:'Sample employer cost',payee:'Example tax authority',amountCents:8000}]});
    append('payment.recorded',{id:'payment-payroll',kind:'payroll',sourceId:'sample-payroll',amountCents:70000,paidOn:'2026-10-11',reference:'SAMPLE-PAYROLL-1'});
    return book;
  });
}
try{await seed();await document.querySelector('dealmate-finance').connect({plugin,today:'2026-10-12',demo:true});}catch(error){document.querySelector('#error').textContent=error.message;}
