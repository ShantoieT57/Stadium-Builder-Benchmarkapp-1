# Journal — Sign-in and App Shell

## Story 1: Back-end sign-in service

- Built and green via the backend-workflow (22 Gherkin scenarios). Held **uncommitted** at the user's request: the CLAUDE.backend.md manual test will be done through the sign-in front-end once it exists. Story order adjusted accordingly — front-end stories 3 and 4 run before story 2.
- The canonical front-end spec `generated-docs/specs/api-spec.yaml` is a verbatim copy of the back-end's `app-backend/docs/TransactionImportApi.yaml` (the back end owns the contract). Refresh the copy whenever the back-end spec changes.

## Story 3: Sign-in screen

- The front end no longer calls the .NET API directly. The browser now talks to /api/... on its own address, and Next.js forwards those calls to the API (set by API_PROXY_TARGET, default http://localhost:8042). This keeps the sign-in cookie working without cross-site settings. NEXT_PUBLIC_API_BASE_URL was removed from .env.example and .env.local. The proxy target is read when `next dev` / `next build` starts, so restart after changing it.
- The shared API client now also picks up the back end's `{ message }` error text, so server error messages reach the app instead of being replaced by generic ones.
