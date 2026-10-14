# Epic: File Dashboard and File Details

Inherits roles, auth, data source, compliance, and styling from project.md.

**Depends on:** `file-upload-and-processing` (files, statuses and processing history exist), `transactions-list` (the transactions list that counts link into).

## Goal

Both roles see every file with live status and counts, can filter and sort the list, and can open a file to see its summary and processing history, download the original, and jump to its transactions.

Both Importer and Approver have full access to everything in this epic (view dashboard, view file details, download original). The Importer-only actions on these screens (DB-08 correction link, FD-06 correction screen, FD-08 cancel) belong to `file-correction-and-cancellation` and are out of scope here.

## Data Model

Entities this epic reads (it creates none; files and transactions are produced by `file-upload-and-processing`).

**File**

| Field | Notes |
|---|---|
| Name | The uploaded file name, e.g. `transactions_2026-04-15.csv`. |
| Last processed on | Date and time the file was last processed. Drives the default sort and the process-date range filter. |
| Row count | Number of transaction rows in the file, not counting the header. |
| Status | One of **Uploaded**, **Processing**, **Completed**, **Failed**. |
| Failure kind | For a **Failed** file: duplicate, or invalid rows waiting for corrections. |
| Cancelled | Whether the file has been cancelled (cancelled files are hidden by default). |
| Rows loaded / skipped (reference already existed) / ignored (empty reference) | The three always add up to the row count (FP-07). |
| Imported / Approved / Rejected transaction counts | Per file. |
| Original file | The stored copy, exactly as uploaded. |

**Processing history entry**: stage (Receive, Duplicate check, Read rows, Convert types, Check rows, Wait for corrections, Load), started at, finished at.

**Dashboard totals**: file count per status; transaction count per status (**Imported**, **Approved**, **Rejected**) across all files that are not cancelled.

File statuses (from the brief):

| Status | Meaning |
|---|---|
| **Uploaded** | The app has received the file and has not started checking it. |
| **Processing** | The app is checking or loading the file. |
| **Completed** | The file's transactions are loaded and ready for approval. |
| **Failed** | The file is a duplicate, or it has invalid rows waiting for corrections. The file shows which. |

## Functional Requirements

Source rule IDs are given in brackets; the text is verbatim from the brief.

- **R1** [UP-07]: An upload only hands the file over. Checking and loading happen afterwards, and the importer follows them on the dashboard and the file's detail screen without having to refresh.
- **R2** [FS-03]: The status is always shown as words, never as a colour alone.
- **R3** [DB-01]: Above the list, the dashboard shows how many files are in each status, and how many transactions are **Imported**, **Approved**, and **Rejected** across all files that are not cancelled. Selecting a file count filters the list to that status. Selecting a transaction count opens the transactions list filtered to that status.
- **R4** [DB-02]: Each file shows its name, the date and time it was last processed, its number of rows, its status, and how many of its transactions are still **Imported**.
- **R5** [DB-03]: The file processed most recently appears first. The person can sort by any column, one at a time.
- **R6** [DB-04]: The list shows 20 files per page by default. The person can choose 5, 10, 20, or 50.
- **R7** [DB-05]: The person can filter by status, by file name, and by a range of process dates.
- **R8** [DB-06]: Cancelled files are hidden by default. The person can choose to see active files, cancelled files, or both.
- **R9** [DB-07]: Selecting a file opens its detail screen.
- **R10** [DB-09]: When there are no files, the dashboard says "No files yet". An importer also sees a link to upload one.
- **R11** [FD-01]: The summary shows the file's total rows, how they were handled (FP-07), and how many of its transactions are **Imported**, **Approved**, and **Rejected**.
- **R12** [FD-02]: Selecting any of those counts opens the transactions list filtered to that file and that status.
- **R13** [FD-03]: When none of the file's transactions is still **Imported**, the summary says the file is fully reviewed.
- **R14** [FD-04]: The processing history lists each stage the file has been through, with the time it started and finished.
- **R15** [FD-05]: Any signed-in person can download the original file exactly as it was uploaded.
- **R16** [FD-07]: A file still **Uploaded** or **Processing** says that its transactions are not available yet.

## Business Rules

- **BR1** [FP-07]: The file's summary shows how many rows were loaded, how many were skipped because their reference already existed, and how many were ignored because their reference was empty. The three always add up to the file's row count.
- **BR2** [DB-01]: Transaction totals on the dashboard cover only files that are not cancelled.
- **BR3** [DB-06 / DB-03]: The default view hides cancelled files and orders by most recently processed first.
- **BR4** [FS-03]: Every status label (dashboard list, status counts, file detail) is text; colour may reinforce but never carry the status alone.
- **BR5** [AC-01]: Importer-only elements (the upload link in the empty state) are hidden, not disabled, for approvers.

## Key Workflows

1. **Review the dashboard:** a signed-in person opens Dashboard, sees file counts per status and transaction counts per status above the file list, newest-processed file first.
2. **Narrow the list:** the person selects a status count (or uses the filters for status, file name and process-date range, and the active/cancelled/both choice), sorts by a column, and changes page size (5, 10, 20, 50).
3. **Jump to transactions:** the person selects an Imported, Approved or Rejected count on the dashboard and lands on the transactions list filtered to that status.
4. **Follow a new file:** after an upload, the importer watches the file move Uploaded, Processing, then Completed or Failed on the dashboard and detail screen without refreshing.
5. **Inspect a file:** the person selects a file, sees its summary (total rows, loaded/skipped/ignored, Imported/Approved/Rejected), reads the processing history, and downloads the original file.
6. **Drill into a file's transactions:** the person selects a count in the file summary and lands on the transactions list filtered to that file and status.
7. **Early-stage file:** for a file still Uploaded or Processing, the detail screen says its transactions are not available yet.
8. **Empty state:** with no files, the dashboard says "No files yet" (importer also sees an upload link).

## Feature NFRs

- **NFR-1:** Live progress (R1) updates the dashboard and file detail without a manual page refresh (polling or push is a BUILD decision; the mock layer must simulate the status progression).
- **NFR-2:** The file list is paginated and sorted server-side-compatibly (page size 5/10/20/50), so large file counts do not require loading everything.
- **NFR-3:** The dashboard and file list are usable on a narrow screen: rows show key details (name, status, rows, Imported remaining) and keep the open-file action available (GN-01).
- **NFR-4:** Download of the original returns the file byte-for-byte as uploaded.

## Out of Scope

- DB-08 (correction link from the list), FD-06 (failure reason and correction screen), FD-08 (cancel action), and all FC- and FX- rules: handled by `file-correction-and-cancellation`. (The failure kind is still displayed through the status per the file-status definitions, but the failure-reason panel and correction UI are not built here.)
- Uploading files and the processing pipeline itself (`file-upload-and-processing`).
- The transactions list, its filters and approve/reject/export actions (`transactions-list`); this epic only links into it with a status and/or file filter.

## Notes & Caveats

- Cancelled files: this epic provides the show/hide filter (R8); the act of cancelling is in the later epic. Until then there will be no cancelled files in real data, but the filter and the dashboard-totals exclusion must still behave correctly (mock data should include one).
- The backend does not exist yet; build against the mock layer per project.md, with endpoints and shapes proposed to match the eventual .NET API.
- Account numbers and file contents must not leak into logs or error messages (project.md §Compliance).
