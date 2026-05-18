import { UserRole } from '../types/auth';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.PASSENGER]: 0,
  [UserRole.DRIVER]: 1,
  [UserRole.CONDUCTOR]: 1,
  [UserRole.INSPECTOR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.EXECUTIVE]: 4,
};

export const STAFF_ROLES: UserRole[] = [
  UserRole.DRIVER,
  UserRole.CONDUCTOR,
  UserRole.INSPECTOR,
  UserRole.ADMIN,
  UserRole.EXECUTIVE,
];

export const ADMIN_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.EXECUTIVE,
];

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
