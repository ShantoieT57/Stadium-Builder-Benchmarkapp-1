'use client';

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { NoAccess } from '@/components/auth/NoAccess';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { useToast } from '@/contexts/ToastContext';
import { isAPIError } from '@/lib/api/errors';
import { getCurrentUser, logout } from '@/lib/api/endpoints';
import { canAccessRoute, isRouteActive, navItemsFor } from '@/lib/auth/roles';
import {
  getLastActivityAt,
  onSessionEvent,
  reportSignedOut,
  SESSION_IDLE_TIMEOUT_MS,
  SIGNED_OUT_SIGN_IN_ROUTE,
} from '@/lib/auth/session-events';
import { cn } from '@/lib/utils';
import type { CurrentUser } from '@/types/api-generated';

export const SIGN_IN_ROUTE = '/sign-in';
const APP_NAME = 'Transaction Import';

function statusCodeOf(error: unknown): number | undefined {
  return isAPIError(error) ? error.statusCode : undefined;
}

type SessionState =
  | { status: 'checking' }
  | { status: 'signed-in'; user: CurrentUser }
  | { status: 'unavailable' };

/**
 * The signed-in frame every protected screen renders inside: verifies the
 * session (GET /api/auth/me) on mount and on each in-app navigation, shows who
 * is signed in, the role-based main menu (BR1) and Sign Out. With no session the
 * person is sent to /sign-in and no protected content is rendered.
 *
 * Session loss (BR3): a 401 from any API call after the person was signed in
 * (idle timeout or a newer sign-in elsewhere) sends them to sign-in with a
 * "signed out" message. Only successful requests restart the 60-minute idle
 * timer; when it runs out the server session is ended (POST /api/auth/logout,
 * so the cookie cannot re-enter the app) and the person is sent to sign-in
 * without a click. The idle hour is shared by every tab of the browser (the
 * server session is shared): a request in any tab postpones every tab's
 * timeout, and signing out (or timing out) in one tab sends the others to
 * sign-in too.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const navId = useId();

  const [session, setSession] = useState<SessionState>({ status: 'checking' });
  // The phone menu is open only on the screen it was opened on, so it closes
  // by itself whenever the screen changes.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn === pathname;
  const setMenuOpen = (open: boolean) => setMenuOpenOn(open ? pathname : null);
  const [signingOut, setSigningOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Whether this frame has seen a valid session: a later 401 means the session
  // ended (not that the person never signed in).
  const wasSignedIn = useRef(false);
  const leaving = useRef(false);
  const signingOutRef = useRef(false);

  const sendToSignIn = (sessionEnded = false) => {
    if (leaving.current) return;
    leaving.current = true;
    setSession({ status: 'checking' });
    router.replace(sessionEnded ? SIGNED_OUT_SIGN_IN_ROUTE : SIGN_IN_ROUTE);
  };
  const onSessionMissing = useEffectEvent(() =>
    sendToSignIn(wasSignedIn.current),
  );
  // The shared idle hour ran out: end the server session too — the server may
  // still consider the cookie valid — then leave with the "signed out" notice.
  // The redirect never waits on, or depends on, the sign-out request: a network
  // failure or a 401 (the server already expired it) changes nothing here.
  // logout() is not counted as activity and its 401 raises no session event.
  const onIdleTimeout = useEffectEvent(() => {
    if (leaving.current || signingOutRef.current) return;
    void logout().catch(() => undefined);
    reportSignedOut(true);
    sendToSignIn(true);
  });
  const onUnauthorized = useEffectEvent(() => {
    if (wasSignedIn.current && !signingOutRef.current) sendToSignIn(true);
  });
  // The person chose Sign out in another tab: leave quietly, as this tab would.
  // Another tab timed the session out: leave with the "signed out" notice.
  const onSignedOutElsewhere = useEffectEvent((sessionEnded: boolean) => {
    if (!signingOutRef.current) sendToSignIn(sessionEnded);
  });

  // Every API response (in this tab or another tab of the browser) is seen
  // here: a success restarts the 60-minute idle timer, a 401 ends the session.
  // Mouse/keyboard input deliberately does not count as activity (BR3,
  // resolved design choice).
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const clearIdleTimer = () => {
      if (idleTimer !== null) clearTimeout(idleTimer);
      idleTimer = null;
    };
    // Wait until an hour after the latest activity in ANY tab; when the timer
    // fires, re-check in case another tab was active meanwhile.
    const scheduleIdleCheck = () => {
      clearIdleTimer();
      const remaining =
        getLastActivityAt() + SESSION_IDLE_TIMEOUT_MS - Date.now();
      if (remaining <= 0) {
        onIdleTimeout();
        return;
      }
      idleTimer = setTimeout(scheduleIdleCheck, remaining);
    };
    const unsubscribe = onSessionEvent((event) => {
      if (event === 'activity') {
        scheduleIdleCheck();
      } else if (event === 'signed-out' || event === 'session-ended') {
        clearIdleTimer();
        onSignedOutElsewhere(event === 'session-ended');
      } else {
        onUnauthorized();
      }
    });
    return () => {
      unsubscribe();
      clearIdleTimer();
    };
  }, []);

  // Re-verify the session on every screen change (and on retry). The previous
  // person stays on screen while the check runs; a 401 clears it immediately.
  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        wasSignedIn.current = true;
        setSession({ status: 'signed-in', user });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (statusCodeOf(error) === 401) {
          onSessionMissing();
        } else {
          setSession({ status: 'unavailable' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, attempt]);

  // A page restored from the browser's back/forward cache must not show a
  // stale signed-in frame: re-check the session.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        leaving.current = false;
        setSession({ status: 'checking' });
        setAttempt((n) => n + 1);
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  // Escape closes the phone menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpenOn(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    signingOutRef.current = true;
    try {
      await logout();
    } catch (error) {
      // 401: already signed out — carry on to sign-in.
      if (statusCodeOf(error) !== 401) {
        signingOutRef.current = false;
        setSigningOut(false);
        showToast({
          variant: 'error',
          title: "We couldn't sign you out. Please try again.",
        });
        return;
      }
    }
    // Sign the other tabs of this browser out too (BR3).
    reportSignedOut();
    // Drop the signed-in frame before leaving so Back cannot reveal it.
    sendToSignIn();
  };

  if (session.status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p role="status" className="text-sm text-muted-foreground">
          Checking your sign-in…
        </p>
      </main>
    );
  }

  if (session.status === 'unavailable') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div role="alert" className="flex max-w-sm flex-col items-center gap-4">
          <p className="text-center text-sm">
            We can&apos;t reach the app right now. Check your connection and try
            again.
          </p>
          <Button
            type="button"
            onClick={() => {
              setSession({ status: 'checking' });
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const { user } = session;
  const items = navItemsFor(user.role);
  const allowed = canAccessRoute(user.role, pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-3">
          <IconButton
            className="md:hidden"
            label={menuOpen ? 'Close menu' : 'Open menu'}
            icon={menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
            aria-expanded={menuOpen}
            aria-controls={navId}
            onClick={() => setMenuOpen(!menuOpen)}
          />
          <span className="truncate font-semibold">{APP_NAME}</span>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <p className="flex min-w-0 flex-col text-right text-sm leading-tight sm:flex-row sm:items-baseline sm:gap-2">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground">{user.role}</span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              Sign out
            </Button>
          </div>
        </div>
        <nav
          id={navId}
          aria-label="Main navigation"
          className={cn(
            'mx-auto w-full max-w-7xl px-4 pb-2 md:block',
            menuOpen ? 'block' : 'hidden',
          )}
        >
          <ul className="flex flex-col gap-1 md:flex-row md:gap-2">
            {items.map((item) => {
              const active = isRouteActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'block rounded-md px-3 py-2 text-sm font-medium outline-none',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main id="main-content" className="flex-1">
        {allowed ? children : <NoAccess />}
      </main>
    </div>
  );
}
