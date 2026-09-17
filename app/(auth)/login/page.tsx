import { AuthShell } from '@/components/auth/shell';
import { ActionForm } from '@/components/auth/forms';
import { login } from '@/services/auth-actions';
import { safeNext } from '@/lib/permissions/policy';
export default async function Login({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
 const params = await searchParams;
 return <AuthShell title="Sign in" description="Access your equipment hire account.">{params.reset === 'success' && <p role="status" className="mb-4 text-success">Password updated. Sign in with your new password.</p>}<ActionForm action={login} label="Sign in" hidden={{ next: safeNext(params.next) }} fields={[{name:'email',label:'Email address',type:'email',autoComplete:'email'},{name:'password',label:'Password',type:'password',autoComplete:'current-password'}]} /></AuthShell>;
}
