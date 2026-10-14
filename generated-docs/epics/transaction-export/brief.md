# Exporting Transactions

Inherits roles, auth, data source, compliance, and styling from project.md.

**Depends on:** transactions-list (the list columns, filters and filter state this epic exports).

## Goal

Approvers export exactly the transactions matching their current filters to a spreadsheet-friendly CSV whose name describes the filters and date. Only approvers export; importers never see **Export** (TL-05, AC-01).

## Data Model

No new entities. Export reads the Transaction entity (project brief "Transactions"):

| Field | Notes |
|---|---|
| Reference, date and time, account, description, amount, currency, credit or debit, status, file | Same columns as the transactions list (TL-01) |
| Rejection reason | Present only on a rejected transaction; extra export column |
| Last changed by | The person who last changed the transaction, or "System" when it was loaded; extra export column |
| Last changed on | Date and time of that change; extra export column |

Filter inputs (from SF-01): status, file, transaction date range, amount range, text matching reference or account number.

## Functional Requirements

- **R1 (EX-01):** Export produces a `.csv` file of exactly the transactions that match the current filters, across all pages, not only the page on screen.
- **R2 (EX-02):** With no filters active, export includes every transaction.
- **R3 (EX-03):** The export has the same columns as the transactions list, plus the rejection reason, who last changed each transaction, and when.
- **R4 (EX-04):** The export's file name includes the export date and describes the active filters, for example `transactions_Imported_2026-04-15.csv`.
- **R5 (EX-05):** When the current filters match nothing, export is unavailable and the app explains why.
- **R6 (EX-06):** The export opens cleanly in a spreadsheet program.

(Project-wide numbering: R84-R89 map to R1-R6 here.)

## Business Rules

- **BR1:** Only approvers export. Importers never see **Export** (TL-05); it is hidden, not disabled (AC-01).
- **BR2 (AC-03 / TS-04):** The backend enforces the approver-only rule itself; an importer calling the export endpoint directly is refused.
- **BR3 (SF-02):** Filters combine; a transaction must match every active filter to be exported.
- **BR4 (FX-03):** Transactions of cancelled files are removed from the app and never appear in exports.
- **BR5 (TL-02):** The export covers all matching rows regardless of the list's page size or current page.

## Key Workflows

1. Approver opens Transactions, optionally applies filters (status, file, date range, amount range, text).
2. Approver chooses **Export**.
3. The app produces a CSV of every transaction matching the current filters (all pages) and downloads it with a name containing the export date and the active filters, e.g. `transactions_Imported_2026-04-15.csv`.
4. Approver opens the file in a spreadsheet program and sees clean columns.
5. Alternate: filters match nothing -> **Export** is unavailable and the app explains why (EX-05).

## Feature NFRs

- **NFR-1:** Exports of large result sets must not time out or load all rows into the browser page; the backend streams or generates the file for the full filtered set (R1, R2).
- **NFR-2:** Personal data minimisation (POPIA): export contains only the columns in R3, and account numbers do not appear in error messages or logs.
- **NFR-3:** The Export action is keyboard-operable, and if icon-only has a tooltip/focus label (NFR-base-6). The unavailable state's explanation is conveyed in text, not colour alone.
- **NFR-4:** Export failure shows a user-visible error with retry (NFR-base-5).

## Out of Scope

- Export for importers.
- Export formats other than `.csv`.
- Exporting files/processing history (only transactions).
- No other explicit exclusions captured at intake; refine during BUILD if scope ambiguity surfaces.

## Notes & Caveats

- "Opens cleanly in a spreadsheet program" (EX-06) is not specified further. Likely needs: UTF-8 with BOM, correct quoting of commas/quotes/newlines in descriptions, and neutralising leading `=`, `+`, `-`, `@` in text cells (formula injection). Confirm with the user during BUILD; treated as a story-level decision.
- Exact file-name pattern for multiple or combined filters (e.g. status plus file plus date range) is not defined beyond the single example `transactions_Imported_2026-04-15.csv`; define during stories and confirm.
- Backend does not exist yet; the front-end uses the mock layer until the .NET export endpoint is live.
