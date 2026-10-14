# Epic Brief: Correcting and Cancelling Files

Inherits roles, auth, data source, compliance, and styling from project.md.

**Epic slug:** `file-correction-and-cancellation`
**Depends on:** `file-dashboard-and-details`

## Goal

An importer can fix the invalid rows of a failed file and re-check it until it completes, or cancel a file. Cancelling removes the file's transactions and stored copy, and is refused once any transaction is Approved.

Only importers correct and cancel files. Approvers cannot see these actions (AC-01) and the backend enforces the restriction itself (AC-03).

## Data Model

Entities this epic introduces or modifies (the backend does not exist yet; shapes are derived from the brief).

**File** (modified)
- Status: Uploaded / Processing / Completed / Failed
- Failure kind: duplicate, or invalid rows waiting for corrections (a Failed file shows which)
- Cancelled flag (cancelled files are hidden from the dashboard by default)
- Stored copy of the original file (discarded on cancel)
- Cancelled by / cancelled on (audit trail)
- Processing history stages (stages 4 to 7 are repeated on re-check)

**Invalid row** (per file, while the file waits for corrections)
- All file columns: Reference, TransactionDate, AccountNumber, Description, Amount, TransactionType, Currency
- Reasons: one or more of "Invalid Transaction Type", "Invalid Transaction Date", "Invalid Amount", "Missing Account Number", "Duplicate Reference In File"

**Transaction** (modified, removed on cancel)
- Status: Imported / Approved / Rejected
- File, reference, and other row values

## Functional Requirements

- **R1 (FC-01):** For a file with invalid rows, the file's detail screen lists only the invalid rows, with every column from the file and the reason each row failed.
- **R2 (FC-02):** The importer can change the values on an invalid row and then ask the app to check the file again.
- **R3 (FC-03):** Checking again repeats stages 4 to 7. If every row now passes, the file loads and becomes **Completed**. If any row still fails, the file stays **Failed** and the list shows the rows that still fail and how many remain.
- **R4 (FC-04):** If the importer cannot correct the file, they cancel it (rules FX-01 to FX-06).
- **R5 (FX-01):** Before cancelling, the app asks for confirmation and names the file. The safe choice, keeping the file, is the default.
- **R6 (FX-02):** The app refuses to cancel a file that has at least one **Approved** transaction, and explains why.
- **R7 (FX-03):** Cancelling a file removes its transactions from the app, so they no longer appear in the transactions list, the summaries, or exports. Because they are removed, a corrected file with the same references can be uploaded later.
- **R8 (FX-04):** Cancelling a file also discards the app's copy of the original file, so it can no longer be downloaded. A file waiting for corrections stops waiting.
- **R9 (FX-05):** A cancelled file is hidden from the dashboard unless the person chooses to show cancelled files.
- **R10 (FX-06):** Cancelling a file that someone else has already cancelled does nothing and shows the file as cancelled.
- **R11 (DB-08):** Importer only: a file that failed because of invalid rows offers a way to its correction screen straight from the list.
- **R12 (FD-06):** A **Failed** file shows the reason it failed. For invalid rows, the importer also sees the correction screen (FC-01).
- **R13 (FD-08):** Importer only: the cancel action.

## Business Rules

- **BR1 (FP-03 / FP-04):** A row is invalid when it breaks any row rule; each invalid row carries every reason it failed, not only the first. Row rules and reasons shown:
  - The transaction type is `C` or `D`. -> "Invalid Transaction Type"
  - The date can be read as a date and time. -> "Invalid Transaction Date"
  - The amount is a number, not negative, with up to two decimal places. -> "Invalid Amount"
  - The account number is not empty. -> "Missing Account Number"
  - The reference appears only once in the file, ignoring upper and lower case. -> "Duplicate Reference In File"
- **BR2 (FP-06):** A file is all or nothing. While any row is invalid, nothing from the file is loaded.
- **BR3 (FS-01):** A file that failed as a duplicate stays failed. It cannot be retried.
- **BR4 (FS-02):** A file that failed because of invalid rows can be corrected and checked again (rule FC-02).
- **BR5 (FX-02 enforcement):** The refusal is decided from transaction status alone (any Approved transaction in the file blocks cancel), so it does not depend on the transaction-review epic existing. The backend enforces it, not only the UI (AC-03).
- **BR6 (FX-06):** Cancel is idempotent; a repeat cancel changes nothing and shows the file as cancelled.
- **BR7 (FP-01):** Cancelled files do not count when checking for duplicates, so a corrected file can be re-uploaded after cancelling.
- **BR8 (AC-01 / AC-03):** Correct and cancel actions are hidden from Approvers and enforced by the backend.

## Key Workflows

1. **Correct and re-check**
   1. Importer opens a Failed file (from the dashboard link per DB-08, or the file's detail screen).
   2. The detail screen shows the failure reason and, for invalid rows, only the invalid rows with every column and each row's reasons.
   3. Importer edits values on the invalid rows.
   4. Importer asks the app to check the file again; stages 4 to 7 repeat.
   5. All rows pass: the file loads and becomes Completed. Otherwise it stays Failed and the list shows the rows still failing and how many remain.
2. **Cancel a file**
   1. Importer selects Cancel on the file's detail screen.
   2. The app asks for confirmation, naming the file; keeping the file is the default.
   3. If any transaction in the file is Approved, the app refuses and explains why.
   4. Otherwise the file is cancelled: its transactions are removed, the stored copy is discarded, and the file is hidden from the dashboard unless cancelled files are shown.
3. **Cancel an already-cancelled file:** nothing changes and the file is shown as cancelled.

## Feature NFRs

- Re-check runs asynchronously and progress is shown without manual refresh (UP-07).
- Cancel must be atomic: transactions removed and stored copy discarded together, or not at all.
- Correction edit form validates on blur and on submit, with required fields marked (GN-04).
- Success messages auto-dismiss; refusals and problems stay on screen until resolved (GN-05).
- Cancel and re-check actions are keyboard operable and any icon-only button carries a label (GN-02, GN-03).
- Audit: who cancelled a file and when is recorded (compliance, see project.md).
- Account numbers must not appear in error messages or logs (compliance, see project.md).

## Out of Scope

- Retrying a file that failed as a duplicate (FS-01).
- Uploading files, approving, rejecting and exporting transactions (other epics).
- Un-cancelling a file.
- Importer correcting valid rows, or changing which rows are in the file.

## Notes & Caveats

- Depends on `file-dashboard-and-details` for the dashboard list, file detail screen, and status display.
- No design exists (not-a-design); screens are built from the brief and neutral default styling. Status is always shown as words (FS-03).
- The backend is not built; the front-end works against a mock layer until the .NET backend exists.
