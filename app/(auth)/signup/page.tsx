import { AuthShell } from '@/components/auth/shell';
import { ActionForm } from '@/components/auth/forms';
import { signup } from '@/services/auth-actions';
export default function Signup() { return <AuthShell title="Create an account" description="Use at least 12 characters for your password. We will email you a confirmation link."><ActionForm action={signup} label="Create account" fields={[{name:'email',label:'Email address',type:'email',autoComplete:'email'},{name:'password',label:'Password',type:'password',autoComplete:'new-password'}]} /></AuthShell>; }
