'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {requireAuthenticatedUser} from '@/lib/permissions/server';
import {assertSameOrigin} from '@/lib/security/origin';
import {enforceRateLimit} from '@/lib/rate-limit/server';
import {serverSecret} from '@/lib/config/server';
import {contactSchema,referenceSchema} from '@/lib/booking/customer';
import {readReview} from '@/lib/booking/review-token';
import {rentalError} from '@/lib/booking/contracts';
import {reportFailure} from '@/lib/security/errors';
import type {FormState} from '@/types/forms';
export async function requestBooking(_previous:FormState,form:FormData):Promise<FormState>{
 const {user,supabase}=await requireAuthenticatedUser(form.get('next') as string);
 const contact=contactSchema.safeParse(Object.fromEntries(['first_name','last_name','phone'].map(k=>[k,form.get(k)])));
 if(!contact.success)return {error:'Add your name and a valid contact number.',fields:contact.error.flatten().fieldErrors};
 if(form.get('confirm')!=='yes')return {error:'Please acknowledge the request terms.'};
 let reference:string;
 try{
  await assertSameOrigin();await enforceRateLimit('customer-booking-create',user.id);
  let review;try{review=readReview(String(form.get('review')),serverSecret('SECURITY_HMAC_SECRET'),user.id);}catch{return {error:'This review has expired or changed. Refresh this page to review the current price.'};}
  const {data,error}=await supabase.rpc('request_customer_booking',{p_equipment:review.equipment,p_start:review.start,p_end:review.end,p_request:review.request,p_expected_quote:review.quote,p_first_name:contact.data.first_name,p_last_name:contact.data.last_name,p_phone:contact.data.phone,p_terms:true});
  if(error)return {error:error.message==='QUOTE_CHANGED'?'The price has changed. Refresh this page and review the new quote before requesting.':error.code==='23P01'?'This equipment is no longer available for the selected dates.':rentalError(error)};
  reference=referenceSchema.parse(data);
 }catch(error){return reportFailure('booking.request',error);}
 revalidatePath('/account');redirect(`/booking/confirmation/${reference}`);
}
export async function cancelBooking(_previous:FormState,form:FormData):Promise<FormState>{
 const {user,supabase}=await requireAuthenticatedUser('/account/bookings');
 const parsed=referenceSchema.safeParse(form.get('reference'));
 if(!parsed.success||form.get('confirm')!=='yes')return {error:'Confirm that you want to withdraw this request.'};
 try{await assertSameOrigin();await enforceRateLimit('customer-booking-cancel',user.id);const {error}=await supabase.rpc('cancel_customer_booking',{p_reference:parsed.data});if(error)return {error:'This request cannot be withdrawn online. Refresh the booking or contact our team.'};}catch(error){return reportFailure('booking.cancel',error);}
 revalidatePath('/account','layout');return {success:'Your request has been cancelled. No payment was taken.'};
}
