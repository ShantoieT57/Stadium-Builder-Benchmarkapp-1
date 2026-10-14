/**
 * Story Metadata:
 * - Route: /dashboard
 * - Target File: app-frontend/src/app/(app)/layout.tsx
 * - Page Action: create_new
 *
 * Tests for Epic auth-and-app-shell, Story 4: the signed-in app frame
 * (header showing who is signed in + role-based menu).
 *
 * Implementation contract these tests assume:
 * - `src/app/(app)/layout.tsx` default-exports a layout that renders in the
 *   browser (a client component, or a server layout delegating to a client
 *   shell imported by it) and loads the session via GET /api/auth/me through
 *   the project API client (`getCurrentUser()` in `@/lib/api/endpoints`).
 * - The header is a `banner` landmark (`<header>`) showing the person's name and role.
 * - The menu is a `navigation` landmark labelled "Main" (e.g.
 *   `<nav aria-label="Main navigation">`). On narrow screens a labelled menu
 *   button toggles it; the phone behaviour itself is verified in Playwright (AC-6).
 * - Disallowed menu items are NOT rendered at all (no disabled/hidden copies).
 *
 * AC-3..AC-6 are covered by the Playwright spec for this story.
 * Cross-story invariants (menu hrefs, Sign Out for every role, no-session
 * gate) live in epic-auth-and-app-shell-baseline.test.tsx.
 *
 * These tests WILL FAIL until implemented (TDD red).
 */
import { render, screen, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import AppLayout from '@/app/(app)/layout';
import { ToastProvider } from '@/contexts/ToastContext';
import { apiClient, get, post } from '@/lib/api/client';
import { userInfoFor } from '@/mocks/data/identity';
import type { CurrentUser } from '@/types/api-generated';

vi.mock('@/lib/api/client', () => ({
  apiClient: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

const mockApiClient = apiClient as ReturnType<typeof vi.fn>;
const mockGet = get as ReturnType<typeof vi.fn>;
const mockPost = post as ReturnType<typeof vi.fn>;

/** Serve GET /api/auth/me with `user`; logout succeeds with 204. */
function signInAs(user: CurrentUser): void {
  const respond = (endpoint: unknown) => {
    if (typeof endpoint === 'string' && endpoint.endsWith('/api/auth/me')) {
      return Promise.resolve(user);
    }
    if (typeof endpoint === 'string' && endpoint.endsWith('/api/auth/logout')) {
      return Promise.resolve(undefined);
    }
    return Promise.reject({ message: 'Not Found', statusCode: 404, endpoint });
  };
  mockApiClient.mockImplementation(respond);
  mockGet.mockImplementation(respond);
  mockPost.mockImplementation(respond);
}

function renderShell(children: ReactNode = <h1>Dashboard</h1>) {
  return render(
    <ToastProvider>
      <AppLayout>{children}</AppLayout>
    </ToastProvider>,
  );
}

async function findMainNav(): Promise<HTMLElement> {
  return screen.findByRole('navigation', { name: /main/i });
}

describe('Epic auth-and-app-shell, Story 4: signed-in app frame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-1
  it('shows the name and role of the signed-in person in the header', async () => {
    signInAs(userInfoFor('Approver', { name: 'Thandi Mokoena' }));

    renderShell();

    const header = await screen.findByRole('banner');
    expect(
      await within(header).findByText(/Thandi Mokoena/),
    ).toBeInTheDocument();
    expect(within(header).getByText(/Approver/)).toBeInTheDocument();
  });

  // AC-2
  it('shows each role only the menu items it allows, leaving disallowed items out entirely', async () => {
    // Importer: Dashboard, Transactions, Upload
    signInAs(userInfoFor('Importer'));
    const { unmount } = renderShell();

    const importerNav = await findMainNav();
    expect(
      within(importerNav).getByRole('link', { name: /^dashboard$/i }),
    ).toBeInTheDocument();
    expect(
      within(importerNav).getByRole('link', { name: /^transactions$/i }),
    ).toBeInTheDocument();
    expect(
      within(importerNav).getByRole('link', { name: /^upload$/i }),
    ).toBeInTheDocument();

    unmount();

    // Approver: Dashboard, Transactions — Upload absent, not disabled
    signInAs(userInfoFor('Approver'));
    renderShell();

    const approverNav = await findMainNav();
    expect(
      within(approverNav).getByRole('link', { name: /^dashboard$/i }),
    ).toBeInTheDocument();
    expect(
      within(approverNav).getByRole('link', { name: /^transactions$/i }),
    ).toBeInTheDocument();
    expect(within(approverNav).queryByText(/upload/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /upload/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /upload/i }),
    ).not.toBeInTheDocument();
  });
});
