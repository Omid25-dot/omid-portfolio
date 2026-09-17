import Link from 'next/link';
import { Card, Badge } from '@/components/ui/primitives';
export default function Home() {
 return <div className="mx-auto max-w-2xl"><Card><Badge>Account foundation</Badge><h1 className="mt-5 text-3xl font-bold">Equipment hire, managed by one team.</h1><p className="my-5 text-muted">Our rental service is being prepared. Account access is the first step; equipment hire is not available yet.</p><div className="flex flex-wrap gap-5"><Link className="font-semibold text-primary underline" href="/login">Sign in</Link><Link className="font-semibold text-primary underline" href="/signup">Create an account</Link></div></Card></div>;
}
