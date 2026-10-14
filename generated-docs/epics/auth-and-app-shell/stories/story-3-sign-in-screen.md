# Story 3: Sign-in screen

- **Epic:** auth-and-app-shell
- **Slug:** story-3-sign-in-screen
- **Roles:** Importer, Approver
- **Route:** /sign-in
- **Target file:** app-frontend/src/app/sign-in/page.tsx
- **Page action:** create_new
- **Is infrastructure only:** false
- **Requirement IDs:** R1, R2, R3, R4, R5, R96, R100, R101, BR1, BR2, NFR-1, NFR-2

## Plain summary

A person opens the sign-in screen, enters their email and password, and lands on Upload (Importer) or Transactions (Approver). Wrong details show "Invalid email or password". A connection problem gets its own message, and there is a note telling anyone who forgot their password to contact their administrator.

## Summary

Create /sign-in with email and password fields (required, checked on blur and on submit via the existing validation schemas in lib/validation/schemas.ts), the forgotten-password note, and error handling that tells a 401 ("Invalid email or password") apart from a network failure (connection-problem message). On success, route by role (Importer → /upload, Approver → /transactions). This story also lays the front-end plumbing: a Next.js rewrite in next.config.ts proxying /api/* to the .NET API (target from an env var) so the HTTP-only cookie is same-origin, and auth API functions on the existing lib/api client (cookies included). The MSW mock layer for login/me/logout is generated at BUILD B0.1 from the OpenAPI spec Story 1 produces.

## Acceptance criteria

- **AC-1** (coverage: vitest): The sign-in screen shows email and password fields marked as required, plus a note telling anyone who forgot their password to contact their administrator
- **AC-2** (coverage: vitest): A required field left empty shows a message when the person leaves it and again on submit, but not while they are typing
- **AC-3** (coverage: vitest): A wrong email or password shows "Invalid email or password" and the person stays on the sign-in screen
- **AC-4** (coverage: vitest): When the app cannot be reached, a connection-problem message appears that is clearly different from the wrong-details message
- **AC-5** (coverage: playwright): Signing in as an Importer lands on the Upload screen, and signing in as an Approver lands on the Transactions screen

## Manual test checklist

- Open the sign-in page → you see Email and Password marked as required and a note to contact your administrator if you forgot your password
- Click into Email, then click away without typing → a "required" message appears under Email
- Sign in as fileimporter@digiata.com with a wrong password → you see "Invalid email or password"
- Sign in as fileimporter@digiata.com / Test123 → you land on the Upload screen
- Sign in as approver@digiata.com / Test123 → you land on the Transactions screen
- With the back end stopped, try to sign in → you see a message saying the app can't be reached, not "Invalid email or password"
