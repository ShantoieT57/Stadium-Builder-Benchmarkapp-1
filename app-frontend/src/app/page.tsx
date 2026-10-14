'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SIGN_IN_ROUTE } from '@/components/layout/AppShell';
import { isAPIError } from '@/lib/api/errors';
import { getCurrentUser } from '@/lib/api/endpoints';
import { homeRouteFor } from '@/lib/auth/roles';

/** App root: signed-in people go to their landing screen, everyone else to sign-in. */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) router.replace(homeRouteFor(user.role));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Only a 401 means "signed out". Any other failure (network, 5xx) goes
        // into the signed-in frame, which shows its "can't reach" retry screen
        // and still sends the person to sign-in if the retry gets a 401.
        const signedOut = isAPIError(error) && error.statusCode === 401;
        router.replace(signedOut ? SIGN_IN_ROUTE : '/dashboard');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
