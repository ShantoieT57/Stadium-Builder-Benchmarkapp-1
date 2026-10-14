# Story 2: Back-end session rules and role enforcement

- **Epic:** auth-and-app-shell
- **Slug:** story-2-backend-session-rules
- **Roles:** Importer, Approver
- **Route:** null
- **Target file:** app-backend/StadiumBuilderBenchmarkapp1/Services/TransactionImportApi/Service.cs
- **Page action:** modify_existing
- **Is infrastructure only:** true
- **Requirement IDs:** R6, R7, R8, R92, BR3, BR5
- **Delivery:** via the mandatory `backend-workflow` sub-agent, as a separate cycle after Story 1.

## Plain summary

The back end signs people out after 60 minutes with no activity. A new sign-in replaces any earlier one, signing out ends the sign-in everywhere, and the back end refuses actions a person's role does not allow.

## Summary

Extend the session store with a last-activity time. Refuse (401) any session idle for more than 60 minutes, and slide the window on each authenticated request. Use an injectable TimeProvider so Gherkin scenarios can advance time. Keep one active session per user: login invalidates earlier sessions, and logout invalidates all of that user's sessions. Add the reusable role-authorisation mechanism (Importer-only / Approver-only policies returning 403) that later epics attach to their endpoints; prove it with a minimal guarded endpoint per the backend-workflow's rules.

## Resolved design choices

- **Idle activity definition:** only requests that reach the back end restart the 60-minute window (user decision at stories approval).

## Acceptance criteria

- **AC-1** (coverage: none, backend Gherkin): A session with no activity for more than 60 minutes is refused as not signed in, and any request before then restarts the 60 minutes
- **AC-2** (coverage: none, backend Gherkin): Signing in again elsewhere makes the person's earlier session stop working
- **AC-3** (coverage: none, backend Gherkin): Signing out ends every session that person has
- **AC-4** (coverage: none, backend Gherkin): A signed-in person calling something their role does not allow is refused by the back end, whatever the screen shows

## Manual test checklist

_None (infrastructure only). Verified through Story 5's checks and the CLAUDE.backend.md manual-test gate._
