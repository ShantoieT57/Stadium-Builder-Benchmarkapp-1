'use client';

import {
  useEffect,
  useEffectEvent,
  useId,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { useToast } from '@/contexts/ToastContext';
import { getCurrentUser, logout } from '@/lib/api/endpoints';
import { canAccessRoute, isRouteActive, navItemsFor } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';
import type { CurrentUser } from '@/types/api-generated';

export const SIGN_IN_ROUTE = '/sign-in';
const APP_NAME = 'Transaction Import';

function statusCodeOf(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const { statusCode } = error as { statusCode?: unknown };
    return typeof statusCode === 'number' ? statusCode : undefined;
  }
  return undefined;
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

  const sendToSignIn = () => {
    setSession({ status: 'checking' });
    router.replace(SIGN_IN_ROUTE);
  };
  const onSessionMissing = useEffectEvent(sendToSignIn);

  // Re-verify the session on every screen change (and on retry). The previous
  // person stays on screen while the check runs; a 401 clears it immediately.
  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) setSession({ status: 'signed-in', user });
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
    try {
      await logout();
    } catch (error) {
      // 401: already signed out — carry on to sign-in.
      if (statusCodeOf(error) !== 401) {
        setSigningOut(false);
        showToast({
          variant: 'error',
          title: "We couldn't sign you out. Please try again.",
        });
        return;
      }
    }
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
        {allowed ? (
          children
        ) : (
          // Seam for role-restricted screens: the no-access screen replaces this.
          <div className="mx-auto w-full max-w-7xl px-4 py-8">
            <p>You don&apos;t have access to this screen.</p>
          </div>
        )}
      </main>
    </div>
  );
}
