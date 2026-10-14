# Acceptance and safe integration

## Included release checks

- [ ] Run `npm run check` and `npm test` successfully.
- [ ] Record a receipt and verify 10% HOS after manual partner allocations and 5% gross reserve.
- [ ] Record an internal receipt with no lead partner.
- [ ] Record overhead in a month with no receipt; its operating result must still include the expense.
- [ ] Record a partial payout; cash and payable decrease, operating result is unchanged.
- [ ] Create recurring bills twice for one month; no duplicates and no automatic payments.
- [ ] Release reserve; total cash and operating result stay unchanged.
- [ ] Link multiple HOS receipts to payroll; existing commissions are not expensed again.
- [ ] Record deductions and employer costs; net-pay and remittance payments settle separate balances.
- [ ] Reject overallocated HOS, duplicate payroll periods, excessive deductions, and reuse of reversed payroll IDs.
- [ ] Record cashbook transfers, owner/loan movements and refunds with the expected combined cash effect.
- [ ] Review audit records, keyboard forms, and narrow layout.

The delivery's actual test results are recorded in `VERIFICATION.md` rather than treating this checklist as evidence of tests not yet run.

## Host activation requirements

- Existing CRM files are unchanged unless a reviewed registration patch has been explicitly authorized.
- Existing CRM UI components and authorization are reused.
- Server-side tenant isolation and linked-deal ownership are tested.
- Production persistence is durable and atomic, with backup/restore and access-controlled exports.
- Original sheets and existing CRM totals are reconciled before historical migration. Missing receipt amounts, rate exceptions, and partner shares require explicit mapping.
- Feature flag defaults off. No sample financial data is loaded for real tenants.
- Disable/remove the UI without deleting the underlying financial history.
- State remaining gaps: no full general ledger, bank feed/reconciliation, automated payroll tax calculation/filing, attachment store, or automatic refunds/settled-entry corrections in this barebones release.
