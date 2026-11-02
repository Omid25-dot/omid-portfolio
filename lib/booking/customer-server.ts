import 'server-only';
import {z} from 'zod';
import {requireAuthenticatedUser} from '@/lib/permissions/server';
import {bookingViewSchema,referenceSchema} from './customer';
export async function myBookings(page=1){const {supabase}=await requireAuthenticatedUser('/account/bookings');const {data,error}=await supabase.rpc('customer_booking_list',{p_page:page});if(error)throw Error('Bookings are temporarily unavailable');return z.object({total:z.number().int(),items:z.array(bookingViewSchema)}).parse(data);}
export async function myBooking(reference:string){const {supabase}=await requireAuthenticatedUser('/account/bookings');if(!referenceSchema.safeParse(reference).success)return null;const {data,error}=await supabase.rpc('customer_booking_detail',{p_reference:reference});if(error)throw Error('Booking is temporarily unavailable');return data?bookingViewSchema.parse(data):null;}
