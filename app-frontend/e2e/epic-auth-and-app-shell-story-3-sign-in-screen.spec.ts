/**
 * Story Metadata:
 * - Route: /sign-in
 * - Target File: app-frontend/src/app/sign-in/page.tsx
 * - Page Action: create_new
 *
 * Mocking strategy:
 * - Backend calls are ALWAYS mocked — this spec never contacts a live backend.
 *   Primary layer: MSW (app-frontend/src/mocks/handlers.ts), enabled in the dev/prod
 *   server by NEXT_PUBLIC_USE_MOCK_API=true (.env.local). Fallback layer: page.route()
 *   on the same auth endpoints, so the spec stays self-contained if MSW is not active.
 *   (Requests MSW's service worker answers never reach page.route(); the two agree
 *   because both build their bodies from src/mocks/data/identity.ts.)
 * - Implementation pattern this assumes:
 *   - The sign-in form calls POST /api/auth/login from the BROWSER (a client-component
 *     fetch via lib/api/endpoints.ts `login()`), not a Next.js Server Action — neither
 *     MSW's browser worker nor page.route() can intercept Node-side fetches.
 *   - On a 200 the page routes by the returned CurrentUser.role:
 *     Importer -> /upload, Approver -> /transactions.
 *   - The session is an HTTP-only `session` cookie (NFR-1); the destination page may
 *     call GET /api/auth/me, which the mocks answer with the signed-in person.
 * - If the implementation diverges from these assumptions, this spec will not pass.
 *
 * E2E spec for Epic auth-and-app-shell, Story 3: Sign-in screen.
 * Only AC-5 is tagged `playwright`; AC-1..AC-4 are covered in Vitest. The extra test
 * is the policy-required real-browser WCAG 2.1 AA scan (NFR-base-1).
 * These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// Shared, project-wide identity source (mock seed only — never real accounts).
// Relative import (not @/) so Playwright's runtime resolves it without alias plumbing.
import {
  allRoles,
  createErrorResponse,
  seededUsers,
  userInfoFor,
} from '../src/mocks/data/identity';

import type { Page } from '@playwright/test';
import type { Role } from '../src/types/api-generated';

const WCAG_21_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const landingRouteFor: Record<Role, RegExp> = {
  Importer: /\/upload(\?.*)?$/,
  Approver: /\/transactions(\?.*)?$/,
};

/**
 * Fallback mock of the auth chain at the browser boundary (mirrors the MSW
 * handlers): login validates against the seeded people, /me reflects the
 * session established by a successful login. Install before navigating.
 */
async function mockAuthChain(page: Page): Promise<void> {
  let sessionRole: Role | null = null;

  await page.route('**/api/auth/login', async (route) => {
    const body = (route.request().postDataJSON() ?? {}) as {
      email?: string;
      password?: string;
    };
    const role = allRoles.find(
      (r) =>
        seededUsers[r].email.toLowerCase() ===
        (body.email ?? '').trim().toLowerCase(),
    );
    if (!role || seededUsers[role].password !== body.password) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify(createErrorResponse()),
      });
      return;
    }
    sessionRole = role;
    await route.fulfill({
      status: 200,
      headers: {
        'set-cookie': 'session=mock-token; Path=/; HttpOnly; SameSite=Strict',
      },
      contentType: 'application/json',
      body: JSON.stringify(userInfoFor(role)),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    if (!sessionRole) {
      await route.fulfill({ status: 401 });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(userInfoFor(sessionRole)),
    });
  });

  await page.route('**/api/auth/logout', async (route) => {
    sessionRole = null;
    await route.fulfill({ status: 204 });
  });
}

async function signIn(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('Epic auth-and-app-shell, Story 3: Sign-in screen', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // AC-5
  test('an Importer lands on Upload and an Approver lands on Transactions after signing in', async ({
    browser,
  }) => {
    for (const role of allRoles) {
      // Fresh context per role so no session (cookie or mock state) carries over.
      const context = await browser.newContext();
      const page = await context.newPage();
      await mockAuthChain(page);

      await page.goto('/sign-in');
      await expect(
        page.getByRole('button', { name: /sign in/i }),
      ).toBeVisible();

      const { email, password } = seededUsers[role];
      await signIn(page, email, password);

      await expect(page).toHaveURL(landingRouteFor[role]);

      await context.close();
    }
  });

  // Accessibility (NFR-base-1) — real-browser WCAG 2.1 AA scan of each state this
  // story introduces: the default form and the wrong-details error state.
  test('the sign-in screen has no accessibility violations, including the error state', async ({
    page,
  }) => {
    await mockAuthChain(page);
    await page.goto('/sign-in');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    const initial = await new AxeBuilder({ page })
      .withTags(WCAG_21_AA)
      .analyze();
    expect(initial.violations).toEqual([]);

    await signIn(page, seededUsers.Importer.email, 'not-the-password');
    await expect(page.getByText('Invalid email or password')).toBeVisible();

    const errorState = await new AxeBuilder({ page })
      .withTags(WCAG_21_AA)
      .analyze();
    expect(errorState.violations).toEqual([]);
  });
});
