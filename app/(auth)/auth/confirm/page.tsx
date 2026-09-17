import { confirmationSchema } from '@/lib/validation/schemas';
import { AuthShell } from '@/components/auth/shell';
import { ActionForm } from '@/components/auth/forms';
import { confirmEmail } from '@/services/auth-actions';
export default async function Confirm({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
 const params = await searchParams;
 const parsed = confirmationSchema.safeParse({ token_hash: params.token_hash, type: params.type });
 return <AuthShell title="Confirm your email link" description="Continue to securely verify this link.">{parsed.success ? <ActionForm action={confirmEmail} label="Confirm and continue" hidden={parsed.data} /> : <p role="alert">This link is invalid. Request a new email.</p>}</AuthShell>;
}
