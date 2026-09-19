import { z } from 'zod';
import { hireDate } from '@/lib/booking/contracts';
export const postcodeSchema=z.string().trim().toUpperCase().max(10).refine(v=>!v||/^[A-Z]{1,2}[0-9][A-Z0-9]?( ?[0-9][A-Z]{2})?$/.test(v),'Enter a UK postcode or outward code, such as G77.');
const emptyDate=z.union([z.literal(''),hireDate]).default('');
export const searchSchema=z.object({q:z.string().trim().max(100).default(''),category:z.string().max(120).regex(/^[a-z0-9-]*$/).default(''),postcode:postcodeSchema.default(''),start:emptyDate,end:emptyDate,min:z.coerce.number().min(0).max(100000).default(0),max:z.coerce.number().min(0).max(100000).default(100000),delivery:z.enum(['','1']).default(''),collection:z.enum(['','1']).default(''),available:z.enum(['','1']).default(''),page:z.coerce.number().int().min(1).max(10000).default(1)})
 .refine(v=>(!v.start&&!v.end)||(!!v.start&&!!v.end&&v.end>v.start),'Choose a start date and a later return date.')
 .refine(v=>v.max>=v.min,'Maximum price must be at least the minimum price.')
 .refine(v=>!v.available||!!v.start,'Choose dates to filter availability.');
export type SearchFilters=z.infer<typeof searchSchema>;
export type SearchParams=Record<string,string|string[]|undefined>;
export function scalarParams(p:SearchParams){return Object.fromEntries(Object.entries(p).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]).filter(([k,v])=>!(v===''&&['min','max','page'].includes(k!))));}
export const availabilityResult=z.object({available:z.boolean(),reason:z.string().nullable(),periods:z.array(z.object({start_date:hireDate,end_date:hireDate,reason:z.string()}))});
export const equipmentSchema=z.object({id:z.uuid(),slug:z.string(),title:z.string(),description:z.string(),daily_rate:z.number().int(),weekly_rate:z.number().int().nullable(),security_deposit:z.number().int(),verification_required:z.boolean(),delivery_eligible:z.boolean(),collection_eligible:z.boolean(),category:z.object({slug:z.string(),name:z.string()}),service_area:z.string(),is_demo:z.boolean(),details:z.object({included:z.array(z.string()).nullable(),requirements:z.array(z.string()).nullable(),operator:z.string().nullable(),cancellation:z.string().nullable()}),images:z.array(z.object({path:z.string(),alt:z.string()})),specifications:z.array(z.object({label:z.string(),value:z.union([z.string(),z.number(),z.boolean()]),unit:z.string().nullable()})),availability:availabilityResult.nullable()});
export type Equipment=z.infer<typeof equipmentSchema>;
export const categorySchema=z.object({slug:z.string(),name:z.string(),description:z.string()});
export type Category=z.infer<typeof categorySchema>;
export const catalogueSchema=z.object({total:z.number().int(),page:z.number().int(),page_size:z.number().int(),items:z.array(equipmentSchema)});
export function filterUrl(filters:Partial<SearchFilters>,path='/equipment'){
 const params=new URLSearchParams();for(const [key,value] of Object.entries(filters)) if(value!==undefined&&value!==''&&!(key==='page'&&value===1)&&!(key==='min'&&value===0)&&!(key==='max'&&value===100000)) params.set(key,String(value));
 return path+(params.size?`?${params}`:'');
}
export function imageUrl(path?:string){const base=process.env.NEXT_PUBLIC_SUPABASE_URL;if(!path||!base||!/^catalogue\/[a-zA-Z0-9/_-]+\.(webp|jpg|png|avif)$/.test(path))return '/images/equipment-placeholder.svg';return `${base}/storage/v1/object/public/equipment-public/${path}`;}
export const money=(pennies:number)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:pennies%100?2:0}).format(pennies/100);
