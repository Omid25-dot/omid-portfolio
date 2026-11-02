import Link from 'next/link';

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="container auth-page">
    <div className="auth-form">{children}</div>
    <aside className="auth-context">
      <span className="eyebrow">One team behind every hire</span>
      <p className="auth-context-title">Your next job.<br />All in hand.</p>
      <p>Keep your equipment requests, hire dates and account details together.</p>
      <div className="auth-context-note"><strong>Just browsing?</strong><p>You can explore the fleet and check prices without an account.</p><Link className="text-link" href="/equipment">Browse equipment <span aria-hidden="true">↗</span></Link></div>
      <p className="auth-context-small">Booking requests are unpaid. A request is not a confirmed hire.</p>
    </aside>
  </div>;
}
