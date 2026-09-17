export const roles = ['customer', 'staff', 'admin', 'super_admin'] as const;
export type Role = typeof roles[number];
export type AccountStatus = 'active' | 'restricted' | 'suspended';
export type Principal = { id: string; role: Role; account_status: AccountStatus };
export const operationalRoles: readonly Role[] = ['staff', 'admin', 'super_admin'];
export function hasRole(profile: Principal, allowed: readonly Role[]) {
  return profile.account_status === 'active' && allowed.includes(profile.role);
}
export function mayAccessAccount(profile: Principal) { return profile.account_status !== 'suspended'; }
export function safeNext(value: unknown): string {
  // Explicit destinations avoid protocol-relative, encoded and backslash redirects.
  return value === '/admin' ? '/admin' : '/account';
}
