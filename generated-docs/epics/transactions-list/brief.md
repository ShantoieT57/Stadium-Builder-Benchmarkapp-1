# Epic: Transactions List and Search

Inherits roles, auth, data source, compliance, and styling from project.md.

Depends on: `file-upload-and-processing` (transactions are created by the load stage). Approve/Reject actions and the menu badge (TL-04, TL-07) belong to `transaction-review`; Export (EX-01..EX-06) belongs to `transaction-export`.

Source: `documentation/Transaction-Import-and-Approval-Brief.md` (rule IDs in parentheses).

---

## Goal

Both roles can browse, sort, page through, search and filter all transactions and open one to see its full details. Importers never see approval or export actions. Importers see the list view-only; approvers see the same list (the Approve/Reject/Export actions are added by later epics). Approvers land on this screen after sign-in (SI-05).

---

## Data Model

**Transaction** holds the values from its row in the file, plus the fields below.

| Field | Type / notes |
|---|---|
| Reference | string; unique across the app, case-insensitive (FP-05); e.g. `TXN-20260415-0001` |
| TransactionDate | date and time; e.g. `2026/04/15 08:12` |
| AccountNumber | string; e.g. `1001-2034-5567` |
| Description | free text; can be empty |
| Amount | decimal, never negative, up to two decimal places |
| TransactionType | Credit or Debit (stored from `C` / `D`); direction is carried by type, never by a minus sign |
| Currency | three-letter code; all current files use `ZAR` |
| File | the file the transaction came from |
| Status | **Imported**, **Approved**, or **Rejected** |
| Rejection reason | the approver's reason; present only on a rejected transaction |
| Last changed by | the person who last changed the transaction, or "System" when it was loaded |
| Last changed on | date and time of that change |

Statuses: Imported -> Approved, or Imported -> Rejected (with reason). Approved and Rejected are final (TS-01..TS-04). This epic only reads transactions.

---

## Functional Requirements

- **R1 (TL-01):** Each transaction shows its reference, date and time, account, description, amount, currency, credit or debit, status, and the file it came from.
- **R2 (TL-02):** The most recent transaction date appears first. The person can sort by any column, one at a time. The chosen sort stays in place while they move between pages.
- **R3 (TL-03):** The list shows 20 transactions per page by default. The person can choose 5, 10, 20, or 50.
- **R4 (TL-05):** An importer never sees **Approve**, **Reject**, or **Export**.
- **R5 (TL-06):** Opening a transaction shows all its details. A rejected transaction shows its rejection reason, which cannot be edited.
- **R6 (TL-08):** When there are no transactions at all, the list says "No transactions yet".
- **R7 (SF-01):** The person can filter by status, by file, by a range of transaction dates, by a range of amounts, and by text that matches the reference or the account number.
- **R8 (SF-02):** Filters combine. A transaction must match every active filter to appear.
- **R9 (SF-03):** Each active filter is shown on screen, and one action clears them all.
- **R10 (SF-04):** When filters match nothing, the list says no transactions match, shows the active filters, and offers to clear them.

(Original numbering in the master requirement inventory: TL-01 = R63, TL-02 = R64, TL-03 = R65, TL-05 = R67, TL-06 = R68, TL-08 = R70, SF-01..SF-04 = R71-R74.)

---

## Business Rules

- **BR1 (TL-01):** Each transaction shows its reference, date and time, account, description, amount, currency, credit or debit, status, and the file it came from.
- **BR2 (TL-02):** The most recent transaction date appears first. The sort is one column at a time and persists across pages.
- **BR3 (TL-03):** Page size options are 5, 10, 20, 50; default 20.
- **BR4 (TL-05 / AC-01):** An importer never sees **Approve**, **Reject**, or **Export**; the app hides them rather than showing them disabled.
- **BR5 (TL-06):** A rejected transaction's rejection reason is shown read-only.
- **BR6 (SF-02):** A transaction must match every active filter to appear.
- **BR7 (AC-03):** The backend enforces role rules itself, not only by hiding things on screen.
- **BR8 (FX-03):** Transactions of a cancelled file are removed from the app and never appear in the list.
- **BR9 (FS-03 / project.md):** Status is shown as words, never colour alone.

---

## Key Workflows

1. **Browse:** A signed-in user opens Transactions (approver lands here after sign-in) -> sees the list, newest transaction date first, 20 per page -> changes page size (5/10/20/50) or pages through; the chosen sort persists across pages.
2. **Sort:** User selects a column header -> list sorts by that column only (one at a time) -> sort remains while paging.
3. **Search and filter:** User sets any combination of status, file, transaction-date range, amount range, and reference/account text -> list shows only transactions matching all filters -> each active filter is displayed -> "clear all" resets them.
4. **No matches:** Filters match nothing -> list says no transactions match, shows the active filters, and offers to clear them.
5. **Empty:** No transactions exist -> list says "No transactions yet".
6. **Open details:** User selects a transaction -> sees all its details (including rejection reason when rejected, read-only).
7. **Deep link in from other screens:** The list can be opened pre-filtered by status (from dashboard counts, DB-01) or by file and status (from file details, FD-02); these filters appear as active filters.

---

## Feature NFRs

- Filter, sort and paging are applied server-side over all transactions (not only the loaded page); the backend list endpoint accepts sort, page, page size and all SF-01 filters.
- On narrow screens, rows show key details (reference, date, amount, credit/debit, status) and keep details access available (GN-01).
- All filter controls, sort headers, paging and opening a transaction are keyboard operable; icon-only buttons have hover/focus labels (GN-02, GN-03).
- Filter state (including sort and page size) is reflected in the URL so deep links from the dashboard and file details work.

---

## Out of Scope

- Approve and Reject actions and the Imported-count badge on the Transactions menu (TL-04, TL-07, AP-*, RJ-*): `transaction-review` epic.
- Export (EX-*): `transaction-export` epic.
- Sign-in/roles, dashboard and file screens, upload and processing: other epics.

---

## Notes & Caveats

- Amount and currency display: all current data is `ZAR`; other currencies are out of scope for the project.
- The backend does not exist yet; use the mock layer per project.md until the .NET backend is live.
- Example data: `documentation/TestFiles/transactions_2026-04-15.csv` loads 20 transactions (5 credits, 15 debits), all **Imported**.
