# Mock Data Context

Generated: 2026-10-14
Source spec: generated-docs/specs/api-spec.yaml

## Data Conventions
- ID format: n/a (auth endpoints only)
- Pagination envelope: n/a
- Date format: ISO 8601

## Entities and Sample Values
### CurrentUser
- Source: factory app-frontend/src/mocks/data/identity.ts (userInfoFor, seededUsers)
- Seeded: fileimporter@digiata.com (Importer), approver@digiata.com (Approver); password Test123

## Sample Data Used
None — composed from identity factory.

## Assumptions
- Session is in-memory module state (single user), not a cookie; resets on page reload of the worker.
- Login: missing field 400, bad credentials 401 "Invalid email or password", email case-insensitive.
