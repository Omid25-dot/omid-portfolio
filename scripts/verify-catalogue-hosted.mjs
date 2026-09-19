import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
process.loadEnvFile('.env.local');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
async function rpc(name,args={}){const {data,error}=await db.rpc(name,args);assert.equal(error,null,`${name} failed`);return data;}
const all=await rpc('catalogue_search');assert.ok(all.total>=12);
for(const field of ['owner_id','ownership_type','commission','payout','internal_reference'])assert.ok(!JSON.stringify(all).includes(field));
assert.equal((await rpc('catalogue_search',{p_query:'JCB'})).items[0].slug,'jcb-3cx-backhoe-loader');
assert.ok((await rpc('catalogue_search',{p_category:'cleaning'})).items.every(i=>i.category.slug==='cleaning'));
assert.equal((await rpc('catalogue_search',{p_postcode:'SW1A 1AA'})).total,0);
const item=await rpc('catalogue_detail',{p_slug:'3t-mini-excavator'});
const dates={p_equipment:item.id,p_start:'2091-10-22',p_end:'2091-10-24'};
assert.equal((await rpc('public_rental_availability',dates)).available,true);
const quote=await rpc('public_rental_quote',{...dates,p_method:'collection'});assert.equal(quote.rental_subtotal,30000);assert.equal(quote.total_payable,80000);
assert.ok(!JSON.stringify(quote).includes('commission'));
assert.ok((await db.rpc('public_rental_quote',{...dates,p_method:'collection',total:1})).error);
for(const table of ['equipment','owners','audit_logs','platform_settings'])assert.ok((await db.from(table).select('*').limit(1)).error,table);
for(const equipment of all.items){const url=db.storage.from('equipment-public').getPublicUrl(equipment.images[0].path).data.publicUrl;const res=await fetch(url);assert.equal(res.status,200);assert.match(res.headers.get('content-type'),/image\/webp/);}
const privateList=await db.storage.from('inspection-private').list();assert.ok(privateList.error||privateList.data.length===0);
console.log('Hosted anonymous catalogue, filters, safe projections, quote, availability, private-table denial and 12 public images passed.');
