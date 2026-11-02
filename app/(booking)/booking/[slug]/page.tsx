import Link from 'next/link';
import {notFound} from 'next/navigation';
import {randomUUID} from 'node:crypto';
import {requireAuthenticatedUser} from '@/lib/permissions/server';
import {getEquipment} from '@/lib/catalogue/server';
import {imageUrl} from '@/lib/catalogue/contracts';
import {intentSchema,collectionSchema,ukDate} from '@/lib/booking/customer';
import {quoteRental} from '@/lib/pricing/server';
import {checkAvailability} from '@/lib/availability/server';
import {signReview} from '@/lib/booking/review-token';
import {serverSecret} from '@/lib/config/server';
import {EquipmentImage} from '@/components/catalogue/equipment-image';
import {AmountSummary} from '@/components/booking/customer-view';
import {ActionForm} from '@/components/auth/forms';
import {requestBooking} from '@/services/customer-booking-actions';
export default async function BookingReview({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {slug}=await params;const search=await searchParams;
 const parsed=intentSchema.safeParse({start:search.start,end:search.end,method:search.method??'collection'});
 const next=parsed.success?`/booking/${slug}?${new URLSearchParams(parsed.data)}`:`/booking/${slug}`;
 const {user,profile,supabase}=await requireAuthenticatedUser(next);
 const item=await getEquipment(slug);if(!item)notFound();
 if(!parsed.success)return <><h1>Choose your hire dates</h1><p>Return to the equipment page for a fresh collection quote. Delivery booking is not available yet.</p><Link className="button" href={`/equipment/${slug}`}>Choose dates</Link></>;
 const p=parsed.data;const input={equipment_id:item.id,start_date:p.start,end_date:p.end,fulfilment_method:'collection'};
 let quote,collection;
 try{const available=await checkAvailability(supabase,{equipment_id:item.id,start_date:p.start,end_date:p.end});if(!available.available)throw Error('Unavailable');quote=await quoteRental(supabase,input);const result=await supabase.rpc('booking_collection_info',{p_equipment:item.id});if(result.error)throw result.error;collection=collectionSchema.parse(result.data);}catch{return <><h1>We cannot offer these dates right now</h1><p>The equipment may no longer be available, or the quote service is temporarily unavailable. No booking has been created.</p><Link className="button" href={`/equipment/${slug}`}>Check dates again</Link></>;}
 if(profile.account_status!=='active')return <><h1>Contact the team to request a booking</h1><p>Your account cannot create new requests at the moment.</p><Link href="/help">Get help</Link></>;
 // A fresh, expiring review is issued on each authenticated server request.
 // eslint-disable-next-line react-hooks/purity
 const review=signReview({user:user.id,equipment:item.id,slug,start:p.start,end:p.end,request:randomUUID(),quote,expires:Date.now()+15*60*1000},serverSecret('SECURITY_HMAC_SECRET'));
 return <><Link className="text-link" href={`/equipment/${slug}?start=${p.start}&end=${p.end}`}>← Back to equipment</Link><header className="booking-heading"><span className="eyebrow">Dates selected / Review your request</span><h1>One last look before you request.</h1><p>No payment today. Your hire is only confirmed after the required review, verification and payment steps.</p></header><div className="customer-booking-grid"><section><div className="review-equipment"><div className="booking-thumb"><EquipmentImage src={imageUrl(item.images[0]?.path)} alt={item.title} sizes="200px"/></div><div><h2>{item.title}</h2><p>{ukDate(p.start)} – {ukDate(p.end)} · {quote.days} hire days</p><p>Return date is exclusive</p></div></div><section className="review-section"><h2>Collect from our depot</h2><p>{collection.name} · {collection.city} · {collection.postcode}</p><p>{collection.is_demo?'Demo location only. Do not travel to this address.':'Confirm the exact address and collection time with our team before travelling.'}</p><p>Delivery booking coming soon. This request is for collection only.</p></section><section className="review-section"><h2>Your contact details</h2><p>Signed in as {user.email}. We will save these contact details to your profile.</p><ActionForm action={requestBooking} hidden={{review,next}} label="Request booking — no payment today" fields={[{name:'first_name',label:'First name',autoComplete:'given-name',defaultValue:profile.first_name},{name:'last_name',label:'Last name',autoComplete:'family-name',defaultValue:profile.last_name},{name:'phone',label:'Phone number',type:'tel',autoComplete:'tel',defaultValue:profile.phone}]} confirmation="I understand this is an unpaid request with a temporary hold, not a confirmed hire. Final rental and cancellation terms must be agreed before hire."/></section><section className="review-section"><h2>Hire requirements</h2><ul>{item.details.requirements?.map(r=><li key={r}>{r}</li>)}</ul><p>{item.details.operator}</p>{item.verification_required&&<p><strong>ID verification required before confirmed hire.</strong> Verification is not available in this phase. No identity documents are collected here.</p>}<p>{item.details.cancellation}</p><Link href="/policies">Read the current policy information</Link></section></section><aside className="review-summary"><h2>Your hire quote</h2><AmountSummary value={quote}/><p className="notice">Due now: £0. No payment or deposit authorisation is taken.</p><p>Prices and availability are checked again when you submit. This review expires after 15 minutes; the request itself has a separately configured temporary hold.</p></aside></div></>;
}
