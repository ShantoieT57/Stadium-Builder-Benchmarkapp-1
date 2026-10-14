# Architecture & Reuse Registry
> One line per durable thing. Edit the line when it changes; delete it when the thing is gone.
> No story narrative, no dates, no rationale.

## Shared utilities & components
| Export | Location | Capability |
| --- | --- | --- |
| readScalarParam, readArrayParam, paginate | app-frontend/src/mocks/handler-utils.ts | MSW handler query-param reading and pagination slicing |
| homeRouteFor, NAV_ITEMS, navItemsFor, canAccessRoute, isRouteActive | app-frontend/src/lib/auth/roles.ts | Role → landing route; role-based main menu (BR1); route-level role check |
| AppShell | app-frontend/src/components/layout/AppShell.tsx | Signed-in frame: session check via getCurrentUser on mount + each navigation (401 → /sign-in), header with name/role, role menu, Sign out, phone menu; role-restricted routes render NoAccess; 60-min idle timer reset by successful API responses in any tab (re-checks shared last-activity before redirecting); Sign out in another tab → /sign-in; any 401 after sign-in → /sign-in?reason=signed-out |
| NoAccess | app-frontend/src/components/auth/NoAccess.tsx | In-shell "you don't have access" screen naming who to ask (not an error page) |
| SignedOutNotice | app-frontend/src/components/auth/SignedOutNotice.tsx | Dismissable sign-in-screen message shown for ?reason=signed-out |
| onSessionEvent, reportApiResponse, reportSignedOut, getLastActivityAt, SESSION_IDLE_TIMEOUT_MS, SIGNED_OUT_SIGN_IN_ROUTE | app-frontend/src/lib/auth/session-events.ts | API-client → app bus: 2xx = activity, 401 = unauthorized, other-tab sign-out = signed-out; last activity shared across tabs via localStorage + storage event (guarded); idle timeout constant; signed-out sign-in route |
| IconButton | app-frontend/src/components/ui/icon-button.tsx | Icon-only button with aria-label + Shadcn Tooltip label on hover/focus (GN-03); self-contained zero-delay TooltipProvider |
| Tooltip (Shadcn) | app-frontend/src/components/ui/tooltip.tsx | Radix tooltip primitives (Tooltip, TooltipTrigger, TooltipContent, TooltipProvider) |
| login, getCurrentUser, logout | app-frontend/src/lib/api/endpoints.ts | Auth API calls with session cookie (credentials: 'include') |
| apiClient (error parsing) | app-frontend/src/lib/api/client.ts | APIError.details carries the backend `{ message }` (or legacy `Messages[]`); network failure → statusCode 0; reports every response status to session-events |
| ToastProvider/useToast, ToastContainer, TOAST_DEFAULTS | app-frontend/src/contexts/ToastContext.tsx, app-frontend/src/components/toast/, app-frontend/src/types/toast.ts | Shared messages: default duration by variant (success/info fade after 5s; error/warning stay until dismissed); single timer in the provider; dismiss via IconButton |

## Conventions
- Browser calls same-origin /api/* (API_BASE_URL defaults to ''); next.config.ts rewrites /api/:path* to API_PROXY_TARGET (server-side env, default http://localhost:8042). Never point NEXT_PUBLIC_API_BASE_URL at the .NET API cross-origin.
- Protected screens live under app-frontend/src/app/(app)/ and render inside AppShell; the root layout has no <main> — each page/shell provides its own landmark.
- MSW mocks are toggled by NEXT_PUBLIC_USE_MOCK_API (app-frontend/.env.local); handlers compose factories from app-frontend/src/mocks/data/. MockProvider renders the app even if the worker fails to start (Playwright specs block service workers and use page.route).
- All API calls go through apiClient so session activity/401 handling is global; only successful requests count as activity (not mouse/keyboard).

## Cross-epic debt
