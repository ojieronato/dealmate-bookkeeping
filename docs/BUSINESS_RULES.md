# Business rules

## Separate parties and separate amounts

Buyer partners are paying customers. The buyer's full assignment fee and DealMate's received share are different amounts. A $20,000 assignment with a $10,000 payment to DealMate produces $10,000 gross DealMate revenue. The core only posts confirmed DealMate receipts; it does not calculate or record the buyer's retained fee as DealMate income.

Lead-source partners receive a manual allocation from that received money. Zero allocations means an internal lead. The old spreadsheet's partner percentages are not defaults in the module.

## Formula and payment order

For a $10,000 receipt with a $3,000 lead-partner allocation:

| Item | Amount |
| --- | ---: |
| Received gross | $10,000 |
| Lead partner | $3,000 |
| HOS base | $7,000 |
| HOS at 10% | $700 |
| Reserve at 5% of gross | $500 |

Payments are prioritized partners, overhead/bills, then commissions. The commission is earned on the after-partner base before overhead; a shortage does not reduce the amount owed. The UI records completed transfers only. It does not enforce priority by rejecting a real historical out-of-order payment.

The current general rule applies 10% after partner shares to internal leads too, with zero partner share. Historical 5% HOS exceptions from the source sheet must stay as historical rate snapshots during a separately authorized migration. The new default must not rewrite old records.

## Actuals and forecast

CRM projections do not affect cash, commission payables, or reserve. A closed/paid CRM label is insufficient to reconstruct an amount or date. Enter a confirmed receipt or import a verified payment with a unique reference. Multiple receipts for one deal are permitted; the dashboard counts distinct deal IDs in the period.

## Expenses and history

Overhead is incurred independently of closings. Recurring schedules generate unpaid bills for selected months. No monthly expense is inferred from the number of closed deals. Historical bills keep their recorded amounts even when a schedule changes. Payments settle bills; they do not create a second expense in the operating-result view.

## Reserve and cash

The reserve is a designation within company cash. Releasing it increases available cash without changing book cash or operating results. Actual expansion spending requires an expense plus payment. Cash available after commitments deducts both designated reserve and unpaid obligations. This can be negative and is not a spending authorization.

Opening cash, contributions, draws, loan receipts, and loan principal payments are separated from income and operating expense. The barebones book tracks one USD cash pool; a production host must add account-level reconciliation before presenting it as a verified bank balance.

The cashbook captures account labels and bank references, including two legs for transfers between own accounts. Their net effect is zero. Other operating income and customer refunds affect the management result. Equipment purchases, refundable deposits, owner movements, and loan principal affect cash without becoming operating income/expense. A loan payment's interest belongs in an expense; principal belongs in the loan movement. Unclassified money in/out is flagged and excluded from the management result pending a host reclassification workflow. Refunds do not automatically change partner shares, HOS earned, or reserve designations.

## Payroll

Workers can be employees or contractors. Post an approved payroll calculation with pay period, posting date, wages, bonus, linked HOS commissions, employee deductions, and employer costs. The UI permits multiple commissions and multiple liabilities with separate recipients. It performs no statutory tax calculation, filing, or transfer.

- Gross pay = base wages + bonus + linked earned HOS.
- Net pay = gross pay − employee deductions.
- New payroll expense = base wages + bonus + employer costs. Linked HOS was already recognized on receipt.
- Unpaid HOS shifts into payroll obligations when linked, preserving the total owed without duplicate expense.
- Net pay and each deduction/employer liability are settled independently. A payment reduces cash and the matching payable, never expense a second time.

For example, $1,000 base + $500 linked HOS − $200 deductions yields $1,300 net pay. With $100 employer costs, new payroll expense is $1,100. The $200 withheld and $100 employer liability are still owed separately. Payroll containing HOS appears in payment priority group three as a whole; ordinary payroll and remittances appear with bills. This display order does not determine legal payment deadlines.

The reference UI matches a worker name to the HOS recipient exactly. Host integration should use stable person IDs. Duplicate worker/pay-period records and overallocated commissions are rejected. Unpaid payroll may be reversed with a reason and replaced with a fresh ID; any actual payment blocks that simple reversal.

## Dates and reports

Period activity uses date-only fields; book balances and obligations are as of period end. The UI reports an explicit month/year, not a floating TODAY-based YTD formula. Historical charts would need to read the same recorded events, not current overhead settings. A recorded correction reversal restates the original date in this version and is retained in audit history; closed-period controls belong to the host implementation.

## Precision and integrity

All amounts are integer cents. Rates are basis points (1000 = 10%; 500 = 5%). Each percentage rounds half-up to the nearest cent, using integer arithmetic. Duplicate receipt references and duplicate partner allocations are rejected. Identical command retries are safe. Atomic persistence is mandatory to avoid concurrent overpayments.
