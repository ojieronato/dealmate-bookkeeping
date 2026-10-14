import { emptyBook, validateBook, applyCommand, monthlyBills, DEFAULT_RATES, requireThat } from './finance.mjs';
/** Storage adapter must enforce atomic transactions and tenant scoping on a trusted server. */
export function createBookkeepingPlugin({ enabled = false, tenantId, store, crm, authorize, rates = DEFAULT_RATES, clock = () => new Date().toISOString(), makeId = () => crypto.randomUUID() }) {
  requireThat(typeof tenantId === 'string' && tenantId, 'Tenant ID is required.');
  requireThat(store?.read && store?.transact && typeof authorize === 'function', 'Storage and authorization adapters are required.');
  const key = `dealmate-bookkeeping:v1:${tenantId}`;
  async function guard(action, context) { requireThat(enabled, 'Bookkeeping feature is disabled.'); const principal = await authorize(action, { ...context, tenantId }); requireThat(principal?.actorId, 'Bookkeeping access denied.'); return principal; }
  async function read(context) { await guard('read', context); const book = await store.read(key) || emptyBook(tenantId); validateBook(book, tenantId); return structuredClone(book); }
  async function dispatch(command, context) {
    const principal = await guard('write', context);
    return store.transact(key, current => {
      const book = current || emptyBook(tenantId); validateBook(book, tenantId);
      if(command.type === 'receipt.recorded' && !book.events.some(e => e.id === command.id)) requireThat(command.data.hosBps === rates.hosBps && command.data.reserveBps === rates.reserveBps, 'Receipt rates must match the approved server configuration.');
      return applyCommand(book, command, { actorId: principal.actorId, timestamp: clock() });
    });
  }
  return {
    read, dispatch,
    rates: Object.freeze({ ...rates }),
    command: (type, data) => ({ id: makeId(), type, data }),
    makeId,
    async deals(context) { await guard('read', context); return crm?.listDeals ? crm.listDeals({ ...context, tenantId }) : []; },
    async generateMonthlyBills(period, context) {
      const principal = await guard('write', context);
      return store.transact(key, current => { let book = current || emptyBook(tenantId); validateBook(book, tenantId); for (const command of monthlyBills(book, period, makeId)) book = applyCommand(book, command, { actorId: principal.actorId, timestamp: clock() }); return book; });
    }
  };
}
/** In-memory reference for tests/server prototypes. Not a persistent production store. */
export function createMemoryStore() {
  const values = new Map(), locks = new Map();
  return {
    async read(key) { return structuredClone(values.get(key)); },
    transact(key, update) {
      const pending = (locks.get(key) || Promise.resolve()).then(() => { const next = update(structuredClone(values.get(key))); values.set(key, structuredClone(next)); return structuredClone(next); });
      locks.set(key, pending.catch(() => {})); return pending;
    }
  };
}
