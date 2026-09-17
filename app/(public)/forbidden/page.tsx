import Link from 'next/link';
import { Card } from '@/components/ui/primitives';
export default function Forbidden() { return <Card><h1 className="text-2xl font-bold">Access unavailable</h1><p className="my-4">Your account does not have permission to access this area.</p><Link className="underline" href="/">Return home</Link></Card>; }
