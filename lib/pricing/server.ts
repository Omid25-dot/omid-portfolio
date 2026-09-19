import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { bookingInputSchema } from '@/lib/booking/contracts';

export const quoteSchema = z.object({ version:z.literal(1),timezone:z.literal('Europe/London'),end_exclusive:z.literal(true),days:z.number().int().positive(),daily_rate:z.number().int().nonnegative(),weekly_rate:z.number().int().nonnegative().nullable(),weekly_rule:z.literal('complete_weeks_lowest_total'),rental_subtotal:z.number().int().nonnegative(),delivery_fee:z.number().int().nonnegative(),service_fee:z.number().int().nonnegative(),discount_amount:z.literal(0),tax_amount:z.literal(0),tax_policy:z.literal('no_tax_configured'),security_deposit:z.number().int().nonnegative(),total_payable:z.number().int().nonnegative(),currency:z.literal('GBP') });
export type RentalQuote = z.infer<typeof quoteSchema>;
/** PostgreSQL is the single pricing implementation, reused inside atomic creation. */
export async function quoteRental(supabase:SupabaseClient, input:unknown) {
 const p=bookingInputSchema.parse(input);
 const {data,error}=await supabase.rpc('quote_rental',{p_equipment:p.equipment_id,p_start:p.start_date,p_end:p.end_date,p_method:p.fulfilment_method});
 if(error) throw error;
 return quoteSchema.parse(data);
}
