# Adapter contract

The package has no framework or database dependency. The browser calls host endpoints; those endpoints invoke the plugin with trusted dependencies. Do not expose the production storage adapter directly to the browser.

```js
import { createBookkeepingPlugin } from './src/index.mjs';

const plugin = createBookkeepingPlugin({
  enabled: hostFeatureFlags.bookkeeping,
  tenantId: authenticatedTenant.id,
  authorize: async (action, context) => {
    // Revalidate the real server session, tenant membership, and finance role.
    return allowed ? { actorId: authenticatedUser.id } : null;
  },
  store: {
    read: async key => readNamespacedBook(key),
    transact: async (key, update) => databaseTransaction(async tx => {
      // Lock the tenant's book row or use revision compare-and-swap with retry.
      const current = await readForUpdate(tx, key);
      const next = update(current);
      await saveBook(tx, key, next);
      return next;
    })
  },
  crm: {
    listDeals: async ({ tenantId }) => readAuthorizedCRMDeals(tenantId)
  }
});
```

The names above are pseudocode; implement them using the host's actual APIs. Each key starts `dealmate-bookkeeping:v1:`. The tenant identifier must be server-derived. `update` is synchronous and pure; the full read/update/write must be atomic. Avoid last-write-wins storage. Store unique `(tenant_id, command_id)` and a revision in a normalized implementation. A single namespaced JSON row under a transactional row lock is acceptable for a small initial deployment.

`authorize(action, context)` runs on every plugin read/write and deal read. Return `{actorId}` only after authorization. The actor in the event comes from that result. The core is validation logic, not an authentication system. A hostile browser must not get direct access to a permissive callback.

`crm.listDeals` is read-only and returns:

```js
[{ id: 'stable-host-id', label: 'Deal label', buyerName: 'Existing customer',
   stage: 'under_contract', expectedCompanyRevenueCents: 1750000,
   expectedCloseOn: '2026-10-28' }]
```

The expected amount is already DealMate's projected share. Valid stages for forecast display include `under_contract`; the host must map its own statuses. Closed/lost deals do not appear in the active forecast. Financial receipts remain separate records. For writes referencing CRM IDs, validate membership and tenant ownership on the trusted server; snapshots such as buyer labels must be resolved or checked there.

Commands use `{id, type, data}`. Preserve the same command ID through a network retry. Generate a new ID only for a distinct user action. Transaction record IDs are separate from command IDs. The core records a canonical request fingerprint for identical retry detection. Do not log command payloads or books to a public telemetry sink.

`plugin.generateMonthlyBills('YYYY-MM', context)` creates missing monthly bills within one atomic transaction. It is safe to repeat. It does not send invoices, initiate payments, or mark bills paid. To change a recurring rate, stop the old schedule and add another. Existing bills remain unchanged.

## Payroll contract

Create a worker with `worker.created`: `{id, name, kind: 'employee' | 'contractor'}`. Post payroll with:

```js
{
  id: 'payroll-id', workerId: 'worker-id',
  periodStart: '2026-10-01', periodEnd: '2026-10-15', postedOn: '2026-10-15',
  baseCents: 100000, bonusCents: 0,
  hosLinks: [{ receiptId: 'existing-receipt-id', amountCents: 50000 }],
  deductions: [{ id: 'withheld-1', label: 'Approved withholding',
    payee: 'Specified recipient', amountCents: 20000 }],
  employerCosts: [{ id: 'employer-1', label: 'Employer cost',
    payee: 'Specified recipient', amountCents: 10000 }]
}
```

These are manually approved payroll figures, not tax-rate defaults. `hosLinks` can be empty or include several receipts. Liability IDs must be distinct within that payroll. The core snapshots worker name/type. An HOS link must belong to that worker (exact name match in this reference version), be earned by posting date, and stay within unpaid unassigned commission. Add stable host person IDs when adapting to the CRM.

Use `payment.recorded` with `kind: 'payroll'`, `sourceId: payroll.id` for net pay; use `kind: 'payroll_remittance'`, the same `sourceId`, and the specific `lineId` for each liability. Both also require a new payment `id`, `amountCents`, and `paidOn`; include account/reference for traceability. Unpaid `payroll.reversed` uses `{payrollId, date: originalPostedOn, reason}`. A replacement must use a fresh ID. Do not store bank credentials or employee government IDs.

## Cashbook contract

`cashbook(book, {from, through})` returns date-ordered recorded cash entries and combined running balance. Receipts and payments generate entries automatically; do not create a second `cash.recorded` for the same event.

`cash.recorded` takes `{kind, amountCents, date, note, account, reference}`. Kinds: `contribution`, `draw`, `loan_received`, `loan_principal_paid`, `other_income`, `customer_refund`, `capital_purchase`, `deposit_paid`, `deposit_returned`, `other_in`, `other_out`, `transfer`. A transfer also requires a different `toAccount`; it produces two offsetting entries. `other_in`/`other_out` remain flagged as unclassified. Ordinary operating payments should settle an expense, and wages should settle payroll.

The initial opening balance is one combined cash pool; account names are labels, not reconciled bank ledgers. Reserve releases are designations and create no cash entry. Customer refunds do not automatically claw back existing shares or commissions. Formal reclassification, settled corrections, and refunds with allocation adjustments need host commands and tests.

## Optional reference UI

```js
import './src/finance-element.mjs';
await element.connect({ plugin: authorizedBrowserFacade, today: '2026-10-12' });
```

The facade exposes `read`, `deals`, `dispatch`, `generateMonthlyBills`, `command`, `makeId`, and `rates`, backed by authenticated host endpoints. The server must check all client data and enforce rates approved for that operation. The local demo uses a same-browser Web Lock and localStorage solely for sample data.

The reference element uses Shadow DOM. Optional inherited tokens: `--dm-font`, `--dm-text`, `--dm-muted`, `--dm-primary`, `--dm-background`, `--dm-surface`, `--dm-border`, `--dm-radius`. For the requested native CRM appearance, compose the host's UI components around the headless core instead of modifying the host's CSS.

## Import/export and real books

Audit export includes potentially sensitive financial data; restrict it with host permissions. The preview JSON download is not a verified backup/restore workflow. Historical imports, opening liabilities, attachments, reconciled account balances, closed accounting periods, formal refund/adjustment entries, and durable backup/restore need explicit host implementation before broader bookkeeping adoption.
