import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getPublicSupabaseConfig } from '@/lib/config/public';
import { hasRecoveryGrant } from '@/lib/auth/recovery';
import { AuthShell } from '@/components/auth/shell';
import { ActionForm } from '@/components/auth/forms';
import { resetPassword } from '@/services/auth-actions';
export default async function ResetPassword() {
 if (!getPublicSupabaseConfig()) redirect('/setup');
 const supabase = await createServerSupabase();
 const { data: {user} } = await supabase.auth.getUser();
 if (!user || !await hasRecoveryGrant(user.id)) redirect('/forgot-password');
 return <AuthShell title="Choose a new password" description="Use at least 12 characters. This reset link is valid for a short time."><ActionForm action={resetPassword} label="Save new password" fields={[{name:'password',label:'New password',type:'password',autoComplete:'new-password'},{name:'confirm_password',label:'Confirm new password',type:'password',autoComplete:'new-password'}]} /></AuthShell>;
}
