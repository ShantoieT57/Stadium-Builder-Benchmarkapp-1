# Story 1: Back-end sign-in service with the two ready-to-use people

- **Epic:** auth-and-app-shell
- **Slug:** story-1-backend-sign-in-service
- **Roles:** Importer, Approver
- **Route:** null
- **Target file:** app-backend/StadiumBuilderBenchmarkapp1/Services/TransactionImportApi/Service.cs
- **Page action:** create_new
- **Is infrastructure only:** true
- **Requirement IDs:** R98, R99, R10, R1, R2, BR2, BR4, NFR-1, NFR-2
- **Delivery:** via the mandatory `backend-workflow` sub-agent (CLAUDE.backend.md): OpenAPI spec first, then one Gherkin feature per endpoint group, Red → Green → Refactor, then the CLAUDE.backend.md manual-test & commit gate.

## Plain summary

The app now has a real back end. The two ready-to-use people (File Importer and Approver User, password Test123) can sign in, the app can tell who is signed in, and they can sign out.

## Summary

Replace the hosted-service shell in app-backend/ with one REST host service (suggested C# name `TransactionImportApi`, which later epics extend) backed by a database. Implement POST /api/auth/login (email + password, sets an HTTP-only session cookie, returns name/email/role), GET /api/auth/me (401 without a valid session) and POST /api/auth/logout. Seed the two users with salted-hash passwords via a one-shot startup class outside Services/ (e.g. Database\), called from Application.StartAsync. Role values are exactly `Importer` and `Approver`.

## Acceptance criteria

- **AC-1** (coverage: none, backend Gherkin): Signing in with a seeded person's correct email and password succeeds, returns their name, email and role, and sets an HTTP-only session cookie
- **AC-2** (coverage: none, backend Gherkin): A wrong email or a wrong password gets the same "Invalid email or password" refusal, and a missing email or password is refused, without saying which field was wrong
- **AC-3** (coverage: none, backend Gherkin): Asking who is signed in returns the person's name, email and role with a valid session, and is refused without one
- **AC-4** (coverage: none, backend Gherkin): After signing out, the session cookie no longer works
- **AC-5** (coverage: none, backend Gherkin): Both seeded people exist on first run with password Test123, passwords are stored only as salted hashes, and credentials never appear in logs or error messages

## Manual test checklist

_None (infrastructure only). Verified through Story 3's checks and the CLAUDE.backend.md manual-test gate._
