import Link from 'next/link';
import { requireAuthenticatedUser } from '@/lib/permissions/server';
import { hasRole, operationalRoles } from '@/lib/permissions/policy';
import { Card, Badge } from '@/components/ui/primitives';
import { ActionForm } from '@/components/auth/forms';
import { updateProfile } from '@/services/profile-actions';
import { logout } from '@/services/auth-actions';
export const dynamic = 'force-dynamic';
export default async function Account() {
 const { user, profile } = await requireAuthenticatedUser();
 return <div className="mx-auto max-w-xl space-y-6"><Card><h1 className="text-2xl font-bold">Your account</h1><p className="my-4 break-all text-muted">{user.email}</p><Badge>{profile.account_status}</Badge><p className="my-4">Your account is ready. Rental bookings will be added in a later phase.</p>{hasRole(profile,operationalRoles) && <Link className="mb-4 block underline" href="/admin">Admin</Link>}<ActionForm action={logout} label="Sign out" /></Card><Card><h2 className="mb-5 text-xl font-bold">Profile</h2><ActionForm action={updateProfile} label="Save profile" fields={[{name:'first_name',label:'First name',autoComplete:'given-name',defaultValue:profile.first_name,required:false},{name:'last_name',label:'Last name',autoComplete:'family-name',defaultValue:profile.last_name,required:false},{name:'phone',label:'Phone',type:'tel',autoComplete:'tel',defaultValue:profile.phone,required:false}]} /></Card></div>;
}
