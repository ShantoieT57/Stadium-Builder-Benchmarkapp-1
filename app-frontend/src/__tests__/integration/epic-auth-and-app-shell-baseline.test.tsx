/**
 * Story Metadata:
 * - Route: /dashboard
 * - Target File: app-frontend/src/app/(app)/layout.tsx
 * - Page Action: create_new
 *
 * Per-epic baseline for Epic auth-and-app-shell — cross-story invariants of the
 * shared signed-in surface (the `(app)` route-group layout) that every later
 * screen renders inside. Later stories do NOT re-assert these; extend this file
 * only when a genuinely new shared surface appears.
 *
 * Covers:
 * - Shared-shell navigation: each menu item leads to its screen (BR1 routes).
 * - Sign Out is present for every role.
 * - The current screen's content renders inside the frame.
 * - Role-gating at the shell: with no session, protected content is never shown
 *   and the person is sent to /sign-in.
 *
 * Implementation contract: see the header of
 * epic-auth-and-app-shell-story-4-app-shell.test.tsx (main nav is a
 * `navigation` landmark labelled "Main"; session via GET /api/auth/me through
 * the project API client).
 *
 * The epic's accessibility baseline is the @axe-core/playwright scan in the
 * Story 4 Playwright spec, not here.
 *
 * These tests WILL FAIL until implemented (TDD red).
 */
import { render, screen, within, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import AppLayout from '@/app/(app)/layout';
import { ToastProvider } from '@/contexts/ToastContext';
import { apiClient, get, post } from '@/lib/api/client';
import { allRoles, userInfoFor } from '@/mocks/data/identity';
import type { CurrentUser } from '@/types/api-generated';

vi.mock('@/lib/api/client', () => ({
  apiClient: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

// One spy for every way the shell may navigate (router.push / router.replace /
// redirect), so the no-session test asserts the destination, not the mechanism.
const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigate,
    replace: navigate,
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: (url: string) => navigate(url),
}));

const mockApiClient = apiClient as ReturnType<typeof vi.fn>;
const mockGet = get as ReturnType<typeof vi.fn>;
const mockPost = post as ReturnType<typeof vi.fn>;

/** Serve GET /api/auth/me — `user` when signed in, 401 when `null`. */
function sessionIs(user: CurrentUser | null): void {
  const respond = (endpoint: unknown) => {
    if (typeof endpoint === 'string' && endpoint.endsWith('/api/auth/me')) {
      return user
        ? Promise.resolve(user)
        : Promise.reject({
            message: 'Unauthorized: Please log in to continue',
            statusCode: 401,
            details: ['Your session may have expired. Please log in again.'],
            endpoint,
          });
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

function renderShell(children: ReactNode) {
  return render(
    <ToastProvider>
      <AppLayout>{children}</AppLayout>
    </ToastProvider>,
  );
}

describe('Epic auth-and-app-shell baseline: shared signed-in frame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('each menu item leads to its own screen', async () => {
    sessionIs(userInfoFor('Importer'));
    renderShell(<h1>Dashboard</h1>);

    const nav = await screen.findByRole('navigation', { name: /main/i });
    expect(
      within(nav).getByRole('link', { name: /^dashboard$/i }),
    ).toHaveAttribute('href', '/dashboard');
    expect(
      within(nav).getByRole('link', { name: /^transactions$/i }),
    ).toHaveAttribute('href', '/transactions');
    expect(
      within(nav).getByRole('link', { name: /^upload$/i }),
    ).toHaveAttribute('href', '/upload');
  });

  it.each(allRoles)('offers Sign Out to a signed-in %s', async (role) => {
    sessionIs(userInfoFor(role));
    renderShell(<h1>Dashboard</h1>);

    expect(
      await screen.findByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it('renders the current screen inside the signed-in frame', async () => {
    sessionIs(userInfoFor('Approver'));
    renderShell(<p>Transactions screen body</p>);

    expect(
      await screen.findByText('Transactions screen body'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: /main/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('never shows protected content without a session and sends the person to sign-in', async () => {
    sessionIs(null);
    renderShell(<p>Protected dashboard content</p>);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(
        expect.stringMatching(/^\/sign-in/),
      );
    });
    expect(
      screen.queryByText('Protected dashboard content'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: /main/i }),
    ).not.toBeInTheDocument();
  });
});
