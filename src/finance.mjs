/** All amounts are integer USD cents. Events are append-only; no CRM writes. */
export const VERSION = 1;
export const DEFAULT_RATES = Object.freeze({ hosBps: 1000, reserveBps: 500 });
export const CATEGORIES = Object.freeze(['Software', 'Marketing', 'Staffing', 'Phone & data', 'Rent', 'Insurance', 'Professional fees', 'Closing costs', 'Other']);
export function requireThat(condition, message) { if (!condition) throw new Error(message); }
export function cents(text) {
  requireThat(typeof text === 'string' && /^-?\d+(\.\d{1,2})?$/.test(text.trim()), 'Enter a money amount with at most two decimal places.');
  const s = text.trim(), negative = s.startsWith('-'), [whole, fraction = ''] = s.replace('-', '').split('.');
  const result = Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')));
  requireThat(Number.isSafeInteger(result), 'Amount is too large.');
  return negative ? -result : result;
}
export function amount(value, name = 'Amount', allowZero = false) {
  requireThat(Number.isSafeInteger(value) && (allowZero ? value >= 0 : value > 0), `${name} must be ${allowZero ? 'nonnegative' : 'positive'} integer cents.`);
  return value;
}
export function rate(value) { requireThat(Number.isInteger(value) && value >= 0 && value <= 10000, 'Rate must be 0–10000 basis points.'); return value; }
export function percentage(value, bps) {
  amount(value, 'Calculation base', true); rate(bps);
  return Number((BigInt(value) * BigInt(bps) + 5000n) / 10000n);
}
export function total(values) {
  const sum = values.reduce((sum, value) => sum + BigInt(value), 0n);
  const result = Number(sum); requireThat(Number.isSafeInteger(result), 'Total exceeds supported precision.'); return result;
}
export function date(value) {
  requireThat(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 'Use a YYYY-MM-DD date.');
  const parsed = new Date(`${value}T12:00:00Z`);
  requireThat(Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value, 'Invalid calendar date.'); return value;
}
function month(value) { requireThat(typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value), 'Use a YYYY-MM month.'); return value; }
function text(value, label) { requireThat(typeof value === 'string' && value.trim().length > 0 && value.length <= 500, `${label} is required (maximum 500 characters).`); return value.trim(); }
function id(value) { return text(value, 'ID'); }
export function emptyBook(tenantId) { return { schemaVersion: VERSION, tenantId: id(tenantId), currency: 'USD', revision: 0, events: [] }; }
export function validateBook(book, tenantId) {
  requireThat(book && book.schemaVersion === VERSION && book.currency === 'USD' && book.tenantId === tenantId && Array.isArray(book.events), 'Book schema, currency, or tenant does not match.');
  requireThat(book.events.length === book.revision && Number.isSafeInteger(book.revision), 'Book revision is invalid.');
}
function payloads(book, type) { return book.events.filter(e => e.type === type).map(e => ({ ...e.data, eventId: e.id })); }
export function records(book) {
  const reversed = new Set(payloads(book, 'receipt.reversed').map(e => e.receiptId));
  const stopped = new Set(payloads(book, 'schedule.stopped').map(e => e.scheduleId));
  const reversedPayroll = new Set(payloads(book, 'payroll.reversed').map(e => e.payrollId));
  return {
    opening: payloads(book, 'opening.recorded')[0],
    partners: payloads(book, 'partner.created'),
    receipts: payloads(book, 'receipt.recorded').map(r => ({ ...r, reversed: reversed.has(r.id) })),
    expenses: payloads(book, 'expense.recorded'),
    payments: payloads(book, 'payment.recorded'),
    schedules: payloads(book, 'schedule.created').map(s => ({ ...s, stopped: stopped.has(s.id) })),
    workers: payloads(book, 'worker.created'),
    payroll: payloads(book, 'payroll.recorded').filter(p => !reversedPayroll.has(p.id)),
    releases: payloads(book, 'reserve.released'),
    movements: payloads(book, 'cash.recorded')
  };
}
export function receiptAmounts(receipt) {
  const partnerCents = total(receipt.partnerShares.map(p => p.amountCents));
  const hosBaseCents = receipt.grossCents - partnerCents;
  return { partnerCents, hosBaseCents, hosCents: percentage(hosBaseCents, receipt.hosBps), reserveCents: percentage(receipt.grossCents, receipt.reserveBps) };
}
export function paymentTarget(payment) { return `${payment.kind}:${payment.sourceId}:${payment.partnerId || payment.lineId || ''}`; }
export function payrollAmounts(payroll) {
  const hosCents = total(payroll.hosLinks.map(l => l.amountCents));
  const grossCents = total([payroll.baseCents, payroll.bonusCents, hosCents]);
  const deductionCents = total(payroll.deductions.map(d => d.amountCents));
  const employerCents = total(payroll.employerCosts.map(d => d.amountCents));
  return { hosCents, grossCents, deductionCents, employerCents, netCents: grossCents - deductionCents, newExpenseCents: total([payroll.baseCents, payroll.bonusCents, employerCents]) };
}
export function obligations(book, through = '9999-12-31') {
  const r = records(book), result = [];
  for (const receipt of r.receipts.filter(r => !r.reversed && r.receivedOn <= through)) {
    for (const share of receipt.partnerShares) result.push({ kind: 'partner', sourceId: receipt.id, partnerId: share.partnerId, payee: share.name, amountCents: share.amountCents, date: receipt.receivedOn, label: receipt.dealLabel, priority: 1 });
    const assignedToPayroll = total(r.payroll.filter(p => p.postedOn <= through).flatMap(p => p.hosLinks.filter(l => l.receiptId === receipt.id).map(l => l.amountCents)));
    result.push({ kind: 'commission', sourceId: receipt.id, payee: receipt.hosName, amountCents: receiptAmounts(receipt).hosCents - assignedToPayroll, date: receipt.receivedOn, label: receipt.dealLabel, priority: 3 });
  }
  for (const expense of r.expenses.filter(e => e.incurredOn <= through)) result.push({ kind: 'expense', sourceId: expense.id, payee: expense.payee, amountCents: expense.amountCents, date: expense.incurredOn, dueOn: expense.dueOn, label: expense.category, priority: 2 });
  for (const payroll of r.payroll.filter(p => p.postedOn <= through)) {
    result.push({ kind: 'payroll', sourceId: payroll.id, payee: payroll.workerName, amountCents: payrollAmounts(payroll).netCents, date: payroll.postedOn, label: `Payroll ${payroll.periodStart} – ${payroll.periodEnd}`, priority: payroll.hosLinks.length ? 3 : 2 });
    for (const line of [...payroll.deductions, ...payroll.employerCosts]) result.push({ kind: 'payroll_remittance', sourceId: payroll.id, lineId: line.id, payee: line.payee, amountCents: line.amountCents, date: payroll.postedOn, label: `${payroll.workerName}: ${line.label}`, priority: 2 });
  }
  return result.map(o => { const paidCents = total(r.payments.filter(p => paymentTarget(p) === paymentTarget(o) && p.paidOn <= through).map(p => p.amountCents)); return { ...o, key: paymentTarget(o), paidCents, owedCents: o.amountCents - paidCents }; }).sort((a, b) => a.priority - b.priority || a.date.localeCompare(b.date));
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function ensureUnused(r, collection, key) { requireThat(!r[collection].some(item => item.id === key), `${collection} ID already exists.`); }
export function cashSign(kind) { return ['contribution', 'loan_received', 'other_income', 'deposit_returned', 'other_in'].includes(kind) ? 1 : kind === 'transfer' ? 0 : -1; }
/** Pure transactional command handler. Persist its result atomically through a server adapter. */
export function applyCommand(book, command, { actorId, timestamp }) {
  validateBook(book, book.tenantId); id(actorId);
  requireThat(typeof timestamp === 'string' && Number.isFinite(Date.parse(timestamp)), 'Audit timestamp is required.');
  id(command.id); text(command.type, 'Command type');
  requireThat(command.data && typeof command.data === 'object', 'Command data is required.');
  const existing = book.events.find(e => e.id === command.id);
  if (existing) {
    requireThat(existing.request === canonical(command), 'Idempotency key was reused with different data.');
    return book;
  }
  const d = structuredClone(command.data), r = records(book);
  if (command.type !== 'opening.recorded') requireThat(r.opening || ['partner.created', 'schedule.created', 'schedule.stopped', 'worker.created'].includes(command.type), 'Record an opening balance before financial transactions.');
  switch (command.type) {
    case 'opening.recorded':
      requireThat(!r.opening, 'Opening balance is already recorded.');
      requireThat(Number.isSafeInteger(d.amountCents), 'Opening balance must be integer cents.'); date(d.date); text(d.accountName, 'Account name');
      break;
    case 'partner.created':
      id(d.id); d.name = text(d.name, 'Partner name'); ensureUnused(r, 'partners', d.id);
      requireThat(!r.partners.some(p => p.name.toLowerCase() === d.name.toLowerCase()), 'Partner name already exists.');
      break;
    case 'worker.created':
      id(d.id); ensureUnused(r, 'workers', d.id); d.name = text(d.name, 'Worker name');
      requireThat(['employee', 'contractor'].includes(d.kind), 'Select employee or contractor.');
      requireThat(!r.workers.some(w => w.name.toLowerCase() === d.name.toLowerCase()), 'Worker name already exists.');
      break;
    case 'receipt.recorded': {
      id(d.id); ensureUnused(r, 'receipts', d.id); id(d.dealId); d.dealLabel = text(d.dealLabel, 'Deal label');
      d.buyerName = text(d.buyerName, 'Buyer customer'); d.hosName = text(d.hosName, 'HOS recipient');
      date(d.receivedOn); amount(d.grossCents); rate(d.hosBps); rate(d.reserveBps);
      requireThat(Array.isArray(d.partnerShares), 'Partner allocations are required (empty for internal leads).');
      const partnerIds = new Set();
      d.partnerShares = d.partnerShares.map(share => {
        const p = r.partners.find(p => p.id === share.partnerId); requireThat(p, 'Lead-source partner does not exist.');
        requireThat(!partnerIds.has(p.id), 'A partner can only appear once per receipt.'); partnerIds.add(p.id);
        amount(share.amountCents, 'Partner share'); return { partnerId: p.id, name: p.name, amountCents: share.amountCents };
      });
      requireThat(total(d.partnerShares.map(p => p.amountCents)) <= d.grossCents, 'Partner shares cannot exceed the receipt.');
      if (d.reference) requireThat(!r.receipts.some(p => !p.reversed && p.reference === d.reference), 'This receipt reference is already recorded.');
      break;
    }
    case 'receipt.reversed': {
      const receipt = r.receipts.find(r => r.id === d.receiptId && !r.reversed); requireThat(receipt, 'Active receipt not found.');
      requireThat(!r.payments.some(p => p.sourceId === receipt.id && p.kind !== 'expense'), 'This receipt has payouts. An accountant must correct settled receipts through the host integration.');
      requireThat(!r.payroll.some(p => p.hosLinks.some(l => l.receiptId === receipt.id)), 'Reverse the unsettled linked payroll before correcting this receipt.');
      d.reason = text(d.reason, 'Correction reason'); date(d.date);
      requireThat(d.date === receipt.receivedOn, 'Barebones correction reversals must use the original receipt date. Refunds need a separate host workflow.');
      break;
    }
    case 'expense.recorded':
      id(d.id); ensureUnused(r, 'expenses', d.id); d.payee = text(d.payee, 'Payee'); d.category = text(d.category, 'Category'); amount(d.amountCents);
      date(d.incurredOn); date(d.dueOn); requireThat(d.dueOn >= d.incurredOn, 'Due date must not precede the expense date.');
      requireThat(['overhead', 'direct'].includes(d.kind), 'Expense kind must be overhead or direct.');
      if (d.kind === 'direct') id(d.dealId);
      if (d.scheduleId) {
        requireThat(r.schedules.some(s => s.id === d.scheduleId && !s.stopped), 'Active recurring schedule not found.'); month(d.period);
        requireThat(!r.expenses.some(e => e.scheduleId === d.scheduleId && e.period === d.period), 'A bill already exists for this schedule and month.');
      }
      break;
    case 'payment.recorded': {
      id(d.id); ensureUnused(r, 'payments', d.id); amount(d.amountCents); date(d.paidOn);
      const obligation = obligations(book).find(o => paymentTarget(o) === paymentTarget(d)); requireThat(obligation, 'Payment obligation not found.');
      requireThat(d.paidOn >= obligation.date, 'Payment date cannot precede the obligation.');
      requireThat(d.amountCents <= obligation.owedCents, 'Payment exceeds the remaining balance.');
      d.payee = obligation.payee; break;
    }
    case 'schedule.created':
      id(d.id); ensureUnused(r, 'schedules', d.id); d.payee = text(d.payee, 'Payee'); d.category = text(d.category, 'Category'); amount(d.amountCents);
      month(d.startMonth); requireThat(Number.isInteger(d.day) && d.day >= 1 && d.day <= 28, 'Monthly due day must be 1–28.'); break;
    case 'schedule.stopped':
      requireThat(r.schedules.some(s => s.id === d.scheduleId && !s.stopped), 'Active schedule not found.'); break;
    case 'payroll.recorded': {
      id(d.id); requireThat(!payloads(book, 'payroll.recorded').some(p => p.id === d.id), 'Payroll ID already exists, including reversed records.');
      const worker = r.workers.find(w => w.id === d.workerId); requireThat(worker, 'Worker not found.'); d.workerName = worker.name; d.workerKind = worker.kind;
      date(d.periodStart); date(d.periodEnd); date(d.postedOn);
      requireThat(d.periodEnd >= d.periodStart && d.postedOn >= d.periodEnd, 'Payroll posting must be on or after the period end.');
      requireThat(!r.payroll.some(p => p.workerId === d.workerId && p.periodStart === d.periodStart && p.periodEnd === d.periodEnd), 'Payroll is already recorded for this worker and period.');
      amount(d.baseCents, 'Base pay', true); amount(d.bonusCents, 'Bonus', true);
      requireThat(Array.isArray(d.hosLinks) && Array.isArray(d.deductions) && Array.isArray(d.employerCosts), 'Payroll allocation arrays are required.');
      const used = new Set();
      for (const link of d.hosLinks) {
        requireThat(!used.has(link.receiptId), 'Commission receipt is duplicated.'); used.add(link.receiptId); amount(link.amountCents, 'Linked HOS commission');
        const source = r.receipts.find(r => r.id === link.receiptId && !r.reversed);
        requireThat(source && source.hosName === worker.name, 'HOS recipient must match the selected worker.');
        const owing = obligations(book).find(o => o.kind === 'commission' && o.sourceId === source.id);
        requireThat(d.postedOn >= source.receivedOn && link.amountCents <= owing.owedCents, 'Linked HOS amount exceeds available earned commission or predates the receipt.');
      }
      const lineIds = new Set();
      for (const line of [...d.deductions, ...d.employerCosts]) {
        id(line.id); requireThat(!lineIds.has(line.id), 'Payroll liability ID is duplicated.'); lineIds.add(line.id);
        line.label = text(line.label, 'Deduction or employer cost label'); line.payee = text(line.payee, 'Remittance recipient'); amount(line.amountCents);
      }
      const calc = payrollAmounts(d); requireThat(calc.grossCents > 0 && calc.netCents >= 0, 'Payroll gross must be positive and deductions cannot exceed gross.');
      break;
    }
    case 'payroll.reversed': {
      const payroll = r.payroll.find(p => p.id === d.payrollId); requireThat(payroll, 'Payroll not found.');
      requireThat(!r.payments.some(p => p.sourceId === payroll.id && ['payroll','payroll_remittance'].includes(p.kind)), 'Paid payroll needs a formal host adjustment workflow.');
      d.reason = text(d.reason, 'Correction reason'); date(d.date); requireThat(d.date === payroll.postedOn, 'Correction uses the original payroll date.'); break;
    }
    case 'reserve.released':
      amount(d.amountCents); date(d.date); d.purpose = text(d.purpose, 'Reserve purpose'); break;
    case 'cash.recorded':
      amount(d.amountCents); date(d.date); d.note = text(d.note, 'Description');
      requireThat(['contribution', 'draw', 'loan_received', 'loan_principal_paid', 'other_income', 'customer_refund', 'capital_purchase', 'deposit_paid', 'deposit_returned', 'other_in', 'other_out', 'transfer'].includes(d.kind), 'Unsupported cash movement.');
      if(d.kind === 'transfer') { text(d.account, 'From account'); text(d.toAccount, 'To account'); requireThat(d.account !== d.toAccount, 'Transfer accounts must differ.'); } break;
    default: throw new Error('Unsupported bookkeeping command.');
  }
  const effectiveDate = d.receivedOn || d.incurredOn || d.paidOn || d.postedOn || d.date;
  if (r.opening && effectiveDate) requireThat(effectiveDate >= r.opening.date, 'Transactions cannot precede the opening balance date.');
  const next = { ...book, revision: book.revision + 1, events: [...book.events, { id: command.id, type: command.type, data: d, actorId, timestamp, request: canonical(command) }] };
  // Check the full dated reserve history, including backdated changes and reversals.
  const nr = records(next), movements = [...nr.receipts.filter(r => !r.reversed).map(r => ({ date: r.receivedOn, amount: receiptAmounts(r).reserveCents })), ...nr.releases.map(r => ({ date: r.date, amount: -r.amountCents }))];
  const dates = [...new Set(movements.map(m => m.date))].sort(); let running = 0;
  for (const day of dates) { running += total(movements.filter(m => m.date === day).map(m => m.amount)); requireThat(running >= 0, 'Reserve release exceeds the reserve available on that date.'); }
  return next;
}
export function monthlyBills(book, selectedMonth, makeId) {
  month(selectedMonth); const r = records(book);
  return r.schedules.filter(s => !s.stopped && s.startMonth <= selectedMonth && !r.expenses.some(e => e.scheduleId === s.id && e.period === selectedMonth)).map(s => {
    const day = `${selectedMonth}-${String(s.day).padStart(2, '0')}`;
    return { id: makeId(), type: 'expense.recorded', data: { id: makeId(), scheduleId: s.id, period: selectedMonth, payee: s.payee, category: s.category, amountCents: s.amountCents, kind: 'overhead', incurredOn: `${selectedMonth}-01`, dueOn: day } };
  });
}
export function dashboard(book, { from, through }) {
  date(from); date(through); requireThat(from <= through, 'Date range is reversed.');
  const r = records(book), within = day => day >= from && day <= through;
  const periodReceipts = r.receipts.filter(r => !r.reversed && within(r.receivedOn));
  const periodExpenses = r.expenses.filter(e => within(e.incurredOn));
  const receiptsThrough = r.receipts.filter(r => !r.reversed && r.receivedOn <= through);
  const paymentsThrough = r.payments.filter(p => p.paidOn <= through);
  const grossCents = total(periodReceipts.map(r => r.grossCents));
  const partnerCents = total(periodReceipts.map(r => receiptAmounts(r).partnerCents));
  const commissionCents = total(periodReceipts.map(r => receiptAmounts(r).hosCents));
  const overheadCents = total(periodExpenses.filter(e => e.kind === 'overhead').map(e => e.amountCents));
  const directCents = total(periodExpenses.filter(e => e.kind === 'direct').map(e => e.amountCents));
  const payrollCents = total(r.payroll.filter(p => within(p.postedOn)).map(p => payrollAmounts(p).newExpenseCents));
  const otherIncomeCents = total(r.movements.filter(m => within(m.date) && m.kind === 'other_income').map(m => m.amountCents));
  const refundsCents = total(r.movements.filter(m => within(m.date) && m.kind === 'customer_refund').map(m => m.amountCents));
  const unclassifiedCount = r.movements.filter(m => within(m.date) && ['other_in','other_out'].includes(m.kind)).length;
  const openingCents = r.opening && r.opening.date <= through ? r.opening.amountCents : 0;
  const cashCents = total([openingCents, total(receiptsThrough.map(r => r.grossCents)), -total(paymentsThrough.map(p => p.amountCents)), total(r.movements.filter(m => m.date <= through).map(m => cashSign(m.kind) * m.amountCents))]);
  const reserveCents = total(receiptsThrough.map(r => receiptAmounts(r).reserveCents)) - total(r.releases.filter(r => r.date <= through).map(r => r.amountCents));
  const due = obligations(book, through), owedCents = total(due.map(o => o.owedCents));
  return { grossCents, partnerCents, commissionCents, overheadCents, directCents, payrollCents, otherIncomeCents, refundsCents, unclassifiedCount, operatingResultCents: total([grossCents, otherIncomeCents, -refundsCents, -partnerCents, -commissionCents, -overheadCents, -directCents, -payrollCents]), cashCents, reserveCents, owedCents, availableCents: total([cashCents, -reserveCents, -owedCents]), dealCount: new Set(periodReceipts.map(r => r.dealId)).size, paymentCents: total(r.payments.filter(p => within(p.paidOn)).map(p => p.amountCents)), due };
}
/** Every actual cash entry, including internal transfer legs. No bill/accrual is cash. */
export function cashbook(book, { from, through }) {
  date(from); date(through); requireThat(from <= through, 'Date range is reversed.'); const r=records(book), entries=[];
  const account=r.opening?.accountName || 'Operating cash';
  if(r.opening)entries.push({id:'opening',date:r.opening.date,kind:'opening',description:'Opening book balance',account,amountCents:r.opening.amountCents});
  for(const receipt of r.receipts.filter(r=>!r.reversed))entries.push({id:receipt.id,date:receipt.receivedOn,kind:'deal_receipt',description:`${receipt.buyerName} · ${receipt.dealLabel}`,account:receipt.account||account,amountCents:receipt.grossCents,reference:receipt.reference});
  for(const payment of r.payments)entries.push({id:payment.id,date:payment.paidOn,kind:payment.kind,description:payment.payee,account:payment.account||account,amountCents:-payment.amountCents,reference:payment.reference});
  for(const movement of r.movements){const base={id:movement.eventId,date:movement.date,kind:movement.kind,description:movement.note,reference:movement.reference};if(movement.kind==='transfer'){entries.push({...base,id:`${base.id}-out`,account:movement.account,amountCents:-movement.amountCents});entries.push({...base,id:`${base.id}-in`,account:movement.toAccount,amountCents:movement.amountCents});}else entries.push({...base,account:movement.account||account,amountCents:cashSign(movement.kind)*movement.amountCents});}
  entries.sort((a,b)=>a.date.localeCompare(b.date)||((a.kind==='opening'?-1:0)-(b.kind==='opening'?-1:0)));
  let running=0;const rows=[];for(const entry of entries){running=total([running,entry.amountCents]);if(entry.date>=from&&entry.date<=through)rows.push({...entry,balanceCents:running});}
  return rows;
}
