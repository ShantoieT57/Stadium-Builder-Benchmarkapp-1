# Transaction Import and Approval App

An app for a bank operations team that receives a daily file of bank transactions. Importers bring the CSV files in, check them and correct them; approvers review every loaded transaction and approve or reject it (a rejection always carries a written reason). Source: `documentation/Transaction-Import-and-Approval-Brief.md` (rule IDs SI-, UP-, FP-, FS-, FC-, FX-, DB-, FD-, TS-, TL-, SF-, AP-, RJ-, EX-, AC-, GN-).

| Field | Value |
|---|---|
| Project slug | `transaction-import-and-approval` |
| Created | 2026-10-14 |
| Intake source | docs |
| Backend connectivity | deferred |

---

## Roles & Permissions

**Template:** `internal-tool` (structure) with brief-defined roles: **Importer** and **Approver**. The template's Admin/User tiers are NOT used; the matrix below is mapped from the brief's "Who uses the app", "Menu and access" and per-feature rules (AC-01..AC-03).

| Permission | Importer | Approver |
|---|---|---|
| View main dashboard (file list and counts) | ✓ | ✓ |
| View file details and processing history | ✓ | ✓ |
| Download original uploaded file | ✓ | ✓ |
| View transactions list, search and filter | ✓ | ✓ |
| Open a transaction's details | ✓ | ✓ |
| Upload files | ✓ | |
| Correct invalid rows and re-check a file | ✓ | |
| Cancel a file | ✓ | |
| Approve a transaction | | ✓ |
| Reject a transaction (with reason) | | ✓ |
| Export transactions (CSV) | | ✓ |
| See Imported-count badge on Transactions menu | | ✓ |

Menu: Dashboard (both), Transactions (Importer view-only, Approver full), Upload (Importer only). Landing page after sign-in: Importer -> Upload screen, Approver -> Transactions screen (SI-05).

Seeded users (both password `Test123`):

| Name | Email | Role |
|---|---|---|
| File Importer | `fileimporter@digiata.com` | Importer |
| Approver User | `approver@digiata.com` | Approver |

> Hidden, not disabled, when a role does not allow an action (AC-01). Denied screens show a no-access message saying who to ask (AC-02). The backend MUST enforce every role rule itself (AC-03, TS-04). Permissions extend during BUILD as new stories surface new actions — see [agent-autonomy.md](.claude/shared/agent-autonomy.md). Additions land here via a project-change PR (§6.1 of the epic-branch plan). Permission removals or role-set changes halt for user review.

---

## Authentication

| Field | Value |
|---|---|
| Method | `bff` |
| BFF login endpoint (if BFF) | `POST /api/auth/login` |
| BFF userinfo endpoint (if BFF) | `GET /api/auth/me` |
| BFF logout endpoint (if BFF) | `POST /api/auth/logout` |
| Custom auth notes (if custom) | n/a |

Notes:
- Endpoints were proposed by us and accepted by the user; the backend does not exist yet and will be built in `app-backend/` (.NET).
- Credentials are email + password verified by our own backend (not an external OIDC provider). Session is an HTTP-only cookie.
- Session rules from the brief: idle timeout 60 minutes with activity resetting it (SI-06); single active session per person, a new sign-in invalidates the previous one (SI-07); sign-out ends the sign-in on every device (SI-08); signed-in user always visible (SI-09).
- Sign-in messages (verbatim): "Invalid email or password" (never says which was wrong, SI-02); a distinct connection-problem message when the app cannot be reached (SI-03); the sign-in screen tells a forgotten-password user to contact their administrator (SI-04).
- Out of scope: password reset, account lockout, two-step sign-in.

> Auth method is never inferred — the user must confirm explicitly per [authentication-intake.md](.claude/policies/authentication-intake.md).

---

## Data Source & Backend Integration

| Field | Value |
|---|---|
| Data source | `api-in-development` |
| Backend status | `in-development` |
| Mock layer required | yes |

The user stated no backend is available and it must be developed as part of this project. The front-end uses a mock layer until the .NET backend in `app-backend/` is live. Backend responsibilities include: storage of the original upload, asynchronous processing pipeline (receive, duplicate check, read rows, convert types, check rows, wait for corrections, load), processing history, transaction state machine, export, auth/session. The front-end must show file progress without manual refresh (UP-07).

### Backend connectivity (when applicable)

| Aspect | Value |
|---|---|
| Base URL | not yet defined (backend not built) |
| Auth scheme | cookie (HTTP-only session) |
| Auth header | n/a (cookie) |
| Auth value format | n/a |
| Credential env vars | none yet |
| Smoke-test endpoint | `GET /api/auth/me` (proposed; does not exist yet) |
| Smoke-test mode | full |
| Smoke-test status | null-deferred |
| Smoke-test verified at | null |
| Smoke-test notes | Deferred: no spec exists and `app-backend/` is currently a .NET hosted-service shell (Twenty57.Builder.ApplicationRuntime Runner), not an HTTP API; no endpoints exist yet. |
| CORS / proxy notes | Not yet known; cookie session implies same-origin via a Next.js rewrite proxy to the .NET API. |

### API specs

| Path | Source |
|---|---|
| none yet | To be generated alongside the backend |

---

## Compliance

**Applicable domains:** `popia` `[INFERRED — not confirmed by the user; confirm at INTAKE approval]`
**Region (if Personal data applies):** `ZA` (inferred from ZAR currency and the bank context)

### Compliance Requirements

- `[INFERRED]` Personal data (user emails, account numbers, transaction descriptions) is encrypted at rest and in transit (POPIA)
- `[INFERRED]` Personal data processing has a clear purpose; data minimisation applied to exports and logs (POPIA)
- `[INFERRED]` Account numbers and credentials MUST NOT appear in error messages or logs; passwords stored only as salted hashes
- `[INFERRED]` Uploaded files: `.csv` type and file-name validation (UP-03, UP-04), storage encryption, and a retention rule (cancelled files' stored copies are discarded, FX-04)
- `[INFERRED]` Audit trail: who uploaded, approved, rejected, cancelled and when is recorded (AP-03, RJ-04, FP-08); approved/rejected transactions are immutable (TS-03)

---

## Styling & Branding

| Field | Value |
|---|---|
| Primary brand color | `#2563eb` |
| Accent / secondary | `#f1f5f9` |
| Background (light) | `#ffffff` |
| Background (dark, if applicable) | n/a |
| Font family (headings) | system stack |
| Font family (body) | system stack |
| Theme | light only |
| Source | defaulted |

> No design, palette, fonts or logo exist (design-interpreter verdict: not-a-design). `[DEFAULT]` neutral light theme per [styling-centralisation.md](.claude/policies/styling-centralisation.md). Status must be shown as words, never colour alone (FS-03). Component-specific styling emerges during BUILD.

---

## Baseline NFRs

- **NFR-base-1:** Accessibility — WCAG 2.1 Level AA baseline
- **NFR-base-2:** Performance — First Contentful Paint < 2.5s on a mid-tier mobile network
- **NFR-base-3:** Responsive design — mobile (≥360px) / tablet (≥768px) / desktop (≥1280px) breakpoints
- **NFR-base-4:** Browser support — latest two versions of Chrome / Edge / Firefox / Safari
- **NFR-base-5:** Error UX — user-visible error states with retry affordance for all async operations
- **NFR-base-6:** Keyboard-only operability for every action; icon-only buttons have tooltip/focus labels (GN-02, GN-03)
- **NFR-base-7:** Form validation on blur and on submit, not per keystroke; required fields marked (GN-04)
- **NFR-base-8:** Success messages auto-dismiss after a few seconds; problems stay until resolved (GN-05)
- **NFR-base-9:** Mobile layouts show key row details and keep actions available (GN-01)
