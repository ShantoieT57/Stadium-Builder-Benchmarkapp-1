/**
 * Story Metadata:
 * - Route: /upload
 * - Target File: app-frontend/src/components/auth/NoAccess.tsx
 * - Page Action: create_new
 *
 * Mocking strategy:
 * - Backend calls are ALWAYS mocked. This spec never contacts a live backend and
 *   needs no real credentials.
 *   Intercept via: page.route(), with service workers blocked
 *   (`test.use({ serviceWorkers: 'block' })`).
 *   - The app's runtime MSW worker (NEXT_PUBLIC_USE_MOCK_API=true) keeps its session
 *     in page memory, so it loses the session on every full page load and can't
 *     model "signed in elsewhere" or a server-side idle expiry. Requests the service
 *     worker answers never reach page.route(). So this spec blocks the worker and
 *     answers GET /api/auth/me itself, using a per-test flag for session validity.
 *   - Response bodies come from the shared identity source (`userInfoFor`). They
 *     are never written inline.
 * - Implementation pattern this assumes:
 *   - MockProvider must still render the app when the MSW worker cannot start
 *     (e.g. `worker.start()` rejects because service workers are blocked). It must
 *     not hold rendering forever.
 *   - All API calls go through the shared browser-side API client (fetch from client
 *     components), so page.route() can see them. The `**` URL globs match both
 *     the absolute NEXT_PUBLIC_API_BASE_URL form and the same-origin /api proxy form.
 *   - The (app) shell checks the session (GET /api/auth/me) on each in-app
 *     navigation, so clicking a menu item is "a request reaching the app".
 *   - Any 401 from the API sends the person to /sign-in, where a lasting message
 *     says they were signed out.
 *   - The client-side 60-minute idle timer restarts only after a successful API
 *     request. Mouse and keyboard input do not restart it. When the timer runs
 *     out, the person goes to /sign-in on their own, with no click needed.
 *   - Role-restricted screens (Approver on /upload) show the NoAccess component
 *     inside the shell at the same URL. They neither redirect nor show an error page.
 * - If the implementation diverges from these assumptions, this spec will not pass.
 *
 * E2E spec for Epic auth-and-app-shell, Story 5: Session timeout, no-access screen
 * and on-screen messages. The 60-minute idle flow uses Playwright's simulated clock
 * (page.clock) against the real duration. No test-only hooks are needed in
 * production code. These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// The single shared source for the signed-in-person body. Imported by relative
// path (not @/) so Playwright resolves it without alias plumbing.
import { userInfoFor } from '../src/mocks/data/identity';

import type { Page, Route } from '@playwright/test';
import type { Role } from '../src/types/api-generated';

// Block the MSW service worker so page.route() sees every API request.
test.use({ serviceWorkers: 'block' });

const WCAG_21_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Fulfil a route with JSON. CORS headers allow the absolute-API-URL form. */
async function fulfill(
  route: Route,
  status: number,
  body?: unknown,
): Promise<void> {
  const origin = route.request().headers()['origin'];
  await route.fulfill({
    status,
    headers: origin
      ? {
          'access-control-allow-origin': origin,
          'access-control-allow-credentials': 'true',
        }
      : {},
    contentType: 'application/json',
    body: body === undefined ? '' : JSON.stringify(body),
  });
}

/**
 * Mock the auth endpoints for a signed-in person of `role`. Returns a control
 * object. Call `endSession()` to make the "server" answer later requests with
 * 401, as it does after an idle timeout or a newer sign-in elsewhere.
 */
async function mockSession(
  page: Page,
  role: Role,
): Promise<{ endSession: () => void }> {
  let sessionValid = true;

  // Catch-all first (Playwright matches the most recently registered route first):
  // no API request may leak to a live backend.
  await page.route('**/api/**', (route) =>
    fulfill(route, 501, { message: 'Unmocked API call' }),
  );

  await page.route('**/api/auth/me', (route) =>
    sessionValid ? fulfill(route, 200, userInfoFor(role)) : fulfill(route, 401),
  );
  await page.route('**/api/auth/logout', (route) => fulfill(route, 204));

  return {
    endSession: () => {
      sessionValid = false;
    },
  };
}

test.describe('Epic auth-and-app-shell, Story 5: Session timeout, no-access screen and messages', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // AC-1
  test('a session ended by a sign-in elsewhere sends the next action to sign-in with a signed-out message', async ({
    page,
  }) => {
    const session = await mockSession(page, 'Importer');

    await page.goto('/upload');
    const transactionsLink = page.getByRole('link', { name: 'Transactions' });
    await expect(transactionsLink).toBeVisible();

    // The same person signs in on another browser, so the server now rejects this session.
    session.endSession();

    // Their next action reaches the app, gets a 401, and is sent to sign-in.
    await transactionsLink.click();

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByText(/signed out/i)).toBeVisible();

    // Accessibility of the sign-in screen while it shows the signed-out message.
    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_21_AA)
      .analyze();
    expect(violations).toEqual([]);
  });

  // AC-2
  test('after 60 minutes with no request the person is returned to sign-in unprompted, and a request restarts the hour', async ({
    page,
  }) => {
    await page.clock.install();
    const session = await mockSession(page, 'Importer');

    // Loading the screen is a successful request, so the hour starts now.
    await page.goto('/upload');
    const transactionsLink = page.getByRole('link', { name: 'Transactions' });
    await expect(transactionsLink).toBeVisible();

    // 59 minutes idle: still signed in.
    await page.clock.fastForward('59:00');
    await expect(page).toHaveURL(/\/upload/);

    // A request reaching the app (an in-app navigation) restarts the hour.
    const apiResponse = page.waitForResponse(
      (response) => response.url().includes('/api/') && response.ok(),
    );
    await transactionsLink.click();
    await apiResponse;
    await expect(page).toHaveURL(/\/transactions/);

    // Mouse and keyboard input alone must NOT restart the hour.
    await page.clock.fastForward('30:00');
    await page.mouse.move(200, 200);
    await page.mouse.move(400, 300);
    await page.keyboard.press('Shift');

    // 59 minutes after the last request: still signed in. This proves the request reset
    // the timer, because 118 minutes have passed since the first load.
    await page.clock.fastForward('29:00');
    await expect(page).toHaveURL(/\/transactions/);

    // The hour since the last request runs out. The server expires the session, and the
    // browser returns the person to sign-in without any click.
    session.endSession();
    await page.clock.fastForward('01:30');

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByText(/signed out/i)).toBeVisible();
  });

  // AC-3
  test('an Approver opening /upload from a saved link sees an in-app no-access message naming who to ask', async ({
    page,
  }) => {
    await mockSession(page, 'Approver');

    await page.goto('/upload');

    // Stays on the requested address inside the signed-in shell. No redirect, no error page.
    await expect(page).toHaveURL(/\/upload/);
    await expect(
      page.getByRole('link', { name: 'Transactions' }),
    ).toBeVisible();
    await expect(page.getByText(/(don't|do not) have access/i)).toBeVisible();
    await expect(page.getByText(/administrator/i)).toBeVisible();

    // Accessibility of the no-access state.
    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_21_AA)
      .analyze();
    expect(violations).toEqual([]);
  });
});
