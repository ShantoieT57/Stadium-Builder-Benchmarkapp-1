/**
 * Story Metadata:
 * - Route: /dashboard
 * - Target File: app-frontend/src/app/(app)/layout.tsx
 * - Page Action: create_new
 *
 * Mocking strategy:
 * - Backend calls are ALWAYS mocked — this spec never contacts a live backend.
 *   Intercept via: MSW (app-frontend/src/mocks/ is wired; enabled by
 *   NEXT_PUBLIC_USE_MOCK_API=true, which must be set for the dev server AND at build
 *   time for the E2E_PROD run). The MSW handlers in src/mocks/handlers.ts answer
 *   POST /api/auth/login, GET /api/auth/me and POST /api/auth/logout from the shared
 *   identity source (src/mocks/data/identity.ts) — this spec authors no response bodies.
 * - Implementation pattern this assumes:
 *   - The (app) layout checks the session from the BROWSER (client-side GET
 *     /api/auth/me via the lib/api client) so MSW's service worker can answer it;
 *     a 401 redirects to /sign-in. A server-side session check would bypass MSW.
 *   - The MSW mock session lives in page memory, so a full page load (page.goto)
 *     starts signed out. Signed-in tests therefore sign in through the real /sign-in
 *     form and then move around with in-app (client-side) navigation only.
 *   - Sign Out calls POST /api/auth/logout, then routes to /sign-in. Browser Back
 *     re-runs the layout's session check (no cached protected content shown).
 *   - The app root (/) redirects rather than rendering the template "Welcome" page.
 *   - At phone width the nav collapses behind a button with an accessible name
 *     matching /menu/i; menu items are links inside a <nav>; Sign Out is a button.
 * - If the implementation diverges from these assumptions, this spec will not pass.
 *
 * E2E spec for Epic auth-and-app-shell, Story 4: Signed-in app frame with role menu
 * and sign-out. Also carries the epic's real-browser axe accessibility scan.
 * These tests WILL FAIL until implemented (TDD red).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// Mock identities from the shared project-wide source (relative import, no @/ alias).
// These are mock seed users only — never real accounts.
import { seededUsers } from '../src/mocks/data/identity';
import type { Role } from '../src/types/api-generated';

import type { Page } from '@playwright/test';

const WCAG_21_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const LANDING_BY_ROLE: Record<Role, RegExp> = {
  Importer: /\/upload$/,
  Approver: /\/transactions$/,
};

/** Sign in through the real form; MSW answers login and sets its in-memory session. */
async function signInAs(page: Page, role: Role): Promise<void> {
  const user = seededUsers[role];
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(LANDING_BY_ROLE[role]);
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
}

test.describe('Epic auth-and-app-shell, Story 4: Signed-in app frame', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // AC-3
  test('signed-out visitors to the root or a protected address are sent to sign-in', async ({
    page,
  }) => {
    for (const path of ['/', '/dashboard', '/transactions', '/upload']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/sign-in/);
      await expect(
        page.getByRole('heading', { name: 'Welcome', exact: true }),
      ).toHaveCount(0);
      await expect(page.getByRole('button', { name: /sign out/i })).toHaveCount(
        0,
      );
    }
  });

  // AC-4
  test('clicking Sign Out returns the person to the sign-in screen', async ({
    page,
  }) => {
    await signInAs(page, 'Importer');

    await page.getByRole('button', { name: /sign out/i }).click();

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(
      page.getByRole('button', { name: /^sign in$/i }),
    ).toBeVisible();
  });

  // AC-5
  test('pressing Back after signing out stays on sign-in and does not reveal the previous screen', async ({
    page,
  }) => {
    await signInAs(page, 'Approver');
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'Dashboard', exact: true })
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/sign-in/);

    await page.goBack();

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole('button', { name: /sign out/i })).toHaveCount(
      0,
    );
    await expect(page.getByText(seededUsers.Approver.name)).toHaveCount(0);
  });

  // AC-6
  test('on a phone-width screen the menu opens from a labelled button and every item and Sign Out is keyboard-reachable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await signInAs(page, 'Importer');

    const menuButton = page.getByRole('button', { name: /menu/i });
    await expect(menuButton).toBeVisible();

    await menuButton.focus();
    await page.keyboard.press('Enter');

    const nav = page.getByRole('navigation');
    for (const item of ['Dashboard', 'Transactions', 'Upload']) {
      await expect(
        nav.getByRole('link', { name: item, exact: true }),
      ).toBeVisible();
    }

    // Tab forward from the menu button and record each focused control's accessible
    // text; every menu item and Sign Out must be reached by keyboard alone.
    const reached = new Set<string>();
    for (let i = 0; i < 15; i += 1) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return '';
        return (el.getAttribute('aria-label') ?? el.textContent ?? '').trim();
      });
      reached.add(label);
    }
    const reachedText = [...reached].join(' | ');
    expect(reachedText).toMatch(/\bDashboard\b/);
    expect(reachedText).toMatch(/\bTransactions\b/);
    expect(reachedText).toMatch(/\bUpload\b/);
    expect(reachedText).toMatch(/sign out/i);
  });

  // Accessibility (NFR-base-1) — the epic's real-browser axe scan, scoped to WCAG 2.1 AA.
  // Scans each distinct state the shell introduces: signed-in desktop frame, and the
  // phone-width frame with the collapsible menu open.
  test('the signed-in app frame has no accessibility violations (desktop and open phone menu)', async ({
    page,
  }) => {
    await signInAs(page, 'Importer');
    await expect(page.getByRole('navigation')).toBeVisible();
    const desktop = await new AxeBuilder({ page })
      .withTags(WCAG_21_AA)
      .analyze();
    expect(desktop.violations).toEqual([]);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole('button', { name: /menu/i }).click();
    await expect(
      page
        .getByRole('navigation')
        .getByRole('link', { name: 'Upload', exact: true }),
    ).toBeVisible();
    const phoneMenuOpen = await new AxeBuilder({ page })
      .withTags(WCAG_21_AA)
      .analyze();
    expect(phoneMenuOpen.violations).toEqual([]);
  });
});
