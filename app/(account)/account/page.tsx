import Link from 'next/link';
import {requireAuthenticatedUser} from '@/lib/permissions/server';
import {myBookings} from '@/lib/booking/customer-server';
import {BookingCard} from '@/components/booking/customer-view';
export default async function Account(){
 const {profile}=await requireAuthenticatedUser();
 const result=await myBookings().catch(()=>null);
 return <><header className="section-heading"><div><span className="eyebrow">Welcome back{profile.first_name?`, ${profile.first_name}`:''}</span><h1>Your account</h1><p>Your requests, upcoming hire and recent activity.</p></div><Link className="button" href="/equipment">Find equipment</Link></header><section><h2>Recent bookings</h2>{result===null?<p role="alert" className="notice">We could not load bookings. Please try again shortly.</p>:result.items.length?result.items.slice(0,5).map(b=><BookingCard key={b.reference} booking={b}/>):<div className="notice"><p>You do not have any rentals yet.</p><Link href="/equipment">Browse equipment</Link></div>}<Link className="text-link" href="/account/bookings">View all bookings ↗</Link></section><section className="review-section"><h2>Your account details</h2><p>Verification and payment are not available online yet. Requests remain unpaid until the future booking steps are available.</p><Link href="/account/profile">Manage profile & sign out</Link></section></>;
}
