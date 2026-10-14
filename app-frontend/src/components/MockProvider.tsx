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
    started.then(() => setReady(true));
  }, []);

  // Hold rendering until the worker is active so first-load API calls
  // (e.g. GET /api/auth/me) are intercepted.
  if (!ready) return null;
  return <>{children}</>;
}
