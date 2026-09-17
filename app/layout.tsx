import type { Metadata } from 'next';
import Link from 'next/link';
import { brandName } from '@/lib/config/public';
import './globals.css';
export const metadata: Metadata = { title: { default: brandName, template: `%s | ${brandName}` }, description: 'Managed equipment hire. Account and security foundation.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en-GB"><body><a href="#main" className="sr-only focus:not-sr-only">Skip to content</a><header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5"><Link href="/" className="font-bold">{brandName}</Link><Link href="/account" className="text-sm underline">My account</Link></div></header><main id="main" className="mx-auto max-w-5xl px-5 py-10">{children}</main><footer className="mx-auto max-w-5xl px-5 py-8 text-sm text-muted">Application foundation · Equipment hire is not yet available.</footer></body></html>;
}
