# Epic Brief: File Upload and Processing

Inherits roles, auth, data source, compliance, and styling from project.md.

**Epic slug:** `file-upload-and-processing`
**Depends on:** auth-and-app-shell

## Goal

An importer uploads the daily transactions file, and the app checks it, rejects duplicates, flags invalid rows with every reason, and loads valid files as Imported transactions. The supplied example file loads exactly as the brief expects.

Only importers upload files. Live progress on the dashboard and file details (UP-07) belongs to file-dashboard-and-details; the correction UI (FC-01..FC-04) and cancellation (FX-01..FX-06) belong to file-correction-and-cancellation. This epic delivers the upload screen, the backend processing pipeline, and the statuses/state rules those later epics build on.

## Data Model

**File** (one per upload)
- Name (the original file name, form `transactions_2026-04-15.csv`), original copy stored, uploaded by, uploaded at, last processed at, row count (transaction rows, not counting the header), status (Uploaded / Processing / Completed / Failed), failure reason (duplicate, naming the earlier file, or invalid rows), file kind (Bank transactions).
- Summary counts: rows loaded, rows skipped because the reference already existed, rows ignored because the reference was empty (FP-07).
- Processing history: one entry per stage with stage name, start time, finish time.

**File row** (as read from the CSV, held while the file is checked)
- Reference, TransactionDate (e.g. `2026/04/15 08:12`), AccountNumber (e.g. `1001-2034-5567`), Description (can be empty), Amount (never negative, up to two decimal places), TransactionType (`C` or `D`), Currency (three-letter code; all current files `ZAR`).
- Invalid-row reasons: every reason that applies (FP-04).

**Transaction** (created on load)
- The values from its row, plus File, Status (Imported / Approved / Rejected), Rejection reason (only on rejected), Last changed by ("System" when loaded), Last changed on.
- `C` becomes Credit and `D` becomes Debit. The amount is never negative; direction comes from the type, never a minus sign.

## Functional Requirements

- **R1 (UP-01):** The importer can drag a file onto the Upload screen or choose it from their computer.
- **R2 (UP-02):** The importer chooses what kind of file it is. There is one kind today, **Bank transactions**, and the app selects it for them.
- **R3 (UP-03):** The app accepts only `.csv` files. When it refuses a file, the message says what kind of file it expects.
- **R4 (UP-04):** The file name must not be empty, must be 255 characters or fewer, and must not contain `..`, `\`, `/`, or `:`. Otherwise the app refuses the upload with the message "Invalid file name".
- **R5 (UP-05):** While the file uploads, the screen shows progress. When the upload finishes, the app confirms with "<file name> has been uploaded successfully."
- **R6 (UP-06):** If the upload fails part way, the app says so and lets the importer try again.
- **R7 (Processing stages):** Seven processing stages run in order, each recorded with start/finish time (shown in the file's processing history):
  1. Receive: The app keeps a copy of the original file, records who uploaded it and when, and counts the transaction rows in it, not counting the header.
  2. Duplicate check: The app checks whether exactly the same file has already been brought in (rule FP-01). A duplicate stops here and fails.
  3. Read rows: The app reads each row. A row with an empty Reference is ignored, not reported as an error.
  4. Convert types: `C` becomes **Credit** and `D` becomes **Debit**.
  5. Check rows: The app checks every row against the row rules (FP-03).
  6. Wait for corrections: If any row breaks a rule, the file stops here until the importer corrects the rows or cancels the file. Nothing from the file is loaded while it waits.
  7. Load: The app turns every row into a transaction with the status **Imported**, skipping any whose reference already exists (FP-05).
- **R8 (FP-01):** A file is a duplicate when its content is identical to another file that is uploaded, processing, completed, or waiting for corrections. Earlier files that were cancelled or that failed as duplicates do not count. A file with no transaction rows is never treated as a duplicate.
- **R9 (FP-02):** A duplicate file fails with a message naming the earlier file, for example "File is a duplicate of another file transactions_2026-04-15.csv".
- **R10 (FP-03):** A row is invalid when it breaks any of the row rules below.
- **R11 (FP-04):** Each invalid row carries every reason it failed, not only the first.
- **R12 (FP-05):** Transaction references are unique across the whole app, ignoring upper and lower case. When a row's reference already exists, the app skips that row and does not change the existing transaction.
- **R13 (FP-06):** A file is all or nothing. While any row is invalid, nothing from the file is loaded.
- **R14 (FP-07):** The file's summary shows how many rows were loaded, how many were skipped because their reference already existed, and how many were ignored because their reference was empty. The three always add up to the file's row count.
- **R15 (FP-08):** The app records "System" as the person who created each loaded transaction.
- **R16 (Row rules and their reasons):** The reason shown on the row for each broken rule:
  - The transaction type is `C` or `D`. -> Invalid Transaction Type
  - The date can be read as a date and time. -> Invalid Transaction Date
  - The amount is a number, not negative, with up to two decimal places. -> Invalid Amount
  - The account number is not empty. -> Missing Account Number
  - The reference appears only once in the file, ignoring upper and lower case. -> Duplicate Reference In File
- **R17 (FS-01):** A file that failed as a duplicate stays failed. It cannot be retried.
- **R18 (FS-02):** A file that failed because of invalid rows can be corrected and checked again (rule FC-02). (The correction itself is delivered by file-correction-and-cancellation; this epic leaves the file in a state where that is possible.)
- **R19 (TS-01):** Every loaded transaction starts as **Imported**.
- **R20 (Supplied example file):** The supplied example file `transactions_2026-04-15.csv` imports as-is: file status **Completed**, 20 rows, 20 transactions loaded all **Imported**, 5 credits totalling 28,927.82 ZAR, 15 debits totalling 12,229.39 ZAR. Uploading the same file again fails as a duplicate (FP-01).

## Business Rules

- **BR1:** File statuses are one of four: **Uploaded** (received, checking not started), **Processing** (checking or loading), **Completed** (transactions loaded and ready for approval), **Failed** (duplicate, or invalid rows waiting for corrections; the file shows which).
- **BR2:** FS-03: The status is always shown as words, never as a colour alone.
- **BR3:** An upload only hands the file over; checking and loading happen afterwards, asynchronously (UP-07 context; progress display is in file-dashboard-and-details).
- **BR4:** Amount is never negative; credit/debit is carried only by the transaction type (`C`/`D`).
- **BR5:** Only importers upload (AC-01..AC-03); the backend enforces this itself.

## Key Workflows

1. Importer signs in, lands on Upload, drags or chooses a `.csv` file; Bank transactions is pre-selected.
2. App validates file type and name; on failure shows the message ("Invalid file name" or the expected-file-type message).
3. Upload shows progress, then "<file name> has been uploaded successfully."; on mid-way failure the app says so and allows retry.
4. Backend runs Receive, Duplicate check, Read rows, Convert types, Check rows, then Wait for corrections or Load, recording each stage's start/finish.
5. Duplicate: file fails with "File is a duplicate of another file <earlier file name>".
6. Invalid rows: file is Failed with every reason on each invalid row; nothing loaded.
7. All valid: every row becomes an Imported transaction created by "System"; file is Completed with loaded/skipped/ignored counts summing to the row count.

## Feature NFRs

- **NFR1:** Upload and processing do not block each other: the upload returns once the file is handed over; processing is asynchronous.
- **NFR2:** Uploaded files are stored encrypted with the original kept exactly as uploaded; account numbers must not appear in logs or error messages (see project.md Compliance).
- **NFR3:** Keyboard-only upload (drag-and-drop has a keyboard-operable file chooser equivalent, GN-02); required fields marked and validated on blur/submit (GN-04); success message auto-dismisses, problems stay until resolved (GN-05).

## Out of Scope

- Live progress display on the dashboard and file details (UP-07) - file-dashboard-and-details.
- Correction screen and re-check (FC-01..FC-04), cancellation (FX-01..FX-06) - file-correction-and-cancellation.
- Configuring file kinds, collecting files from a shared folder, currencies other than ZAR and any currency conversion (brief "Not in scope").

## Notes & Caveats

- The front-end uses a mock layer until the .NET backend in `app-backend/` is live (project.md); the example file figures in R20 must hold in both.
- Duplicate detection is on file content (identical content), not file name.
