# Journal — Sign-in and App Shell

## Story 1: Back-end sign-in service

- Built and green via the backend-workflow (22 Gherkin scenarios). Held **uncommitted** at the user's request: the CLAUDE.backend.md manual test will be done through the sign-in front-end once it exists. Story order adjusted accordingly — front-end stories 3 and 4 run before story 2.
- The canonical front-end spec `generated-docs/specs/api-spec.yaml` is a verbatim copy of the back-end's `app-backend/docs/TransactionImportApi.yaml` (the back end owns the contract). Refresh the copy whenever the back-end spec changes.

## Story 3: Sign-in screen

- The front end no longer calls the .NET API directly. The browser now talks to /api/... on its own address, and Next.js forwards those calls to the API (set by API_PROXY_TARGET, default http://localhost:8042). This keeps the sign-in cookie working without cross-site settings. NEXT_PUBLIC_API_BASE_URL was removed from .env.example and .env.local. The proxy target is read when `next dev` / `next build` starts, so restart after changing it.
- The shared API client now also picks up the back end's `{ message }` error text, so server error messages reach the app instead of being replaced by generic ones.

## Story 4: Signed-in app frame

- Every signed-in screen now sits inside a shared frame. The header shows the app name, who is signed in (name and role) and a Sign out button, and below it is a menu with only the items that person's role allows: Importers see Dashboard, Transactions and Upload; Approvers see Dashboard and Transactions. On a phone the menu folds behind a menu button. The frame re-checks the sign-in on every screen change, and anyone without one is sent to the sign-in page.
- Opening the app's root address no longer shows the template "Welcome" page. Signed-in people go to their landing screen and everyone else goes to sign-in. Dashboard, Transactions and Upload are empty placeholder screens for later epics to fill.

## Story 2: Back-end session rules

- 60-minute sliding idle timeout, one active session per person, and sign-out ending every session are enforced by the back end. Reusable ImporterOnly / ApproverOnly policies exist for later epics to attach to their endpoints. Manually verified by the user (a second sign-in signed out the first browser).

## Story 5: Session timeout, no-access screen and messages

- If someone's session ends without them choosing it (an hour with nothing reaching the app, or signing in somewhere else), the app now takes them to sign-in with a message saying they were signed out. They can close the message; it also goes away once they sign in. Someone who simply wasn't signed in yet doesn't see that message.
- An Approver who opens the Upload screen from a saved link now sees "You don't have access to this screen" inside the app, with the menu still there, and is told to ask their administrator.
- Success messages now fade after about 5 seconds, while problem messages stay until closed. The close button shows its label on hover and on keyboard focus.
- Test fix accepted by the orchestrator: the story-5 AC-5 Vitest blurred the wrong element before tabbing (focus was left on the trigger button). Changed to blur `document.activeElement`; the assertion (label shows on keyboard focus) is unchanged.

## Epic-end code review follow-ups

- Story 5 fix: the 60-minute idle sign-out now looks at activity in every open tab of the browser, not just the current one. If you're working in one tab, a tab you left idle won't sign you out. Signing out in one tab also takes the other open tabs back to the sign-in screen.
- Story 4 fix: the menu button and the message close buttons now use the standard Shadcn tooltip for their hover/focus labels instead of a custom one. Nothing changes for users: the label still appears straight away on hover or keyboard focus and disappears when you move away.
- Story 3 fix: the red used for errors was a bit too light to read easily on the pale-red error box (WCAG needs 4.5:1; it was about 4:1). The error red is darker across the app, and the sign-in error message now uses the standard Alert component. Wrong-password and connection-problem messages are easier to read, and future error boxes get the same styling.
- Story 5 fix (review pass 2): when the 60-minute idle limit runs out, the app now also ends the server session, so going back to the home page after an idle sign-out asks for the password again. Other open tabs also land on the sign-in page with the 'You've been signed out' message. Signing out no longer counts as activity.
