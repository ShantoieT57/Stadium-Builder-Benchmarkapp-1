/**
 * MSW Mock Handlers
 *
 * AUTO-GENERATED from generated-docs/specs/api-spec.yaml
 * by mock-setup-agent. Editable — /api-mock-refresh does smart
 * partial updates and will not overwrite handlers you have
 * customised, as long as the endpoint signature is unchanged.
 *
 * Regenerate with: /api-mock-refresh
 */
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '@/lib/utils/constants';
import {
  allRoles,
  createErrorResponse,
  seededUsers,
  userInfoFor,
} from '@/mocks/data/identity';
import type { Role } from '@/types/api-generated';

/** In-memory mock session: the role of the signed-in person, or null. */
let sessionRole: Role | null = null;

export const handlers = [
  // POST /api/auth/login
  http.post(`${API_BASE_URL}/api/auth/login`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    if (!body.email || !body.password) {
      return HttpResponse.json(
        createErrorResponse('Email and password are required'),
        { status: 400 },
      );
    }
    const email = body.email.trim().toLowerCase();
    const role = allRoles.find(
      (r) => seededUsers[r].email.toLowerCase() === email,
    );
    if (!role || seededUsers[role].password !== body.password) {
      return HttpResponse.json(createErrorResponse(), { status: 401 });
    }
    sessionRole = role;
    return HttpResponse.json(userInfoFor(role), { status: 200 });
  }),

  // GET /api/auth/me
  http.get(`${API_BASE_URL}/api/auth/me`, () => {
    if (!sessionRole) {
      return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json(userInfoFor(sessionRole), { status: 200 });
  }),

  // POST /api/auth/logout
  http.post(`${API_BASE_URL}/api/auth/logout`, () => {
    sessionRole = null;
    return new HttpResponse(null, { status: 204 });
  }),
];
