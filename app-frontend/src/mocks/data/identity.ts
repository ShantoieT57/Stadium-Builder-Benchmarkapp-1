/**
 * Project-wide identity mock data — the single source of the signed-in-person
 * contract for BOTH test layers (Vitest and Playwright) and the manual-test
 * approval. Never inline a CurrentUser body in a test or spec; import from here.
 *
 * Shape anchored to `CurrentUser` in src/types/api-generated.ts (generated from
 * generated-docs/specs/api-spec.yaml), returned by POST /api/auth/login and
 * GET /api/auth/me. Seeded people come from project.md §Roles & Permissions.
 *
 * Import discipline: type-only imports, relative paths (no `@/` alias) so the
 * Playwright runtime can import this module without alias plumbing.
 */
import type {
  CurrentUser,
  ErrorResponse,
  LoginRequest,
  Role,
} from '../../types/api-generated';

/** A seeded person: the CurrentUser the backend returns plus their mock sign-in password. */
export interface SeededUser extends CurrentUser {
  password: string;
}

/** Password shared by both seeded users (mock/test seed only — not a real account). */
export const SEEDED_PASSWORD = 'Test123';

/** The two seeded people, one per role. */
export const seededUsers: Record<Role, SeededUser> = {
  Importer: {
    name: 'File Importer',
    email: 'fileimporter@digiata.com',
    role: 'Importer',
    password: SEEDED_PASSWORD,
  },
  Approver: {
    name: 'Approver User',
    email: 'approver@digiata.com',
    role: 'Approver',
    password: SEEDED_PASSWORD,
  },
};

/** All roles the app knows about, in a stable order. */
export const allRoles: Role[] = ['Importer', 'Approver'];

/**
 * The CurrentUser body the backend returns for a signed-in person of `role`
 * (POST /api/auth/login 200 and GET /api/auth/me 200). Overrides let a test
 * vary a field without redefining the shape.
 */
export const userInfoFor = (
  role: Role,
  overrides: Partial<CurrentUser> = {},
): CurrentUser => {
  const { name, email } = seededUsers[role];
  return { name, email, role, ...overrides };
};

/** The LoginRequest body a seeded person of `role` submits. */
export const loginRequestFor = (role: Role): LoginRequest => ({
  email: seededUsers[role].email,
  password: seededUsers[role].password,
});

/** ErrorResponse factory for 400 / 401 auth responses. */
export const createErrorResponse = (
  message = 'Invalid email or password',
): ErrorResponse => ({
  message,
});
