import { AuthShell } from '@/components/auth/shell';
import { ActionForm } from '@/components/auth/forms';
import { forgotPassword } from '@/services/auth-actions';
import {safeNext} from '@/lib/permissions/policy';
export default async function ForgotPassword({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) { const next=safeNext((await searchParams).next); return <AuthShell next={next} title="Reset your password" description="Enter your email and we will send you a reset link if an account exists."><ActionForm hidden={{next}} action={forgotPassword} label="Send reset link" fields={[{name:'email',label:'Email address',type:'email',autoComplete:'email'}]} /></AuthShell>; }
