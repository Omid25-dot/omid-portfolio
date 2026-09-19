import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { periodSchema, hireDate } from '@/lib/booking/contracts';
export const availabilitySchema=z.object({available:z.boolean(),reason:z.enum(['not_available','operational_status','dates_blocked']).nullable(),periods:z.array(z.object({start_date:hireDate,end_date:hireDate,reason:z.enum(['reserved','availability_block'])}))});
export type RentalAvailability=z.infer<typeof availabilitySchema>;
export async function checkAvailability(supabase:SupabaseClient,input:unknown) {
 const p=periodSchema.parse(input);
 const {data,error}=await supabase.rpc('rental_availability',{p_equipment:p.equipment_id,p_start:p.start_date,p_end:p.end_date});
 if(error) throw error;
 return availabilitySchema.parse(data);
}
