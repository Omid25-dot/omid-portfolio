import Link from 'next/link';
export const metadata={robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default function Layout({children}:{children:React.ReactNode}){return <><nav className="account-nav" aria-label="Your account"><Link href="/account">Overview</Link><Link href="/account/bookings">My bookings</Link><Link href="/account/profile">Profile</Link></nav>{children}</>;}
