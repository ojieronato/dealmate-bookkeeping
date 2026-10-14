# DealMate Bookkeeping

A barebones, framework-independent finance module for a CRM. Includes a working browser preview and a headless core that an integrating agent can render with the CRM's own UI components.

## Start the preview

Requires Node.js 22 or newer. No packages to install.

```sh
npm start
```

If npm is unavailable, run `node scripts/serve.mjs` instead.

Open `http://127.0.0.1:4173`. Fictional sample data is dated October 2026. The selected month starts there intentionally. Changes persist only in this browser's local storage under a dedicated sample-workspace key. The preview has no live CRM, bank, Google Sheets, or payment-provider connection. It must not be used as production storage for real books.

```sh
npm run check
npm test
```

## Integrate into your CRM

Give the coding agent the full **[INTEGRATE.md](INTEGRATE.md)** prompt and this repository. It directs the agent to discover the CRM framework, reuse its UI, implement secure server storage, and leave existing host files untouched. When registration requires a host edit, the agent must prepare an unapplied patch for review.

Integration uses `src/index.mjs`. `src/finance-element.mjs` is an optional reference web component, with isolated Shadow DOM styles. It is not a replacement design system. `demo/` is a local reference application, not a production backend.

See [adapter contract](docs/ADAPTERS.md), [business rules](docs/BUSINESS_RULES.md), and [scope and acceptance](docs/ACCEPTANCE.md).

## Included

- Confirmed receipts linked to read-only CRM deal IDs. Under-contract forecasts remain separate.
- Manually entered lead-source partner dollar shares, including multiple partners per receipt.
- HOS at 10% after partner shares; a 5% reserve on received gross. Rates are saved per receipt.
- Expenses, direct deal costs, recurring monthly bill schedules, and partial payments.
- Payroll for employees and contractors: wages, bonuses, multiple linked HOS commissions, deductions, employer costs, net pay, and separate remittances.
- A priority queue: lead partners, overhead/payroll bills, then HOS and payroll containing HOS.
- Outstanding obligations, book cash, reserve, and cash remaining after commitments.
- Cashbook for all recorded money in/out, including owner contributions/draws, loans, other income, refunds, equipment purchases, refundable deposits, and transfers between own accounts.
- Append-only audit history, safe command retries, correction reversals before settlement, and audit JSON download.
- Integer-cent calculations and automated regression tests.

## Boundaries

This release is an operational bookkeeping subledger, not a complete statutory accounting package. Payroll amounts are entered manually from an approved calculation; the module records them and their settlements. It does not calculate statutory deductions, file taxes, run payroll payments, or initiate any bank transfers. A general ledger/trial balance, bank reconciliation/feeds, depreciation, foreign currencies, attachment storage, and historical spreadsheet import are outside this release. The operating result is a management view, not tax profit or a verified bank balance.

Receipts with partner or HOS payouts require a proper adjustment/refund workflow in the host before correction. Unsettled erroneous receipts can be reversed with an audit reason and re-entered. Expense and payment correction commands are intentionally absent; production adoption should implement approved append-only adjustments rather than direct mutation.

Unpaid payroll can also be reversed and replaced. Paid payroll needs a host adjustment workflow. Customer refunds can be recorded as money out, but do not automatically claw back partner/HOS payouts or release reserves. Unclassified cash movements remain flagged; reclassification needs a host adjustment workflow. Account labels are captured, while the running balance is for the combined cash pool.

Partner allocations are entered when recording the received money. In this first version, finalize those amounts before posting or reverse and replace an unsettled erroneous receipt. Monthly schedules create unpaid bills only; recording payment is a separate action.

## GitHub

Follow [GITHUB-HANDOFF.md](GITHUB-HANDOFF.md) for upload steps and a copy/paste Claude handoff. After installation, use [the update guide](docs/UPDATING.md) to revise the plugin while preserving host adaptations and financial history. Updates are applied deliberately; this package has no automatic updater.

Source repository: [ojieronato/dealmate-bookkeeping](https://github.com/ojieronato/dealmate-bookkeeping). Do not include real customer records, financial exports, credentials, or local browser storage in the repository.

Publishing this source does not install it into the existing CRM. `docs/VERIFICATION.md` records the checks completed for this delivery.
