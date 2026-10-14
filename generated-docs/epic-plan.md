# Epic Plan — Transaction Import and Approval

Every epic in this project, what it delivers, and what it builds on. Live status
(not started / in flight / done) is shown by `/status` and the dashboard.

> Plan only — edited during planning on `main`, never on an epic branch.

## Epics

| # | Epic | Delivers | Builds on |
|---|---|---|---|
| 1 | Sign-in and App Shell (`auth-and-app-shell`) | Importers and approvers sign in, land on their role's screen, see only their role's menu, and are signed out after an hour idle or on signing in elsewhere; stands up the backend API, database, seeded users, mock layer and shared screen building blocks | — |
| 2 | File Upload and Processing (`file-upload-and-processing`) | An importer uploads the daily file; the app checks it, rejects duplicates, flags invalid rows with every reason, and loads valid files as Imported transactions | Sign-in and App Shell (`auth-and-app-shell`) |
| 3 | Transactions List and Search (`transactions-list`) | Both roles browse, sort, page, search and filter transactions and open one for full details; importers never see approval or export actions | File Upload and Processing (`file-upload-and-processing`) |
| 4 | File Dashboard and File Details (`file-dashboard-and-details`) | Every file with live status and counts, filters and sorting, file summary, processing history, original-file download and links into its transactions | File Upload and Processing (`file-upload-and-processing`), Transactions List and Search (`transactions-list`) |
| 5 | Correcting and Cancelling Files (`file-correction-and-cancellation`) | An importer fixes invalid rows and re-checks a failed file, or cancels it; cancelling removes its transactions and stored copy, and is refused once any transaction is Approved | File Dashboard and File Details (`file-dashboard-and-details`) |
| 6 | Approving and Rejecting Transactions (`transaction-review`) | Approvers approve or reject Imported transactions with confirmation and a required reason; decisions are final and recorded; menu shows how many are waiting | Transactions List and Search (`transactions-list`) |
| 7 | Exporting Transactions (`transaction-export`) | Approvers export exactly the filtered transactions to a spreadsheet-friendly CSV named by date and filters | Transactions List and Search (`transactions-list`) |

## Coverage

Everything in the spec is assigned to an epic:

| What you asked for | Epic |
|---|---|
| Sign in with email and password, both required (R1 · SI-01) | Sign-in and App Shell (`auth-and-app-shell`) |
| Wrong credentials show "Invalid email or password" (R2 · SI-02) | Sign-in and App Shell (`auth-and-app-shell`) |
| Connection problem shown distinctly from wrong password (R3 · SI-03) | Sign-in and App Shell (`auth-and-app-shell`) |
| Forgotten password points to administrator (R4 · SI-04) | Sign-in and App Shell (`auth-and-app-shell`) |
| Role-based landing page after sign-in (R5 · SI-05) | Sign-in and App Shell (`auth-and-app-shell`) |
| 60-minute idle sign-out (R6 · SI-06) | Sign-in and App Shell (`auth-and-app-shell`) |
| One active sign-in per person (R7 · SI-07) | Sign-in and App Shell (`auth-and-app-shell`) |
| Sign out ends sign-in on every device (R8 · SI-08) | Sign-in and App Shell (`auth-and-app-shell`) |
| Signed-in person always shown (R9 · SI-09) | Sign-in and App Shell (`auth-and-app-shell`) |
| Two ready-to-use people set up (R10) | Sign-in and App Shell (`auth-and-app-shell`) |
| Drag-and-drop or choose a file to upload (R11 · UP-01) | File Upload and Processing (`file-upload-and-processing`) |
| File kind "Bank transactions" preselected (R12 · UP-02) | File Upload and Processing (`file-upload-and-processing`) |
| Only .csv files accepted, with explanatory message (R13 · UP-03) | File Upload and Processing (`file-upload-and-processing`) |
| File name rules, "Invalid file name" (R14 · UP-04) | File Upload and Processing (`file-upload-and-processing`) |
| Upload progress and success confirmation (R15 · UP-05) | File Upload and Processing (`file-upload-and-processing`) |
| Failed upload can be retried (R16 · UP-06) | File Upload and Processing (`file-upload-and-processing`) |
| Follow processing live without refreshing (R17 · UP-07) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Seven processing stages run in order, each recorded (R18) | File Upload and Processing (`file-upload-and-processing`) |
| Duplicate-file definition (R19 · FP-01) | File Upload and Processing (`file-upload-and-processing`) |
| Duplicate failure names the earlier file (R20 · FP-02) | File Upload and Processing (`file-upload-and-processing`) |
| Row is invalid when it breaks any row rule (R21 · FP-03) | File Upload and Processing (`file-upload-and-processing`) |
| Every failure reason reported per row (R22 · FP-04) | File Upload and Processing (`file-upload-and-processing`) |
| References unique app-wide; existing ones skipped (R23 · FP-05) | File Upload and Processing (`file-upload-and-processing`) |
| All-or-nothing file loading (R24 · FP-06) | File Upload and Processing (`file-upload-and-processing`) |
| Loaded / skipped / ignored counts add up (R25 · FP-07) | File Upload and Processing (`file-upload-and-processing`) |
| "System" recorded as creator of loaded transactions (R26 · FP-08) | File Upload and Processing (`file-upload-and-processing`) |
| Row rules and their reasons (R27) | File Upload and Processing (`file-upload-and-processing`) |
| Supplied example file imports as-is with expected result (R28) | File Upload and Processing (`file-upload-and-processing`) |
| Duplicate-failed file stays failed (R29 · FS-01) | File Upload and Processing (`file-upload-and-processing`) |
| Invalid-row failure can be corrected and re-checked (R30 · FS-02) | File Upload and Processing (`file-upload-and-processing`) |
| Status always shown in words (R31 · FS-03) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Correction screen lists only invalid rows with reasons (R32 · FC-01) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Edit invalid rows and re-check (R33 · FC-02) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Re-check repeats stages 4–7 (R34 · FC-03) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Uncorrectable file can be cancelled (R35 · FC-04) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Cancel confirmation names the file; keep is default (R36 · FX-01) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Cannot cancel a file with an Approved transaction (R37 · FX-02) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Cancelling removes the file's transactions everywhere (R38 · FX-03) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Cancelling discards the stored original (R39 · FX-04) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Cancelled files hidden from dashboard unless chosen (R40 · FX-05) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Cancelling an already-cancelled file does nothing (R41 · FX-06) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Dashboard counts by status, clickable (R42 · DB-01) | File Dashboard and File Details (`file-dashboard-and-details`) |
| File row columns (R43 · DB-02) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Most recent first; sort by any column (R44 · DB-03) | File Dashboard and File Details (`file-dashboard-and-details`) |
| 20 files per page; 5/10/20/50 (R45 · DB-04) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Filter files by status, name, process dates (R46 · DB-05) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Show active, cancelled, or both (R47 · DB-06) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Selecting a file opens its details (R48 · DB-07) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Importer shortcut to correction screen from list (R49 · DB-08) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| "No files yet" empty state (R50 · DB-09) | File Dashboard and File Details (`file-dashboard-and-details`) |
| File summary counts (R51 · FD-01) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Summary counts open filtered transactions list (R52 · FD-02) | File Dashboard and File Details (`file-dashboard-and-details`) |
| "Fully reviewed" when nothing still Imported (R53 · FD-03) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Processing history with stage times (R54 · FD-04) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Download original file exactly as uploaded (R55 · FD-05) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Failed file shows reason; importer sees correction screen (R56 · FD-06) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Uploaded/Processing file says transactions not available yet (R57 · FD-07) | File Dashboard and File Details (`file-dashboard-and-details`) |
| Importer-only cancel action on file details (R58 · FD-08) | Correcting and Cancelling Files (`file-correction-and-cancellation`) |
| Loaded transactions start as Imported (R59 · TS-01) | File Upload and Processing (`file-upload-and-processing`) |
| Only Imported transactions can be approved or rejected (R60 · TS-02) | Approving and Rejecting Transactions (`transaction-review`) |
| Approved and Rejected are final (R61 · TS-03) | Approving and Rejecting Transactions (`transaction-review`) |
| App itself enforces final statuses (R62 · TS-04) | Approving and Rejecting Transactions (`transaction-review`) |
| Transaction list columns (R63 · TL-01) | Transactions List and Search (`transactions-list`) |
| Newest first; sort kept across pages (R64 · TL-02) | Transactions List and Search (`transactions-list`) |
| 20 transactions per page; 5/10/20/50 (R65 · TL-03) | Transactions List and Search (`transactions-list`) |
| Approve/Reject only on Imported, for approvers (R66 · TL-04) | Approving and Rejecting Transactions (`transaction-review`) |
| Importer never sees Approve, Reject, or Export (R67 · TL-05) | Transactions List and Search (`transactions-list`) |
| Transaction details; rejection reason read-only (R68 · TL-06) | Transactions List and Search (`transactions-list`) |
| Approver menu badge, 99+ cap, hidden at zero (R69 · TL-07) | Approving and Rejecting Transactions (`transaction-review`) |
| "No transactions yet" empty state (R70 · TL-08) | Transactions List and Search (`transactions-list`) |
| Filter by status, file, dates, amounts, text (R71 · SF-01) | Transactions List and Search (`transactions-list`) |
| Filters combine (R72 · SF-02) | Transactions List and Search (`transactions-list`) |
| Active filters shown; one action clears all (R73 · SF-03) | Transactions List and Search (`transactions-list`) |
| No-match state shows filters and offers to clear (R74 · SF-04) | Transactions List and Search (`transactions-list`) |
| Approve confirmation names the reference (R75 · AP-01) | Approving and Rejecting Transactions (`transaction-review`) |
| Approval updates list immediately with message (R76 · AP-02) | Approving and Rejecting Transactions (`transaction-review`) |
| Record who approved and when (R77 · AP-03) | Approving and Rejecting Transactions (`transaction-review`) |
| Approving an already-decided transaction is refused (R78 · AP-04) | Approving and Rejecting Transactions (`transaction-review`) |
| Reject requires a reason (R79 · RJ-01) | Approving and Rejecting Transactions (`transaction-review`) |
| Reason up to 500 characters with remaining count (R80 · RJ-02) | Approving and Rejecting Transactions (`transaction-review`) |
| Rejection stores reason, updates list, confirms (R81 · RJ-03) | Approving and Rejecting Transactions (`transaction-review`) |
| Record who rejected and when (R82 · RJ-04) | Approving and Rejecting Transactions (`transaction-review`) |
| Rejecting an already-decided transaction is refused (R83 · RJ-05) | Approving and Rejecting Transactions (`transaction-review`) |
| Export exactly the filtered transactions (R84 · EX-01) | Exporting Transactions (`transaction-export`) |
| No filters exports everything (R85 · EX-02) | Exporting Transactions (`transaction-export`) |
| Export columns (R86 · EX-03) | Exporting Transactions (`transaction-export`) |
| Export file name has date and filters (R87 · EX-04) | Exporting Transactions (`transaction-export`) |
| Export unavailable when nothing matches (R88 · EX-05) | Exporting Transactions (`transaction-export`) |
| Export opens cleanly in a spreadsheet (R89 · EX-06) | Exporting Transactions (`transaction-export`) |
| Disallowed items hidden, not disabled (R90 · AC-01) | Sign-in and App Shell (`auth-and-app-shell`) |
| No-access message on a disallowed screen (R91 · AC-02) | Sign-in and App Shell (`auth-and-app-shell`) |
| App itself enforces every role rule (R92 · AC-03) | Sign-in and App Shell (`auth-and-app-shell`) |
| Works on phone and desktop (R93 · GN-01) | Sign-in and App Shell (`auth-and-app-shell`) |
| Every action keyboard-operable (R94 · GN-02) | Sign-in and App Shell (`auth-and-app-shell`) |
| Icon-only buttons show a label (R95 · GN-03) | Sign-in and App Shell (`auth-and-app-shell`) |
| Required fields marked; checked on leave and submit (R96 · GN-04) | Sign-in and App Shell (`auth-and-app-shell`) |
| Success messages auto-dismiss; problems stay (R97 · GN-05) | Sign-in and App Shell (`auth-and-app-shell`) |

_97 requirements, all assigned. Cross-cutting rules (AC-, GN-) are built as shared pieces in epic 1 and must be honoured by every later epic on its own screens._
