# Delivery verification

Checked October 13, 2026 with Node.js v24.19.0 and the Codex in-app browser. All sample records are fictional.

## Automated checks

- `node scripts/check.mjs`: syntax and UI isolation checks passed.
- `node --test`: 27 tests passed, 0 failed.
- Tests cover exact cents and rounding, external/internal receipts, never halving company gross again, expenses without closings, partial payouts, reserve releases, duplicate retries/references, historical rates, recurring bills, period boundaries, tenant/feature guards, atomic concurrent posting/payment, payroll gross/net/remittances, HOS counted once, multiple payroll commission links/liabilities, unpaid corrections, payroll ID reuse protection, other cash movements and transfers.

## Browser checks

- Local preview returned HTTP 200; corrected the root-page module URL and verified the rendered dashboard.
- The seeded dashboard shows collected revenue $18,000, earned HOS $1,500, reserve $900, overhead $3,100, direct costs $125, new payroll expense $780, and management operating result $9,495.
- Entered fictional payroll with $100 wages, two existing HOS links ($100 + $200), $50 deduction, and $10 employer cost. UI posted $350 net pay and $110 new expense, without duplicating HOS expense.
- Reversed that fully unpaid test payroll through the UI; previous balances returned. Audit history retains both events.
- Recorded an additional fictional $100 partial net-pay payment. Payroll now shows $800 cumulative net pay settled and $250 remaining net pay on the seeded period; combined payroll/remittance liabilities total $480. Cashbook shows the payment and $13,975 combined cash; operating result remains $9,495.
- Reviewed the overview at 390 × 844. Cards stack in two columns, actions wrap, and the section navigation scrolls horizontally.
- Reviewed the receipt dialog at the narrow width; it scrolls within the viewport. Escape dismisses the dialog. Restored the default viewport. No browser warning/error logs were reported in the checked session.

`overview-preview.jpg` and `payroll-preview.jpg` show the tested browser sample after the partial payment. A fresh browser starts from the original fictional seed and will have $100 more cash until that test payment is entered.

## Integration status and limits

At the initial October 13 delivery, no existing CRM repository was supplied or edited and no GitHub repository was created or updated. No real customer records were migrated, and no external payment was sent. Integrate the source using `INTEGRATE.md`.

The preview uses localStorage for fictional data only. Production host authentication, payroll permissions, tenant/deal ownership checks, durable transactional persistence, backup/restore, reconciliation, and host UI integration remain required. Those integrations cannot be validated without the CRM source. Manual payroll recording is included; automatic payroll tax calculations, filing, bank feeds, a full general ledger, and settled-entry adjustments are not included.

## Expense table alignment correction

Aligned monetary headings with their right-aligned values and enabled tabular digits. Expenses now show Balance separately from the payment Action. Expense and recurring tables share matching payee, category, date, and amount column positions. Recurring schedules show an explicit Active/Stopped status.

Verified the rendered header/cell edges and shared column boundaries in the browser. At a 390-pixel viewport the tables scroll inside their panels without increasing page width. Syntax/UI isolation checks passed. This presentation-only change does not alter financial calculations. See `expenses-preview.jpg`.
