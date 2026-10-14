/**
 * Story Metadata:
 * - Route: /upload
 * - Target File: app-frontend/src/components/auth/NoAccess.tsx
 * - Page Action: create_new
 *
 * Epic auth-and-app-shell, Story 5: Session timeout, no-access screen and on-screen messages.
 *
 * Vitest scope (AC-4, AC-5) is the shared message behaviour, settled on the EXISTING
 * toast system — src/contexts/ToastContext.tsx + src/components/toast/ — rendered
 * exactly as the root layout mounts it (ToastProvider + ToastContainer).
 * AC-1/AC-2/AC-3 (session loss, idle timeout, no-access screen) are Playwright.
 *
 * Implementation contract these tests assume:
 * - AC-4: a toast shown WITHOUT an explicit `duration` takes its default from its
 *   variant — `success` auto-dismisses after a few seconds; `error` (a problem)
 *   has no auto-dismiss and stays until the person closes it.
 * - AC-5: the icon-only dismiss button shows a visible label (an element with
 *   role="tooltip", named "Dismiss notification") while it is hovered or focused,
 *   and hides it again on unhover/blur. A native `title` attribute is not enough —
 *   browsers never show it on keyboard focus.
 *
 * No backend calls are involved, so nothing is mocked. Fails until implemented (TDD red).
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/toast/ToastContainer';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient, get, post } from '@/lib/api/client';
import {
  LAST_ACTIVITY_STORAGE_KEY,
  reportApiResponse,
  SIGN_OUT_STORAGE_KEY,
  SIGNED_OUT_SIGN_IN_ROUTE,
} from '@/lib/auth/session-events';
import { userInfoFor } from '@/mocks/data/identity';

// Only the cross-tab session tests render the app frame; the message tests
// above use the real toast system and make no API calls.
vi.mock('@/lib/api/client', () => ({
  apiClient: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

const routerReplace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: routerReplace,
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

/**
 * Test driver: buttons that raise messages through the real useToast() hook, so the
 * real provider + container decide how long each message stays.
 */
function MessageTrigger() {
  const { showToast } = useToast();
  return (
    <>
      <button
        type="button"
        onClick={() =>
          showToast({ variant: 'success', title: 'File uploaded' })
        }
      >
        Raise success
      </button>
      <button
        type="button"
        onClick={() => showToast({ variant: 'error', title: 'Upload failed' })}
      >
        Raise problem
      </button>
    </>
  );
}

function renderWithMessages() {
  return render(
    <ToastProvider>
      <MessageTrigger />
      <ToastContainer />
    </ToastProvider>,
  );
}

describe('Epic auth-and-app-shell, Story 5: on-screen messages', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // AC-4
  it('success messages fade on their own while problem messages stay until dismissed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithMessages();

    await user.click(screen.getByRole('button', { name: 'Raise success' }));
    await user.click(screen.getByRole('button', { name: 'Raise problem' }));

    expect(screen.getByText('File uploaded')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed');

    // A few seconds later the success message has gone by itself.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.queryByText('File uploaded')).not.toBeInTheDocument();

    // The problem message is still there well after any auto-dismiss window.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    const problem = screen.getByRole('alert');
    expect(problem).toHaveTextContent('Upload failed');

    // It leaves only when the person closes it.
    await user.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );
    expect(screen.queryByText('Upload failed')).not.toBeInTheDocument();
  });

  // AC-5
  it('the icon-only close button shows its label on hover and on keyboard focus', async () => {
    const user = userEvent.setup();
    renderWithMessages();

    await user.click(screen.getByRole('button', { name: 'Raise problem' }));
    const closeButton = screen.getByRole('button', {
      name: 'Dismiss notification',
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Pointed at: the label appears, and goes when the pointer leaves.
    await user.hover(closeButton);
    expect(
      await screen.findByRole('tooltip', { name: 'Dismiss notification' }),
    ).toBeVisible();
    await user.unhover(closeButton);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Reached with the keyboard: the label appears on focus.
    // Start keyboard navigation from the page body (clicking "Raise problem" left focus there).
    act(() => {
      (document.activeElement as HTMLElement | null)?.blur();
    });
    // Tab order: "Raise success", "Raise problem", then the message's close button.
    await user.tab();
    await user.tab();
    await user.tab();
    expect(closeButton).toHaveFocus();
    expect(
      await screen.findByRole('tooltip', { name: 'Dismiss notification' }),
    ).toBeVisible();
  });
});

const MINUTE = 60 * 1000;

/** Another tab of the same browser records a successful request at `now`. */
function activityInAnotherTab(): void {
  const value = String(Date.now());
  window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, value);
  // The browser fires `storage` only in the OTHER tabs — i.e. in this one.
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: LAST_ACTIVITY_STORAGE_KEY,
      newValue: value,
    }),
  );
}

describe('Epic auth-and-app-shell, Story 5: idle hour shared across tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    const user = userInfoFor('Importer', { name: 'Thandi Mokoena' });
    const respond = (endpoint: unknown) => {
      if (typeof endpoint === 'string' && endpoint.endsWith('/api/auth/me')) {
        return Promise.resolve(user);
      }
      return Promise.reject({ message: 'Not Found', statusCode: 404 });
    };
    (apiClient as ReturnType<typeof vi.fn>).mockImplementation(respond);
    (get as ReturnType<typeof vi.fn>).mockImplementation(respond);
    (post as ReturnType<typeof vi.fn>).mockImplementation(respond);
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  async function renderSignedInShell() {
    render(
      <ToastProvider>
        <AppShell>
          <h1>Dashboard</h1>
        </AppShell>
      </ToastProvider>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    // This tab's own successful request (the API client reports it).
    act(() => reportApiResponse(200));
  }

  it("activity in another tab postpones this tab's idle sign-out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderSignedInShell();

    // 40 minutes idle here, while the person works in another tab.
    act(() => {
      vi.advanceTimersByTime(40 * MINUTE);
    });
    act(() => activityInAnotherTab());

    // 60 minutes after THIS tab's last request — but only 20 after the other
    // tab's: still signed in.
    act(() => {
      vi.advanceTimersByTime(20 * MINUTE + 30_000);
    });
    expect(routerReplace).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();

    // A full hour after the last activity in any tab: signed out with the notice.
    act(() => {
      vi.advanceTimersByTime(40 * MINUTE);
    });
    expect(routerReplace).toHaveBeenCalledWith(SIGNED_OUT_SIGN_IN_ROUTE);
  });

  it('re-checks the shared activity time when its own timer runs out', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderSignedInShell();

    act(() => {
      vi.advanceTimersByTime(50 * MINUTE);
    });
    // Another tab's request was recorded, but no storage event reached this tab.
    window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(Date.now()));

    act(() => {
      vi.advanceTimersByTime(10 * MINUTE + 30_000);
    });
    expect(routerReplace).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50 * MINUTE);
    });
    expect(routerReplace).toHaveBeenCalledWith(SIGNED_OUT_SIGN_IN_ROUTE);
  });

  it('signing out in another tab sends this tab to sign-in', async () => {
    await renderSignedInShell();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: SIGN_OUT_STORAGE_KEY,
          newValue: String(Date.now()),
        }),
      );
    });

    expect(routerReplace).toHaveBeenCalledWith('/sign-in');
    expect(
      screen.queryByRole('heading', { name: 'Dashboard' }),
    ).not.toBeInTheDocument();
  });
});
