'use server';
import { z } from 'zod';
import { publicCatalogueClient } from '@/lib/catalogue/server';
import { availabilityResult,postcodeSchema } from '@/lib/catalogue/contracts';
import { bookingInputSchema,rentalError } from '@/lib/booking/contracts';
import { quoteSchema } from '@/lib/pricing/server';
import { assertSameOrigin } from '@/lib/security/origin';
import { enforceRateLimit } from '@/lib/rate-limit/server';
import { RateLimitError } from '@/lib/rate-limit/errors';
const inputSchema=bookingInputSchema.safeExtend({postcode:postcodeSchema.default('')});
export async function publicRentalEstimate(input:unknown){
 try {
  const p=inputSchema.parse(input);await assertSameOrigin();await enforceRateLimit('public-rental-estimate');
  const db=publicCatalogueClient();
  const a=await db.rpc('public_rental_availability',{p_equipment:p.equipment_id,p_start:p.start_date,p_end:p.end_date});
  if(a.error)return {error:rentalError(a.error)};
  const availability=availabilityResult.parse(a.data);
  if(!availability.available)return {availability};
  const q=await db.rpc('public_rental_quote',{p_equipment:p.equipment_id,p_start:p.start_date,p_end:p.end_date,p_method:p.fulfilment_method});
  if(q.error)return {availability,error:rentalError(q.error)};
  return {availability,quote:quoteSchema.parse(q.data)};
 }catch(error){return {error:error instanceof z.ZodError?'Choose valid hire dates and a UK postcode.':error instanceof RateLimitError?error.message:'We cannot check this hire right now. Please try again shortly.'};}
}
