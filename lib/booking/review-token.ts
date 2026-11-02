import {createHmac,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
const schema=z.object({user:z.uuid(),equipment:z.uuid(),slug:z.string().regex(/^[a-z0-9-]+$/),start:z.iso.date(),end:z.iso.date(),request:z.uuid(),expires:z.number().int(),quote:z.record(z.string(),z.unknown())}).strict();
export type Review=z.infer<typeof schema>;
const mac=(body:string,key:string)=>createHmac('sha256',key).update('booking-review:'+body).digest('hex');
export function signReview(value:Review,key:string){const body=Buffer.from(JSON.stringify(schema.parse(value))).toString('base64url');return `${body}.${mac(body,key)}`;}
export function readReview(value:string,key:string,user:string,now=Date.now()){
 if(value.length>12000)throw Error('Invalid review');const [body,signature,extra]=value.split('.');
 if(extra||!body||!signature||!/^[a-f0-9]{64}$/.test(signature)||!timingSafeEqual(Buffer.from(signature),Buffer.from(mac(body,key))))throw Error('Invalid review');
 const parsed=schema.parse(JSON.parse(Buffer.from(body,'base64url').toString()));
 if(parsed.user!==user||parsed.expires<=now)throw Error('Review expired');return parsed;
}
