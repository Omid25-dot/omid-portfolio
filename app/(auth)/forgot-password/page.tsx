import { AuthShell } from '@/components/auth/shell';
import { ActionForm } from '@/components/auth/forms';
import { forgotPassword } from '@/services/auth-actions';
export default function ForgotPassword() { return <AuthShell title="Reset your password" description="Enter your email and we will send you a reset link if an account exists."><ActionForm action={forgotPassword} label="Send reset link" fields={[{name:'email',label:'Email address',type:'email',autoComplete:'email'}]} /></AuthShell>; }
