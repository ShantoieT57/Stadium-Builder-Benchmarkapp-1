# Approving and Rejecting Transactions

Inherits roles, auth, data source, compliance, and styling from project.md.

Depends on: `transactions-list` (the transactions list, its row display, and the transaction detail view are delivered there; this epic adds the approver actions and the menu badge on top).

## Goal

Approvers approve or reject each Imported transaction, with confirmation and a required reason for rejections. Decisions are final and recorded with who and when, and the menu shows how many transactions are still waiting.

## Data Model

Entity: **Transaction** (introduced by an earlier epic; this epic changes its review fields).

| Field | Role in this epic |
|---|---|
| Status | **Imported**, **Approved**, or **Rejected**. Moves only Imported -> Approved or Imported -> Rejected. |
| Rejection reason | The approver's reason. Present only on a rejected transaction. Required, up to 500 characters. Not editable once stored. |
| Last changed by | The person who last changed the transaction ("System" when loaded). Set to the approver on approve/reject (AP-03, RJ-04). |
| Last changed on | Date and time of that change. Set on approve/reject. |
| Reference | Shown in the approval confirmation (AP-01). |

State machine:

```
Imported ──approve──▶ Approved
    │
    └──reject + reason──▶ Rejected
```

## Functional Requirements

- **R1 (TS-02):** Only an **Imported** transaction can be approved or rejected.
- **R2 (TS-03):** **Approved** and **Rejected** are final. Nothing can change a transaction once it reaches either.
- **R3 (TS-04):** The app enforces TS-02 and TS-03 itself. Hiding the buttons is not enough: no route through the app may change a final transaction.
- **R4 (TL-04):** An approver sees **Approve** and **Reject** on every **Imported** transaction, and on no other.
- **R5 (TL-07):** For approvers, the Transactions menu item shows how many transactions are still **Imported**. It shows the exact number up to 99, then "99+", and nothing when the number is zero.
- **R6 (AP-01):** Before approving, the app asks for confirmation and names the transaction's reference. Cancelling is the default choice.
- **R7 (AP-02):** On confirmation, the status becomes **Approved** and the list updates straight away. A short message confirms the approval.
- **R8 (AP-03):** The app records who approved the transaction and when.
- **R9 (AP-04):** If someone else approved or rejected the transaction first, the app does not change it. It tells the approver and shows the transaction's current status.
- **R10 (RJ-01):** Rejecting asks for a reason. The reason is required, and the app does not let the approver submit until they have entered one.
- **R11 (RJ-02):** The reason can be up to 500 characters. The app shows how many characters remain.
- **R12 (RJ-03):** On submission, the status becomes **Rejected**, the reason is stored with the transaction, and the list updates straight away. A short message confirms the rejection.
- **R13 (RJ-04):** The app records who rejected the transaction and when.
- **R14 (RJ-05):** If someone else approved or rejected the transaction first, the app does not change it. It tells the approver and shows the transaction's current status.

## Business Rules

- **BR1:** Only approvers approve or reject (Importers never see Approve or Reject, TL-05; AC-01 hidden not disabled; AC-03 enforced by the backend).
- **BR2:** Valid transitions are only Imported -> Approved and Imported -> Rejected; every other transition is refused by the backend (R1-R3).
- **BR3:** A rejection always carries a non-empty reason of at most 500 characters.
- **BR4:** Concurrent decisions: the first decision wins; a later attempt on an already-decided transaction changes nothing and reports the current status (R9, R14).
- **BR5:** A rejected transaction's reason cannot be edited (TL-06).
- **BR6:** The Imported count badge counts transactions with status Imported; transactions of cancelled files are removed from the app and so are not counted (FX-03).

## Key Workflows

Approve:
1. Approver views the transactions list; Approve and Reject appear on Imported rows only.
2. Approver selects Approve; a confirmation names the transaction's reference, with Cancel as the default choice.
3. On confirming, the status becomes Approved, the list updates immediately, a short confirmation message shows, and approver and time are recorded.
4. If someone else decided first, nothing changes; the approver is told and sees the current status.

Reject:
1. Approver selects Reject on an Imported transaction.
2. A reason field is shown with the remaining-character count (500 maximum); submit is blocked until a reason is entered.
3. On submission, the status becomes Rejected, the reason is stored, the list updates immediately, a short confirmation message shows, and approver and time are recorded.
4. If someone else decided first, nothing changes; the approver is told and sees the current status.

Menu badge:
1. For an approver, the Transactions menu item shows the Imported count (exact to 99, "99+" above, nothing at zero), updating as decisions are made.

## Feature NFRs

- **NFR-1:** Decisions are atomic and race-safe on the backend so that two approvers deciding at once cannot both succeed (R9, R14).
- **NFR-2:** The approve/reject confirmation and reason dialogs are fully keyboard-operable, and icon-only buttons carry labels (GN-02, GN-03).
- **NFR-3:** The reason field is validated on blur and on submit, not per keystroke, and is marked required (GN-04).
- **NFR-4:** Success messages auto-dismiss after a few seconds; the "already decided" notice stays until resolved (GN-05).
- **NFR-5:** On narrow screens, Approve and Reject remain available on each row (GN-01).
- **NFR-6:** Status is shown as words, never colour alone (FS-03).

## Out of Scope

- Exporting transactions (EX-) and searching/filtering (SF-), delivered in other epics.
- Undoing or editing a decision; decisions are final.
- Bulk approve/reject.

## Notes & Caveats

- The backend does not exist yet; the front-end uses the mock layer until the .NET backend is live. The mock must also enforce R1-R3 and the first-decision-wins rule so the "already decided" paths can be exercised.
- Approver identity and time for R8 and R13 come from the session, never from client-supplied values.
- Exact user-facing strings: "99+" for the badge overflow. Other messages (confirmation, already-decided notice) are not fixed verbatim by the brief; wording is chosen during BUILD.
