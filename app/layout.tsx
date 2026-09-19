import type { Metadata } from 'next';
import { brandName } from '@/lib/config/public';
import { PublicHeader,PublicFooter } from '@/components/catalogue/header';
import './globals.css';
export const metadata: Metadata = { metadataBase:new URL(process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000'),title: { default: brandName, template: `%s | ${brandName}` }, description: 'Equipment hire, managed by one professional team.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en-GB"><body><a href="#main" className="skip-link">Skip to content</a><PublicHeader/><main id="main">{children}</main><PublicFooter/></body></html>;
}
