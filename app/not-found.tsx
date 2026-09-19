import Link from 'next/link';
export default function NotFound() { return <div className="container section"><h1 className="text-2xl font-bold">Page not found</h1><p className="my-4">This equipment or page is not currently available.</p><Link href="/equipment" className="button">Browse equipment</Link></div>; }
