import { z } from 'zod';

export const bookingStatuses = ['REQUESTED','APPROVED','PAYMENT_PENDING','CONFIRMED','CHECKED_OUT','RETURNED','COMPLETED','DECLINED','CANCELLED','DISPUTED'] as const;
export type BookingStatus = typeof bookingStatuses[number];
export const hireDate = z.iso.date();
export const periodSchema = z.object({ equipment_id: z.uuid(), start_date: hireDate, end_date: hireDate }).strict()
 .refine(v => v.end_date > v.start_date, { message: 'The return date must be after the start date.', path: ['end_date'] });
export const bookingInputSchema = periodSchema.safeExtend({ fulfilment_method: z.enum(['collection','delivery']) });
export const transitionSchema = z.object({ booking_id: z.uuid(), status: z.enum(bookingStatuses), reason: z.string().trim().max(1000).optional() }).strict();
export const blockSchema = periodSchema.safeExtend({ type: z.enum(['maintenance','servicing','repair','internal_use','unavailable','manual_block']), reason: z.string().trim().min(1).max(1000) });
export const bookingColumns = 'id,reference,equipment_id,customer_id,start_date,end_date,status,fulfilment_method,delivery_postcode,delivery_address,currency,rental_subtotal,delivery_fee,service_fee,discount_amount,security_deposit,total_payable,hold_expires_at,created_at,updated_at' as const;
export const customerBookingSchema = z.object({
 id:z.uuid(), reference:z.string(), equipment_id:z.uuid(), customer_id:z.uuid(), start_date:hireDate,end_date:hireDate,
 status:z.enum(bookingStatuses), fulfilment_method:z.enum(['collection','delivery']),delivery_postcode:z.string().nullable(),delivery_address:z.record(z.string(),z.unknown()).nullable(),
 currency:z.literal('GBP'),rental_subtotal:z.number().int().nonnegative(),delivery_fee:z.number().int().nonnegative(),service_fee:z.number().int().nonnegative(),discount_amount:z.number().int().nonnegative(),security_deposit:z.number().int().nonnegative(),total_payable:z.number().int().nonnegative(),
 hold_expires_at:z.string().nullable(),created_at:z.string(),updated_at:z.string(),
});
export type CustomerBooking = z.infer<typeof customerBookingSchema>;
export type RentalResult<T> = { ok:true; data:T } | { ok:false; error:string };

export function rentalError(error: {code?:string;message?:string}): string {
 if (error.code==='23P01') return 'Unfortunately this equipment was just booked or blocked for those dates. Please choose different dates.';
 if (error.code==='42501') return 'You do not have permission to perform this action.';
 if (error.message==='DELIVERY_QUOTE_REQUIRED') return 'Delivery needs a confirmed delivery rule or manual quote before booking.';
 if (error.message==='RENTAL_CONFIGURATION_REQUIRED') return 'Hire pricing is not configured. Please contact the rental team.';
 if (error.message==='INTEGRATION_REQUIRED') return 'This transition requires a verified payment or completed inspection integration.';
 if (error.message==='Rate limit exceeded') return 'Too many requests. Please wait 15 minutes before trying again.';
 if (['22023','23514'].includes(error.code ?? '')) return 'Check the dates, fulfilment method and permitted booking transition.';
 return 'We could not complete this rental request. Please try again later.';
}
