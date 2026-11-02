import {z} from 'zod';
import {bookingStatuses,hireDate} from './contracts';
export const referenceSchema=z.string().regex(/^RNT-[A-F0-9]{32}$/);
export const intentSchema=z.object({start:hireDate,end:hireDate,method:z.literal('collection').default('collection')}).strict().refine(v=>v.end>v.start,'Choose a later return date.');
export const contactSchema=z.object({first_name:z.string().trim().min(1).max(80),last_name:z.string().trim().min(1).max(80),phone:z.string().trim().min(5).max(30).regex(/^[+\d ()-]+$/)}).strict();
export const collectionSchema=z.object({name:z.string(),postcode:z.string(),city:z.string(),is_demo:z.boolean()});
export const bookingViewSchema=z.object({reference:referenceSchema,days:z.number().int().positive(),start_date:hireDate,end_date:hireDate,status:z.enum(bookingStatuses),fulfilment_method:z.enum(['collection','delivery']),rental_subtotal:z.number().int(),delivery_fee:z.number().int(),service_fee:z.number().int(),security_deposit:z.number().int(),total_payable:z.number().int(),hold_expires_at:z.string().nullable(),created_at:z.string(),title:z.string(),image:z.string().nullable(),collection:collectionSchema.nullable(),verification_required:z.boolean(),history:z.array(z.object({status:z.enum(bookingStatuses),at:z.string()}))});
export type BookingView=z.infer<typeof bookingViewSchema>;
export const statusLabels:Record<BookingView['status'],string>={REQUESTED:'Booking requested',APPROVED:'Approved',PAYMENT_PENDING:'Payment required',CONFIRMED:'Confirmed',CHECKED_OUT:'On hire',RETURNED:'Returned',COMPLETED:'Completed',CANCELLED:'Cancelled',DECLINED:'Declined',DISPUTED:'Issue being reviewed'};
export const ukDate=(date:string)=>`${date.slice(8,10)}/${date.slice(5,7)}/${date.slice(0,4)}`;
export const ukTime=(date:string)=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(new Date(date));
export const holdExpired=(b:BookingView,now=Date.now())=>['REQUESTED','APPROVED','PAYMENT_PENDING'].includes(b.status)&&!!b.hold_expires_at&&Date.parse(b.hold_expires_at)<=now;
export function bookingGroup(b:BookingView){if(holdExpired(b)||['CANCELLED','DECLINED'].includes(b.status))return 'Cancelled / expired';if(['CHECKED_OUT','DISPUTED'].includes(b.status))return 'Active';if(['RETURNED','COMPLETED'].includes(b.status))return 'Past';return 'Upcoming requests';}
