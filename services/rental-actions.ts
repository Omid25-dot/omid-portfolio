'use server';
import { z } from 'zod';
import { requireAuthenticatedUser, requireRole } from '@/lib/permissions/server';
import { assertSameOrigin } from '@/lib/security/origin';
import { enforceRateLimit } from '@/lib/rate-limit/server';
import { RateLimitError } from '@/lib/rate-limit/errors';
import { bookingInputSchema, periodSchema, transitionSchema, blockSchema, rentalError, bookingColumns, customerBookingSchema, type RentalResult, type CustomerBooking } from '@/lib/booking/contracts';
import { quoteRental, type RentalQuote } from '@/lib/pricing/server';
import { checkAvailability, type RentalAvailability } from '@/lib/availability/server';

function failure(error:unknown): {ok:false;error:string} {
 if(error instanceof z.ZodError) return {ok:false,error:'Check the supplied rental details.'};
 if(error instanceof RateLimitError) return {ok:false,error:error.message};
 const parsed=z.object({code:z.string().optional(),message:z.string().optional()}).safeParse(error);
 return {ok:false,error:rentalError(parsed.success?parsed.data:{})};
}
export async function getRentalQuote(input:unknown):Promise<RentalResult<RentalQuote>> {
 const {user,supabase}=await requireAuthenticatedUser();
 try { await assertSameOrigin(); await enforceRateLimit('rental-quote',user.id); return {ok:true,data:await quoteRental(supabase,input)}; }
 catch(error){return failure(error);}
}
export async function getRentalAvailability(input:unknown):Promise<RentalResult<RentalAvailability>> {
 const {user,supabase}=await requireAuthenticatedUser();
 try { await assertSameOrigin(); await enforceRateLimit('rental-availability',user.id); return {ok:true,data:await checkAvailability(supabase,periodSchema.parse(input))}; }
 catch(error){return failure(error);}
}
export async function createRentalBooking(input:unknown):Promise<RentalResult<string>> {
 const {user,supabase}=await requireAuthenticatedUser();
 try {
  const p=bookingInputSchema.parse(input); await assertSameOrigin(); await enforceRateLimit('booking-create',user.id);
  const {data,error}=await supabase.rpc('create_rental_booking',{p_equipment:p.equipment_id,p_start:p.start_date,p_end:p.end_date,p_method:p.fulfilment_method});
  if(error) throw error;
  return {ok:true,data:z.uuid().parse(data)};
 } catch(error){return failure(error);}
}
export async function transitionRentalBooking(input:unknown):Promise<RentalResult<null>> {
 const {user,supabase}=await requireRole(['staff','admin','super_admin']);
 try {
  const p=transitionSchema.parse(input); await assertSameOrigin(); await enforceRateLimit('booking-transition',user.id);
  const {error}=await supabase.rpc('transition_rental_booking',{p_booking:p.booking_id,p_status:p.status,p_reason:p.reason??null});
  if(error) throw error; return {ok:true,data:null};
 } catch(error){return failure(error);}
}
export async function createAvailabilityBlock(input:unknown):Promise<RentalResult<string>> {
 const {user,supabase}=await requireRole(['staff','admin','super_admin']);
 try {
  const p=blockSchema.parse(input); await assertSameOrigin(); await enforceRateLimit('availability-block',user.id);
  const {data,error}=await supabase.rpc('create_availability_block',{p_equipment:p.equipment_id,p_start:p.start_date,p_end:p.end_date,p_type:p.type,p_reason:p.reason});
  if(error) throw error; return {ok:true,data:z.uuid().parse(data)};
 } catch(error){return failure(error);}
}
export async function getMyRentalBooking(id:unknown):Promise<RentalResult<CustomerBooking>> {
 const {user,supabase}=await requireAuthenticatedUser();
 try {
  const {data,error}=await supabase.from('bookings').select(bookingColumns).eq('id',z.uuid().parse(id)).eq('customer_id',user.id).single();
  if(error) throw error; return {ok:true,data:customerBookingSchema.parse(data)};
 } catch(error){return failure(error);}
}
