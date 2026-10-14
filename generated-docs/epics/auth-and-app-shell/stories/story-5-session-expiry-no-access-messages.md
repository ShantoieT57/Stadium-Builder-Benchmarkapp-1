# Story 5: Session timeout, no-access screen and on-screen messages

- **Epic:** auth-and-app-shell
- **Slug:** story-5-session-expiry-no-access-messages
- **Roles:** Importer, Approver
- **Route:** /upload
- **Target file:** app-frontend/src/components/auth/NoAccess.tsx
- **Page action:** create_new
- **Is infrastructure only:** false
- **Requirement IDs:** R6, R7, R91, R95, R97, R102, BR3

## Plain summary

If a person is idle for 60 minutes or signs in somewhere else, the app returns them to sign-in and explains why. A person who opens a screen their role does not allow, for example from a saved link, sees a "you don't have access" message saying who to ask. Success messages fade on their own, while problem messages stay until dealt with.

## Summary

Handle session loss globally. Any 401 from the API (idle timeout or superseded session) sends the person to /sign-in with a persistent explanatory message, and a client-side idle timer redirects proactively at 60 minutes. Add the reusable no-access component, rendered inside the shell, for routes the role does not allow (e.g. an Approver opening /upload). It names who to ask ("your administrator") and is not an error page. Settle the shared message behaviour on the existing ToastContext and toast components: success messages auto-dismiss after a few seconds, problem messages stay until dismissed or resolved, and the icon-only dismiss button has a hover/focus label.

## Resolved design choices

- **Idle activity definition (user decision at stories approval):** only actions that reach the app (requests to the back end) restart the 60-minute timer. The client-side timer resets on each successful API request, **not** on mouse or keyboard input, and returns the person to sign-in at 60 minutes without a click.

## Acceptance criteria

- **AC-1** (coverage: playwright): When the session is no longer valid, either after 60 minutes idle or because the person signed in elsewhere, their next action takes them to sign-in with a message explaining they were signed out
- **AC-2** (coverage: playwright): After 60 minutes with no activity the person is returned to sign-in without needing to click anything, and activity (a request reaching the app) before then restarts the hour
- **AC-3** (coverage: playwright): An Approver who opens the Upload screen from a saved link sees a message inside the app saying they don't have access and who to ask, not an error page
- **AC-4** (coverage: vitest): Success messages disappear on their own after a few seconds, while problem messages stay until dismissed or resolved
- **AC-5** (coverage: vitest): Icon-only buttons, such as the message close button, show a label when pointed at or reached with the keyboard

## Manual test checklist

- Sign in as Approver User, then type /upload in the address bar → you see a "you don't have access" message saying who to ask, inside the app
- Sign in as File Importer in one browser, then sign in as the same person in a second browser → back in the first browser, click anything and you're sent to sign-in with a message saying you were signed out
- Sign in and leave the app idle past the timeout → you're returned to sign-in with an explanation (for a quicker check, the agents test this with a simulated clock)
- When a success message appears, it fades after a few seconds; a problem message stays until you close it
- Tab to a message's close button → its label appears
