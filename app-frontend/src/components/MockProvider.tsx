'use client';

import { useEffect, useState } from 'react';

const MOCKS_ENABLED = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

let started: Promise<unknown> | null = null;

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!MOCKS_ENABLED);

  useEffect(() => {
    if (!MOCKS_ENABLED) return;
    if (!started) {
      started = import('../mocks/browser').then(({ worker }) =>
        worker.start({ onUnhandledRequest: 'warn' }),
      );
    }
    started
      .catch((error: unknown) => {
        // The worker could not start (e.g. service workers are blocked). Render
        // anyway: requests then go to the network (or a test's own interception).
        console.warn('Mock API worker failed to start', error);
      })
      .finally(() => setReady(true));
  }, []);

  // Hold rendering until the worker has started (or failed to) so first-load
  // API calls (e.g. GET /api/auth/me) are intercepted when mocks are on.
  if (!ready) return null;
  return <>{children}</>;
}
