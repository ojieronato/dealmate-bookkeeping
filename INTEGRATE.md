# Copy/paste this prompt into the CRM coding agent

Implement the DealMate bookkeeping module from this repository as an additive, isolated CRM extension. This repository is the specification and tested business core. The CRM already exists and its current build, behavior, and UI must be preserved.

## Non-negotiable installation boundary

1. Inspect the host's AGENTS.md instructions, framework, package manager, routes, extension mechanism, authentication, authorization, tenant scoping, persistence, and design system before editing. Record the baseline Git status. Do not overwrite or revert user changes.
2. Do not alter existing host files, components, styles, deal calculations, CRM records, migrations, schemas, dependency versions, or global application state. Place new module code under a dedicated unused namespace such as `plugins/dealmate-bookkeeping/`, following host conventions.
3. Use an existing automatic extension discovery mechanism if adding new plugin files is sufficient. If registration requires editing an existing route, menu, package file, or registry, prepare the smallest **unapplied patch** and explain the exact files affected. Finish the module and tests first. Do not apply that patch without explicit user authorization. Do not claim the module is connected when it is only staged.
4. Default the finance feature flag to disabled. Enable it only in a local test environment or through the host's existing authorized plugin activation flow. Do not publish, deploy, migrate a production database, or switch the feature on for users as part of this request.
5. No automatic host rewrites or invasive install scripts. If the requested zero-existing-file-change boundary prevents activation, deliver the completed extension plus the optional registration patch and a working isolated preview.

## Match the CRM interface

Reuse the CRM's existing page shell, cards, headings, buttons, forms, tables, dialogs, tabs, currency/date formatters, icons, spacing, typography, colors, responsive patterns, empty states, and toasts. Build finance screens using imports of those components. Do not modify them.

Use nearby CRM pages as the visual reference. Extend the UI by composing the existing components. Do not add a competing component library, global stylesheet, CSS reset, font, or theme. Keep finance-specific styling locally scoped. The web component in `src/finance-element.mjs` demonstrates interactions and calculations; use its flow as a reference and render native host components when available. Its demo appearance does not override the CRM design.

## Business rules to preserve exactly

- **Buyer partners are customers.** They close the lead and send DealMate its agreed share, normally 50% of the assignment fee. The amount received by DealMate is its gross revenue. Never divide an existing `Total Received`, closing revenue, or projected DealMate fee by 50% again. A buyer's total assignment fee is a separate contextual field.
- **Lead-source partners are different.** REB, Thomas, and new lead sources can receive manually entered dollar amounts from DealMate's received revenue. Preserve configurable partner records. Do not hard-code 50% or 30% partner allocations from the former spreadsheet.
- **HOS means Home Offer Specialist.** HOS commission = 10% × (DealMate gross receipt − all lead-partner shares). Internal leads use zero partner shares and the same 10% rule in this version. Overhead has payment priority but does not reduce the HOS commission base. Retain per-receipt rates and historical exceptions rather than rewriting old deals.
- **Payout priority:** lead partners first, overhead and ordinary payroll bills second, HOS commissions third. Payroll containing linked HOS is placed in the third group as a whole in this barebones version; record ordinary wages separately if they need separate payment priority. Remittance liabilities are shown with bills. This is a display order, not a rule for statutory due dates. Recording a payment records a transfer already made. Never send money automatically. A shortage leaves the commission owed, not erased.
- **Reserve:** 5% of DealMate gross receipts, saved as a growth/liquidity designation. It remains company cash and is not an operating expense. A reserve release frees designated cash; purchases and their actual payments are recorded separately.
- **Overhead:** manual one-time expenses and recurring bills exist independently of deals. Months with zero closings still have expenses. Record each expense once. A per-deal profitability allocation must not create another company expense.
- Separate incurred expense dates, actual payment dates, received revenue dates, and forecast closing dates. Monthly schedules create unpaid bills and must never silently mark them paid.
- Under-contract deals can be lost. Only explicitly confirmed receipts create collected revenue. CRM stage changes alone must not create money. Keep deal stage and payment status separate. Blank closing revenue is missing information, not permission to copy projected revenue into receipts.
- **Payroll:** record workers, pay periods, gross wages, bonuses, deductions, employer costs, and actual net-pay/remittance payments. HOS already earned on a receipt can be linked into payroll once, up to its unpaid balance. Linking moves the payable; it does not create another commission expense. Gross pay = base + bonus + linked HOS. Net pay = gross − deductions. New payroll expense = base + bonus + employer costs. Deductions and employer costs remain separately payable to their specified recipients until remitted. No statutory tax calculations, filings, or payment execution are included.
- The operating result is a management view: received revenue + other operating income − customer refunds − partner allocations − earned HOS − overhead − direct costs − new payroll expense. Settlements are not subtracted again. Reserve designations, owner/loan principal movements, capital purchases, and refundable deposits are excluded. Unclassified movements affect cash and show a classification warning. Do not present this as a statutory or tax statement.
- Book cash = opening balance + all recorded external cash inflows − all recorded external cash outflows. Transfers between own accounts have two cashbook legs and no combined cash effect. Available after commitments = book cash − designated reserve − unpaid obligations. Negative available cash stays visible. The initial version captures account labels but reports a combined cash pool, not reconciled per-account balances.

## Implementation contract

1. Keep `src/finance.mjs` as the independently tested domain core, or port it only if the host cannot use JavaScript. Port all regression tests and preserve rounding and validation.
2. Implement trusted server endpoints for reads and commands. Use the host session and authorization to derive the actor and tenant. Never trust tenant IDs, actors, financial fields, or roles submitted by a browser. Check that linked deals belong to the same authorized tenant.
3. Supply the persistence and read-only CRM adapters described in `docs/ADAPTERS.md`. Use isolated financial tables/collections and server-side atomic transactions. The demo localStorage and permissive demo authorization are not production adapters.
4. Store append-only financial events with actor, timestamp, tenant, revision, and unique idempotency key. Use database transactions or optimistic compare-and-swap with retry to prevent concurrent duplicate receipts or overpayments. Return original results for identical retries. Reject reused keys with different requests.
5. Reference stable existing CRM deal/customer IDs. Do not add finance columns to existing deal tables. Keep buyer customers and lead sources separate; do not duplicate CRM customer masters. Preserve financial snapshots for issued/posted records.
6. Use integer cents and basis-point rates. Validate inputs server-side and render text safely. Avoid float arithmetic for monetary calculations. Keep USD-only scope until other currencies are explicitly requested.
7. Add namespaced schema/migration files only. Use the host's existing isolated database migration pipeline in test environments. Do not run production migrations. Disabling the feature must leave financial history intact.
8. Do not import sample data or this user's private spreadsheet into a production repository. Historical migration is separate: map by stable deal ID, preview duplicates and missing amounts, reconcile totals, and obtain explicit migration instructions.
9. Payroll records and finance exports require the host's appropriate restricted roles. Do not expose full books to ordinary CRM users. This core returns a complete book; provide a redacted server projection if a role should see only part of it. Map workers/HOS recipients to stable host person IDs when integrating; the reference preview matches names exactly. Do not collect tax IDs or bank credentials in this module.

## Screens

- Overview: collected revenue, operating result, designated reserve, available after commitments, cash, unpaid obligations, and separate under-contract forecast.
- Deal receipts: manual receipt amount/date/reference; buyer customer; HOS recipient; zero or more manually entered lead-partner allocations; live calculation preview; confirmed posting.
- Expenses & bills: general overhead or direct deal cost, payee, category, dates, amount, optional host document attachment if an existing authorized capability is available, recurring schedules, and partial payments.
- Partners & payouts: lead-source partner records; allocated, paid, and remaining balances; ordered payment queue.
- Payroll: employees/contractors, pay periods, multiple linked commissions, multiple manual deductions and employer costs, net-pay and remittance payments, unpaid correction reversals.
- Cashbook: dated receipts and payments, running combined cash balance, account labels/references, owner/loan movements, other income, customer refunds, equipment purchases, refundable deposits, internal transfers, and clearly flagged unclassified money in/out.
- Reserve & rules: designated reserve, manual releases with purpose, opening balance, separate owner/loan cash movements, and visible calculation rules.
- Activity: immutable audit trail and an authorized export.

Do not invent unfinished buttons or claim bank syncing, statutory accounting, automated payroll/tax calculation, tax filing, reconciliation, or payment execution exists. If the host needs features outside the core's scope, report the gap and keep the working barebones scope intact.

## Validation and handoff

Run the package tests and relevant host checks. Add integration tests for authorization, tenant isolation, read-only CRM access, concurrency/idempotency, payment limits, historical snapshots, expenses in months without deals, reserve releases, payroll deductions/remittances, linked HOS counted once, cashbook transfers, and feature-flag behavior. Check at least one existing CRM route for regressions. Verify keyboard forms and mobile layout.

Review the final diff against the baseline: the completed module adds only namespaced files. Report any proposed existing-file change in the unapplied registration patch separately. Describe which adapters are live, which are mocked, exact activation steps, test results, and limitations. Do not describe a demo as production-ready. Deliver the extension even when host activation must remain staged.

Record an installation manifest within the plugin namespace containing the upstream repository URL, exact commit/tag, package/schema versions, installed paths, and host-specific adapters/customizations. Keep financial records separate from source files. For later revisions, follow `docs/UPDATING.md`; an installed copy does not update automatically when the source repository changes.
