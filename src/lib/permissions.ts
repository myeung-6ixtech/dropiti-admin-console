/**
 * Permission checking utility for role-based access control
 * 
 * Based on the Administrator Users documentation
 * @see documentation/guides/administrator_users.md
 */

/**
 * Check if a user has a specific permission
 * 
 * @param userPermissions - Array of user's permissions (from role + user overrides)
 * @param requiredPermission - The permission to check (e.g., 'users:view')
 * @returns true if user has the permission
 * 
 * @example
 * hasPermission(['users:*', 'content:view'], 'users:edit') // true
 * hasPermission(['users:view'], 'users:edit') // false
 * hasPermission(['*'], 'anything') // true (wildcard)
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Wildcard grants all permissions
  if (userPermissions.includes('*')) {
    return true;
  }

  // Exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Wildcard category match (e.g., 'users:*' matches 'users:view')
  const [category] = requiredPermission.split(':');
  if (userPermissions.includes(`${category}:*`)) {
    return true;
  }

  return false;
}

/**
 * Check if a user has ANY of the required permissions
 * 
 * @param userPermissions - Array of user's permissions
 * @param requiredPermissions - Array of permissions (user needs at least one)
 * @returns true if user has at least one of the permissions
 * 
 * @example
 * hasAnyPermission(['users:view'], ['users:view', 'users:edit']) // true
 * hasAnyPermission(['content:view'], ['users:view', 'users:edit']) // false
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some(permission =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Check if a user has ALL of the required permissions
 * 
 * @param userPermissions - Array of user's permissions
 * @param requiredPermissions - Array of permissions (user needs all)
 * @returns true if user has all of the permissions
 * 
 * @example
 * hasAllPermissions(['users:view', 'users:edit'], ['users:view', 'users:edit']) // true
 * hasAllPermissions(['users:view'], ['users:view', 'users:edit']) // false
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every(permission =>
    hasPermission(userPermissions, permission)
  );
}

/**
 * Permission categories as defined in the documentation
 */
export const PERMISSION_CATEGORIES = {
  SYSTEM: 'system',
  USERS: 'users',
  CONTENT: 'content',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  SUPPORT: 'support',
} as const;

/**
 * Common permission patterns
 */
export const PERMISSIONS = {
  // System
  SYSTEM_VIEW: 'system:view',
  SYSTEM_MANAGE: 'system:manage',
  
  // Users
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_ALL: 'users:*',
  
  // Content
  CONTENT_VIEW: 'content:view',
  CONTENT_CREATE: 'content:create',
  CONTENT_EDIT: 'content:edit',
  CONTENT_DELETE: 'content:delete',
  CONTENT_ALL: 'content:*',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  ANALYTICS_ALL: 'analytics:*',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  
  // Support
  SUPPORT_VIEW: 'support:view',
  SUPPORT_MANAGE: 'support:manage',
  SUPPORT_ALL: 'support:*',
  
  // Wildcard
  ALL: '*',
} as const;

/**
 * Default roles as defined in the documentation
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SYSTEM_ADMIN: 'system_admin',
  USER_ADMIN: 'user_admin',
  CONTENT_ADMIN: 'content_admin',
  ANALYTICS_ADMIN: 'analytics_admin',
  SUPPORT_ADMIN: 'support_admin',
  VIEWER: 'viewer',
} as const;
