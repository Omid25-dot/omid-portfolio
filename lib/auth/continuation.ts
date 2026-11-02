import 'server-only';
import {cookies} from 'next/headers';
import {safeNext} from '@/lib/permissions/policy';
const name='rental-booking-intent';
export async function saveContinuation(value:unknown){
 const next=safeNext(value);
 if(next.startsWith('/booking/'))(await cookies()).set(name,next,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:3600});
}
export async function consumeContinuation(value?:unknown){
 const jar=await cookies();const next=safeNext(value??jar.get(name)?.value);jar.delete(name);return next;
}
