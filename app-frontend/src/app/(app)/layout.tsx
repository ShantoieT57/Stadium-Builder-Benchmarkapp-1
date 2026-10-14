import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';

/**
 * Signed-in route group. The session is checked in the browser by AppShell
 * (GET /api/auth/me) so every protected screen renders inside the shared frame.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
