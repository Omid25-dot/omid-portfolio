import {notFound} from 'next/navigation';
import {myBooking} from '@/lib/booking/customer-server';
import {BookingDetail} from '@/components/booking/customer-view';
export default async function Confirmation({params}:{params:Promise<{reference:string}>}){const b=await myBooking((await params).reference);if(!b)notFound();return <BookingDetail booking={b} confirmation/>;}
