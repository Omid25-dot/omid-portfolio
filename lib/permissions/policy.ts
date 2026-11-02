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
  if (value === '/admin' || value === '/account' || value === '/account/bookings') return value;
  if (typeof value !== 'string' || value.length>700 || /[%\\#\s]/.test(value)) return '/account';
  // Only local booking routes and an allowlist of non-financial selections.
  const [path,query='']=value.split('?');
  if (!/^\/booking\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path) || path==='/booking/confirmation') return '/account';
  const params=new URLSearchParams(query);
  if ([...params.keys()].some(k=>!['start','end','method'].includes(k)||params.getAll(k).length!==1)) return '/account';
  for (const k of ['start','end']) if(params.has(k)&&!/^\d{4}-\d{2}-\d{2}$/.test(params.get(k)!))return '/account';
  if(params.has('method')&&params.get('method')!=='collection')return '/account';
  return path+(params.size?`?${params}`:'');
}
