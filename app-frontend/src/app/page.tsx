'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      .catch(() => {
        if (!cancelled) router.replace('/sign-in');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
