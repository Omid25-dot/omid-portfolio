// Explicit opt-in development-only live verification. No secret/user identifiers are printed.
// Creates isolated marked fixtures, uses real authenticated RPCs and removes fixtures in finally.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile('.env.local');
if (process.env.LIVE_RENTAL_VERIFY !== 'rentora-dev') throw new Error('Set LIVE_RENTAL_VERIFY=rentora-dev explicitly');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname.split('.')[0],readFileSync('supabase/.temp/project-ref','utf8').trim(),'Linked target differs');
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,options);
const anon=()=>createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,options);
const ids={category:randomUUID(),area:randomUUID(),location:randomUUID(),owner:randomUUID(),equipment:randomUUID(),raceEquipment:randomUUID()};
const users=[]; const clients=[]; const suffix=randomUUID();
function must(result){if(result.error) throw new Error(`Hosted operation failed (${result.error.code??'unknown'})`); return result.data;}
const insert=async(table,row)=>must(await admin.from(table).insert(row));
const pass=(name)=>console.log(`PASS ${name}`);
const args=(start='2091-09-22',end='2091-09-24',equipment=ids.equipment)=>({p_equipment:equipment,p_start:start,p_end:end,p_method:'collection'});
try {
 await insert('categories',{id:ids.category,name:'Phase 2 verification',slug:`verify-${suffix}`,active:true,is_demo:true});
 await insert('service_areas',{id:ids.area,name:'Phase 2 verification',slug:`verify-${suffix}`,active:true,is_demo:true});
 await insert('locations',{id:ids.location,service_area_id:ids.area,name:'Phase 2 verification',reference:`verify-${suffix}`,postcode:'G1 1AA',active:true,collection_available:true,is_demo:true});
 await insert('owners',{id:ids.owner,owner_type:'company',company_name:'Phase 2 verification',contact_name:'Disposable fixture',email:'fixture@example.invalid',active:true,commission_bps:1500,is_demo:true});
 for(const id of [ids.equipment,ids.raceEquipment]) await insert('equipment',{id,title:'Phase 2 verification',slug:`verify-${id}`,category_id:ids.category,base_location_id:ids.location,daily_rate:15000,weekly_rate:75000,security_deposit:50000,collection_eligible:true,ownership_type:'THIRD_PARTY',owner_id:ids.owner,operational_status:'AVAILABLE',listed:true,is_demo:true});
 for(let i=0;i<3;i++) {
  const password=`Verify!${randomBytes(24).toString('base64url')}`;
  const email=`rental-${randomUUID()}@example.invalid`;
  const u=must(await admin.auth.admin.createUser({email,password,email_confirm:true})).user; users.push(u.id);
  const c=anon();must(await c.auth.signInWithPassword({email,password}));clients.push(c);
 }
 must(await admin.from('profiles').update({role:'admin'}).eq('id',users[2]));
 const [a,b,operator]=clients;
 const q=must(await a.rpc('quote_rental',args()));assert.equal(q.days,2);assert.equal(q.rental_subtotal,30000);assert.equal(q.total_payable,80000);assert.equal(q.owner_id,undefined);pass('hosted pricing and safe quote');
 const race=await Promise.all([a,b,a,b].map(c=>c.rpc('create_rental_booking',args())));
 assert.equal(race.filter(r=>!r.error).length,1);assert.ok(race.filter(r=>r.error).every(r=>r.error.code==='23P01'));pass('four simultaneous overlapping attempts produce exactly one reservation');
 const winner=race.find(r=>!r.error).data;
 const stored=must(await admin.from('bookings').select('*').eq('id',winner).single());
 assert.equal(stored.commission_bps_snapshot,1500);assert.equal(stored.commission_amount_snapshot,4500);assert.equal(stored.owner_net_snapshot,25500);
 const owning=stored.customer_id===users[0]?a:b;const stranger=stored.customer_id===users[0]?b:a;
 assert.equal(must(await stranger.from('bookings').select('id').eq('id',winner)).length,0);
 assert.equal(must(await stranger.from('booking_status_history').select('id').eq('booking_id',winner)).length,0);
 for(const c of [a,b,operator]) for(const field of ['owner_id_snapshot','commission_bps_snapshot','pricing_snapshot']) assert.ok((await c.from('bookings').select(field)).error);
 assert.ok((await owning.from('bookings').update({total_payable:1}).eq('id',winner)).error);
 assert.ok((await owning.rpc('transition_rental_booking',{p_booking:winner,p_status:'APPROVED'})).error);
 assert.ok((await anon().from('bookings').select('id')).error);
 pass('hosted RLS, column privacy, financial and transition denial');
 must(await b.rpc('create_rental_booking',args('2091-09-24','2091-09-26')));pass('exclusive-end adjacent booking accepted');
 must(await admin.from('equipment').update({daily_rate:19000,commission_override_bps:2000}).eq('id',ids.equipment));
 const unchanged=must(await admin.from('bookings').select('rental_subtotal,commission_bps_snapshot').eq('id',winner).single());assert.equal(unchanged.rental_subtotal,30000);assert.equal(unchanged.commission_bps_snapshot,1500);
 assert.ok((await admin.from('bookings').update({rental_subtotal:1}).eq('id',winner)).error);pass('hosted immutable snapshots survive equipment changes');
 assert.ok((await operator.rpc('transition_rental_booking',{p_booking:winner,p_status:'RETURNED'})).error);
 must(await operator.rpc('transition_rental_booking',{p_booking:winner,p_status:'APPROVED'}));
 const history=must(await owning.from('booking_status_history').select('new_status').eq('booking_id',winner));assert.equal(history.length,2);
 const audit=must(await admin.from('audit_logs').select('actor_id,action,resource_id').eq('resource_id',winner));assert.equal(audit.length,2);assert.ok(audit.some(row=>row.actor_id===users[2]&&row.action==='booking.status_changed'));pass('hosted transition, history and audit');
 must(await operator.rpc('create_availability_block',{p_equipment:ids.equipment,p_start:'2091-09-23',p_end:'2091-09-24',p_type:'maintenance',p_reason:'Phase 2 verification'}));
 assert.equal(must(await operator.from('booking_availability_conflicts').select('*').eq('booking_id',winner)).length,1);
 assert.equal(must(await owning.from('booking_availability_conflicts').select('*')).length,0);pass('maintenance flags conflict without exposing internal blocks');
 // Race different write paths on a fresh asset: block always persists; if booking wins it is flagged.
 const cross=await Promise.all([
  a.rpc('create_rental_booking',args('2091-11-01','2091-11-03',ids.raceEquipment)),
  operator.rpc('create_availability_block',{p_equipment:ids.raceEquipment,p_start:'2091-11-01',p_end:'2091-11-03',p_type:'repair',p_reason:'Race verification'}),
 ]);
 must(cross[1]);
 if(cross[0].error) assert.equal(cross[0].error.code,'23P01');
 else assert.equal(must(await operator.from('booking_availability_conflicts').select('*').eq('booking_id',cross[0].data)).length,1);
 const later=await b.rpc('create_rental_booking',args('2091-11-01','2091-11-03',ids.raceEquipment));assert.equal(later.error?.code,'23P01');
 pass('booking-versus-maintenance race preserves block and flags any earlier booking');
 must(await admin.from('equipment').update({operational_status:'MAINTENANCE'}).eq('id',ids.equipment));
 assert.equal(must(await operator.from('booking_availability_conflicts').select('*').eq('booking_id',winner).eq('reason','operational_status')).length,1);
 assert.equal(must(await owning.from('booking_availability_conflicts').select('*')).length,0);
 pass('equipment-wide maintenance flags bookings privately without cancellation');
} finally {
 // Remove only fixtures created in this run; retain redacted audit history as evidence.
 const eq=[ids.equipment,ids.raceEquipment];
 const found=must(await admin.from('bookings').select('id').in('equipment_id',eq));
 if(found.length) {must(await admin.from('booking_status_history').delete().in('booking_id',found.map(r=>r.id)));must(await admin.from('bookings').delete().in('id',found.map(r=>r.id)));}
 must(await admin.from('availability_blocks').delete().in('equipment_id',eq));
 must(await admin.from('equipment').delete().in('id',eq));
 for(const [table,id] of [['owners',ids.owner],['locations',ids.location],['service_areas',ids.area],['categories',ids.category]]) must(await admin.from(table).delete().eq('id',id));
 for(const id of users) must(await admin.auth.admin.deleteUser(id));
 pass('isolated hosted fixtures removed');
}
