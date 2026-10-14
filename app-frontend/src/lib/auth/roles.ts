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

/** A main-menu entry and the roles allowed to see it and open its screen. */
export interface NavItem {
  label: string;
  href: string;
  roles: readonly Role[];
}

/** The role-based main menu (BR1), in display order. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ['Importer', 'Approver'] },
  {
    label: 'Transactions',
    href: '/transactions',
    roles: ['Importer', 'Approver'],
  },
  { label: 'Upload', href: '/upload', roles: ['Importer'] },
];

/** Menu items a person of `role` may see. Disallowed items are left out, never disabled (R90). */
export function navItemsFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/** Whether `pathname` is (or sits under) the menu entry `href`. */
export function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Whether a person of `role` may open the screen at `pathname`. Screens that are
 * not role-restricted menu routes are open to every signed-in person.
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  const item = NAV_ITEMS.find((entry) => isRouteActive(pathname, entry.href));
  return item ? item.roles.includes(role) : true;
}
