import Link from 'next/link';
import { Card } from '@/components/ui/primitives';
import { getPublicSupabaseConfig } from '@/lib/config/public';
export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
 return <Card><h1 className="text-2xl font-bold">{title}</h1><p className="mb-6 mt-3 text-muted">{description}</p>{getPublicSupabaseConfig() ? children : <p role="status">Account services are not configured yet. <Link className="underline" href="/setup">View setup status</Link>.</p>}<nav aria-label="Account access" className="mt-6 flex flex-wrap gap-4 text-sm underline"><Link href="/login">Sign in</Link><Link href="/signup">Sign up</Link><Link href="/forgot-password">Forgot password?</Link></nav></Card>;
}
