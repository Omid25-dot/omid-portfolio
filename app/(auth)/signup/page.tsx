import { AuthShell } from '@/components/auth/shell';
import { ActionForm } from '@/components/auth/forms';
import { signup } from '@/services/auth-actions';
import {safeNext} from '@/lib/permissions/policy';
export default async function Signup({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) { const next=safeNext((await searchParams).next); return <AuthShell next={next} title="Create an account" description="Use at least 12 characters for your password. We will email you a confirmation link."><ActionForm hidden={{next}} action={signup} label="Create account" fields={[{name:'email',label:'Email address',type:'email',autoComplete:'email'},{name:'password',label:'Password',type:'password',autoComplete:'new-password'}]} /></AuthShell>; }
