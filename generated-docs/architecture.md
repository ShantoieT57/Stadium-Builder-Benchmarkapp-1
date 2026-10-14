# Architecture & Reuse Registry
> One line per durable thing. Edit the line when it changes; delete it when the thing is gone.
> No story narrative, no dates, no rationale.

## Shared utilities & components
| Export | Location | Capability |
| --- | --- | --- |
| readScalarParam, readArrayParam, paginate | app-frontend/src/mocks/handler-utils.ts | MSW handler query-param reading and pagination slicing |
| homeRouteFor | app-frontend/src/lib/auth/roles.ts | Role → landing route (Importer /upload, Approver /transactions) |
| login, getCurrentUser, logout | app-frontend/src/lib/api/endpoints.ts | Auth API calls with session cookie (credentials: 'include') |
| apiClient (error parsing) | app-frontend/src/lib/api/client.ts | APIError.details carries the backend `{ message }` (or legacy `Messages[]`); network failure → statusCode 0 |

## Conventions
- Browser calls same-origin /api/* (API_BASE_URL defaults to ''); next.config.ts rewrites /api/:path* to API_PROXY_TARGET (server-side env, default http://localhost:8042). Never point NEXT_PUBLIC_API_BASE_URL at the .NET API cross-origin.
- MSW mocks are toggled by NEXT_PUBLIC_USE_MOCK_API (app-frontend/.env.local); handlers compose factories from app-frontend/src/mocks/data/.

## Cross-epic debt
