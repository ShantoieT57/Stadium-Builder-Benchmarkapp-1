import type { Role } from '@/types/api-generated';

/** The screen each role lands on after signing in (BR1). */
const HOME_ROUTE: Record<Role, string> = {
  Importer: '/upload',
  Approver: '/transactions',
};

/** Landing route for a signed-in person of `role`. */
export function homeRouteFor(role: Role): string {
  return HOME_ROUTE[role];
}
