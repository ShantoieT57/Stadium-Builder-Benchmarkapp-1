# Story 4: Signed-in app frame with role menu and sign-out

- **Epic:** auth-and-app-shell
- **Slug:** story-4-app-shell
- **Roles:** Importer, Approver
- **Route:** /dashboard
- **Target file:** app-frontend/src/app/(app)/layout.tsx
- **Page action:** create_new
- **Is infrastructure only:** false
- **Requirement IDs:** R9, R8, R90, R93, R94, R95, R102, BR1, NFR-3
- **Shared surface:** this story introduces the signed-in layout that every later screen renders inside. The per-epic baseline (cross-story role-gating, shared-shell nav) attaches here.

## Plain summary

Once signed in, every screen shows who is signed in and a menu with only the items that person's role allows. Importers see Dashboard, Transactions and Upload; Approvers see Dashboard and Transactions. A Sign Out button is always there. Signed-out visitors are always sent to sign-in, and the frame works on a phone.

## Summary

Create the (app) route group layout that checks the session via GET /api/auth/me and redirects to /sign-in when there is none. It renders the header with the signed-in person's name and role, the role-based nav per BR1 (disallowed items absent, not disabled), the sign-out action (POST /api/auth/logout, then /sign-in, with cache-safe handling so Back cannot reveal the page), and a responsive collapsible nav for phone widths with labelled icon-only buttons. Replace the template's public welcome at app/page.tsx with a redirect, and add placeholder Dashboard, Transactions and Upload screens for later epics to fill. The Playwright spec carries the epic's axe accessibility scan.

## Acceptance criteria

- **AC-1** (coverage: vitest): Every signed-in screen shows the name and role of the person who is signed in
- **AC-2** (coverage: vitest): An Importer's menu shows Dashboard, Transactions and Upload, and an Approver's menu shows Dashboard and Transactions only, with disallowed items absent rather than disabled
- **AC-3** (coverage: playwright): While signed out, any protected address, including the app root, sends the person to the sign-in screen instead of a welcome page
- **AC-4** (coverage: playwright): Clicking Sign Out returns the person to the sign-in screen
- **AC-5** (coverage: playwright): After signing out, pressing the browser Back button returns the person to sign-in instead of showing the previous screen
- **AC-6** (coverage: playwright): On a phone-width screen the menu opens from a labelled menu button, and every menu item and Sign Out can be reached with the keyboard alone

## Manual test checklist

- Open the app while signed out → you land on the sign-in page, not a welcome page
- While signed out, type /upload in the address bar → you're sent to sign-in
- Sign in as File Importer → your name shows at the top and the menu shows Dashboard, Transactions and Upload
- Sign in as Approver User → the menu shows Dashboard and Transactions, with no Upload item at all
- Click Sign Out → you're back on the sign-in page; press the browser Back button → you stay on sign-in
- Narrow the browser to phone width → the menu turns into a menu button, and pointing at it or tabbing to it shows its label
- Using only Tab and Enter, open the menu, move to Transactions, and sign out
