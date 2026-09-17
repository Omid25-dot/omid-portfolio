import { requireRole } from '@/lib/permissions/server';
import { hasRole, operationalRoles } from '@/lib/permissions/policy';
import { Card, Badge } from '@/components/ui/primitives';
import { ActionForm } from '@/components/auth/forms';
import { accessReview, changeRole } from '@/services/profile-actions';
export const dynamic = 'force-dynamic';
export default async function Admin() {
 const { profile } = await requireRole(operationalRoles);
 return <div className="mx-auto max-w-xl space-y-6"><Card><h1 className="mb-4 text-2xl font-bold">Admin access</h1><Badge>{profile.role.replace('_',' ')}</Badge><p className="mt-4 text-muted">Access has been checked on the server. Rental operations will be added in later phases.</p></Card>{hasRole(profile,['admin','super_admin']) && <Card><h2 className="mb-4 text-xl font-bold">Record an access review</h2><ActionForm action={accessReview} label="Record access review" confirmation="I have reviewed my administrative access and want to record this review." /></Card>}{hasRole(profile,['super_admin']) && <Card><h2 className="mb-4 text-xl font-bold">Change a user role</h2><p className="mb-5 text-sm text-muted">This grants or removes administrative access. Every change is recorded. You cannot change your own role.</p><ActionForm action={changeRole} label="Confirm role change" fields={[{name:'user_id',label:'Target user ID'}]} roleSelect confirmation="I have checked the target user and confirm this access change." /></Card>}</div>;
}
