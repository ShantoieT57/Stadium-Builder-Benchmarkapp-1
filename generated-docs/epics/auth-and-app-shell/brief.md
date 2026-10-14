# Epic: Sign-in and App Shell

Inherits roles, auth, data source, compliance, and styling from project.md.

## Goal

Importers and approvers can sign in, land on their role's screen, see who is signed in, see only their role's menu, and are signed out after an hour idle or when they sign in elsewhere. This epic also stands up the backend (replace the .NET hosted-service shell in `app-backend/` with an HTTP API host, database, seeded users, same-origin proxy, front-end mock layer) and the shared building blocks every later screen uses (no-access page, messages, form checks, phone layout).

Dependencies: none (first epic).

Agreed auth endpoints: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.

## Data Model

- **User**: id, name, email (unique), password (stored only as a salted hash), role (`Importer` | `Approver`).
- **Session**: one active session per user; records last-activity time (for the 60-minute idle timeout); a new sign-in invalidates the previous session; carried by an HTTP-only cookie.
- **Seeded users** (password `Test123` for both):

| Name | Email | Role |
|---|---|---|
| File Importer | `fileimporter@digiata.com` | Importer |
| Approver User | `approver@digiata.com` | Approver |

## Functional Requirements

- **R1 (SI-01):** A person signs in with their email address and password. Both are required.
- **R2 (SI-02):** If the email or the password is wrong, the app says "Invalid email or password". It never says which of the two was wrong.
- **R3 (SI-03):** If the app cannot be reached, the message says so, so the person can tell a connection problem from a wrong password.
- **R4 (SI-04):** The sign-in screen tells a person who has forgotten their password to contact their administrator.
- **R5 (SI-05):** After signing in, an importer lands on the Upload screen and an approver lands on the Transactions screen.
- **R6 (SI-06):** A person who has done nothing in the app for 60 minutes is signed out and returned to the sign-in screen. Any activity resets the 60 minutes.
- **R7 (SI-07):** A person can be signed in in one place at a time. Signing in on a second device or browser signs them out of the first.
- **R8 (SI-08):** A person can sign out at any time. Signing out ends their sign-in on every device.
- **R9 (SI-09):** The app always shows who is signed in.
- **R10:** Two ready-to-use people set up: fileimporter@digiata.com (Importer) and approver@digiata.com (Approver), both password Test123.
- **R90 (AC-01):** A person never sees a menu item, button, or action their role does not allow. The app hides it rather than showing it disabled.
- **R91 (AC-02):** If a person reaches a screen their role does not allow, for example through a saved link, the app tells them they do not have access and who to ask.
- **R92 (AC-03):** The app enforces every role rule itself, not only by hiding things on screen.
- **R93 (GN-01):** The app works on a phone as well as on a desktop. On a narrow screen, lists show the key details of each row and keep its actions available.
- **R94 (GN-02):** Every action can be done with the keyboard alone.
- **R95 (GN-03):** Every icon-only button has a label that appears when the person points at it or moves to it with the keyboard.
- **R96 (GN-04):** Required fields on a form are marked. The app checks a field when the person leaves it and again when they submit, not on every keystroke.
- **R97 (GN-05):** Success messages disappear on their own after a few seconds. Problems that need attention stay on screen until resolved.

(R90-R97 keep their source numbering from the epic plan; the brief's other epics number locally. Local R-numbers within this brief are R1-R10 and R90-R97.)

Infrastructure requirements delivered by this epic (from the epic goal):

- **R98:** Replace the .NET hosted-service shell in `app-backend/` with an HTTP API host backed by a database, exposing `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- **R99:** Seed the two users above on first run.
- **R100:** Same-origin proxy (Next.js rewrite) from the front-end to the .NET API so the HTTP-only session cookie works.
- **R101:** Front-end mock layer for the auth endpoints, used until the backend is live.
- **R102:** Shared building blocks reused by later screens: no-access page, success/problem message component, form field checks, phone-friendly layout and navigation shell with role-based menu.

## Business Rules

- **BR1:** Role-based menu: Dashboard (Importer, Approver), Transactions (Importer view only, Approver full), Upload (Importer only). Landing after sign-in: Importer -> Upload, Approver -> Transactions.
- **BR2:** Sign-in failures never reveal whether the email or the password was wrong ("Invalid email or password").
- **BR3:** Idle timeout is 60 minutes; any activity resets it. Single active session per person; the newest sign-in wins. Sign-out ends the sign-in on every device.
- **BR4:** Passwords are stored only as salted hashes; credentials and account numbers never appear in logs or error messages.
- **BR5:** Every role rule is enforced by the backend, not only by hiding UI.
- **BR6:** Out of scope in the brief: password reset, account lockout, two-step sign-in.

## Key Workflows

1. Sign in: person opens the app, enters email and password (both required, checked on blur and submit), submits; on success lands on Upload (Importer) or Transactions (Approver) with their identity shown; on a wrong credential sees "Invalid email or password"; if the app cannot be reached sees a connection-problem message; sees the contact-your-administrator note for forgotten passwords.
2. Idle timeout: person does nothing for 60 minutes, next interaction returns them to the sign-in screen; activity before then resets the timer.
3. Second sign-in elsewhere: signing in on another device/browser invalidates the first session, which is returned to sign-in on its next request.
4. Sign out: person signs out; the sign-in ends on every device.
5. Role-restricted access: a person opens a saved link to a screen their role does not allow and sees a no-access message saying who to ask; the backend also refuses the request.

## Feature NFRs

- **NFR-1:** Session carried by an HTTP-only cookie via same-origin proxy; no tokens in browser-readable storage.
- **NFR-2:** Auth endpoints respond with a clear distinction between wrong credentials (401) and unreachable (client-side connection error).
- **NFR-3:** Shell works at mobile (360px), tablet and desktop breakpoints; keyboard-only operable (project NFR-base-3, -6, -7, -8, -9 apply).

## Out of Scope

- Password reset, account lockout, two-step sign-in.
- File upload, dashboard, transactions list, approve/reject/export (later epics; this epic only provides the shell and role-based menu entries/landing routes).

## Notes & Caveats

- `app-backend/` is currently a .NET hosted-service shell (Twenty57.Builder.ApplicationRuntime Runner), not an HTTP API; it must be converted.
- No design exists; styling defaults come from project.md (light theme, `#2563eb`). Status shown as words, never colour alone (FS-03) for later epics.
- The smoke test for `GET /api/auth/me` was deferred in project.md; verify once the backend is live.
- **Decision (stories approval, 2026-10-14). What counts as "activity" for SI-06:** only actions that reach the app (a request to the back end, such as loading a screen, saving or approving) restart the 60-minute window. Mouse and keyboard input alone does not. The browser also runs a 60-minute timer and returns the person to sign-in at the hour without a click. The back end is the authority and answers an expired session with 401.
