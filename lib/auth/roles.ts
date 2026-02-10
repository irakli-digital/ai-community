/**
 * Role helper — centralises which roles count as "admin".
 * Both 'admin' and 'owner' are treated as full administrators.
 */
export function hasAdminRole(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'owner';
}

export function hasModRole(role: string | undefined | null): boolean {
  return hasAdminRole(role) || role === 'moderator';
}
