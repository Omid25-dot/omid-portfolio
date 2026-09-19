import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';

test('rental domain executes actual SQL, RLS and reservation constraints',async t=>{
 const db=new PGlite({extensions:{btree_gist}});
 await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;`);
 await db.exec(await readFile('tests/fixtures/storage.sql','utf8'));
 for(const f of (await readdir('database/migrations')).filter(f=>f.endsWith('.sql')).sort()) await db.exec(await readFile(`database/migrations/${f}`,'utf8'));
 await db.exec(await readFile('database/seed/development.sql','utf8'));
 await db.exec(await readFile('database/seed/phase2-development.sql','utf8'));
 const customer=crypto.randomUUID(),other=crypto.randomUUID(),staff=crypto.randomUUID(),admin=crypto.randomUUID(),asset=crypto.randomUUID();
 for(const id of [customer,other,staff,admin]) await db.query('insert into auth.users values($1)',[id]);
 await db.query("update public.profiles set role='staff' where id=$1",[staff]);
 await db.query("update public.profiles set role='admin' where id=$1",[admin]);
 await db.exec("update public.locations set active=true,collection_available=true; update public.owners set active=true");
 await db.query(`insert into public.equipment(id,title,slug,category_id,daily_rate,weekly_rate,security_deposit,collection_eligible,ownership_type,owner_id,operational_status,base_location_id,listed)
 select $1,'Test rental','test-rental',id,15000,75000,50000,true,'THIRD_PARTY','10000000-0000-4000-8000-000000000003','AVAILABLE','10000000-0000-4000-8000-000000000002',true from public.categories limit 1`,[asset]);
 async function user<T=Record<string,unknown>>(id:string,sql:string,params:unknown[]=[]){
  await db.exec('begin; set local role authenticated');
  try {await db.query("select set_config('request.jwt.claim.sub',$1,true)",[id]); const r=await db.query<T>(sql,params);await db.exec('commit');return r.rows;}
  catch(e){await db.exec('rollback');throw e;}
 }
 const quote=async(start='2090-09-22',end='2090-09-24')=>(await user<{q:Record<string,unknown>}>(customer,"select public.quote_rental($1,$2,$3,'collection') q",[asset,start,end]))[0].q;
 const create=async(id=customer,start='2090-09-22',end='2090-09-24')=>(await user<{id:string}>(id,"select public.create_rental_booking($1,$2,$3,'collection') id",[asset,start,end]))[0].id;
 let booking:string;
 await t.test('complete state graph rejects unknown, terminal and skipped transitions',async()=>{
  const graph:Record<string,string[]>={REQUESTED:['APPROVED','DECLINED','CANCELLED'],APPROVED:['PAYMENT_PENDING','CANCELLED'],PAYMENT_PENDING:['CONFIRMED','CANCELLED'],CONFIRMED:['CHECKED_OUT','CANCELLED','DISPUTED'],CHECKED_OUT:['RETURNED','DISPUTED'],RETURNED:['COMPLETED','DISPUTED'],COMPLETED:['DISPUTED'],DISPUTED:['CONFIRMED','CHECKED_OUT','RETURNED','COMPLETED'],DECLINED:[],CANCELLED:[]};
  for(const from of [...Object.keys(graph),'UNKNOWN']) for(const to of [...Object.keys(graph),'UNKNOWN']) {
   const result=await db.query<{allowed:boolean}>('select private.booking_transition_allowed($1,$2) allowed',[from,to]);
   assert.equal(result.rows[0].allowed,graph[from]?.includes(to)??false,`${from} -> ${to}`);
  }
 });
 await t.test('two-day, weekly, zero deposit commission and safe projection',async()=>{
  const q=await quote(); assert.equal(q.days,2);assert.equal(q.rental_subtotal,30000);assert.equal(q.total_payable,80000);
  for(const field of ['owner_id','ownership_type','commission_bps','commission_amount','owner_net']) assert.ok(!(field in q));
  assert.equal((await quote('2090-09-01','2090-09-09')).rental_subtotal,90000);
  await db.query('update public.equipment set weekly_rate=200000 where id=$1',[asset]);
  assert.equal((await quote('2090-09-01','2090-09-09')).rental_subtotal,120000);
  await db.query('update public.equipment set weekly_rate=75000 where id=$1',[asset]);
 });
 await t.test('invalid dates, unconfigured delivery and missing policies fail closed',async()=>{
  for(const dates of [['2090-09-22','2090-09-22'],['2090-09-24','2090-09-22'],['2000-01-01','2000-01-02'],['2090-01-01','2092-01-01']]) await assert.rejects(quote(...dates as [string,string]));
  await assert.rejects(user(customer,"select public.create_rental_booking($1,'2090-09-22','2090-09-24','delivery')",[asset]),/DELIVERY_QUOTE_REQUIRED/);
  await db.exec("update public.platform_settings set value='null' where key='rental_service_fee'");
  await assert.rejects(quote(),/RENTAL_CONFIGURATION_REQUIRED/);
  await db.exec("update public.platform_settings set value='0' where key='rental_service_fee'");
 });
 await t.test('operational state and maintenance overlap deny booking',async()=>{
  for(const status of ['MAINTENANCE','UNAVAILABLE']) {await db.query('update public.equipment set operational_status=$1 where id=$2',[status,asset]);await assert.rejects(create(),/UNAVAILABLE/);}
  await db.query("update public.equipment set operational_status='AVAILABLE' where id=$1",[asset]);
  await user(staff,"select public.create_availability_block($1,'2090-10-01','2090-10-03','maintenance','Test maintenance')",[asset]);
  await assert.rejects(create(customer,'2090-10-02','2090-10-04'),/UNAVAILABLE/);
  const a=await user<{a:{available:boolean;periods:unknown[]}}>(customer,"select public.rental_availability($1,'2090-10-02','2090-10-04') a",[asset]);assert.equal(a[0].a.available,false);assert.equal(a[0].a.periods.length,1);
 });
 await t.test('atomic booking snapshot, collision and adjacent hires',async()=>{
  booking=await create();
  const b=(await db.query<{commission_bps_snapshot:number;commission_amount_snapshot:number;owner_net_snapshot:number;reference:string}>('select * from public.bookings where id=$1',[booking])).rows[0];
  assert.equal(b.commission_bps_snapshot,1500);assert.equal(b.commission_amount_snapshot,4500);assert.equal(b.owner_net_snapshot,25500);assert.match(b.reference,/^RNT-[A-F0-9]{32}$/);
  await assert.rejects(create(other),/UNAVAILABLE/);
  // Bypass the RPC precheck as a trusted fixture writer: the exclusion constraint itself must reject overlap.
  await assert.rejects(db.query(`insert into public.bookings(equipment_id,customer_id,start_date,end_date,fulfilment_method,currency,rental_subtotal,delivery_fee,service_fee,security_deposit,total_payable,ownership_type_snapshot,owner_id_snapshot,commission_bps_snapshot,commission_amount_snapshot,owner_net_snapshot,pricing_snapshot,hold_expires_at)
   select equipment_id,customer_id,start_date,end_date,fulfilment_method,currency,rental_subtotal,delivery_fee,service_fee,security_deposit,total_payable,ownership_type_snapshot,owner_id_snapshot,commission_bps_snapshot,commission_amount_snapshot,owner_net_snapshot,pricing_snapshot,hold_expires_at from public.bookings where id=$1`,[booking]),/bookings_no_overlap/);
  await create(other,'2090-09-24','2090-09-26');
  const history=await user(customer,'select new_status from public.booking_status_history where booking_id=$1',[booking]);assert.equal(history.length,1);assert.equal(history[0].new_status,'REQUESTED');
 });
 await t.test('financial and owner columns private; cross-customer data isolated',async()=>{
  assert.equal((await user(other,'select id from public.bookings where id=$1',[booking])).length,0);
  assert.equal((await user(other,'select id from public.booking_status_history where booking_id=$1',[booking])).length,0);
  for(const field of ['owner_id_snapshot','ownership_type_snapshot','commission_bps_snapshot','commission_amount_snapshot','owner_net_snapshot','pricing_snapshot']) await assert.rejects(user(customer,`select ${field} from public.bookings`));
  await assert.rejects(user(customer,'select * from public.bookings'));
  await assert.rejects(user(customer,'update public.bookings set total_payable=1 where id=$1',[booking]));
  await assert.rejects(user(customer,"select public.transition_rental_booking($1,'APPROVED')",[booking]));
  await assert.rejects(user(customer,"select private.rental_quote($1,'2090-09-01','2090-09-02','collection')",[asset]));
 });
 await t.test('commission precedence and historic immutability',async()=>{
  await db.exec("update public.owners set commission_bps=null; update public.platform_settings set value='2000' where key='default_commission_bps'");
  let q=(await db.query<{q:{commission_bps:number}}>("select private.rental_quote($1,'2090-11-01','2090-11-04','collection') q",[asset])).rows[0].q;assert.equal(q.commission_bps,2000);
  await db.exec('update public.owners set commission_bps=1800');
  q=(await db.query<{q:{commission_bps:number}}>("select private.rental_quote($1,'2090-11-01','2090-11-04','collection') q",[asset])).rows[0].q;assert.equal(q.commission_bps,1800);
  await db.query('update public.equipment set commission_override_bps=0,daily_rate=16000 where id=$1',[asset]);
  q=(await db.query<{q:{commission_bps:number}}>("select private.rental_quote($1,'2090-11-01','2090-11-04','collection') q",[asset])).rows[0].q;assert.equal(q.commission_bps,0);
  const historic=(await db.query<{rental_subtotal:number;commission_bps_snapshot:number}>('select * from public.bookings where id=$1',[booking])).rows[0];assert.equal(historic.rental_subtotal,30000);assert.equal(historic.commission_bps_snapshot,1500);
  await assert.rejects(db.query('update public.bookings set rental_subtotal=1 where id=$1',[booking]),/immutable/);
 });
 await t.test('state transitions create history and audit; future integrations cannot be faked',async()=>{
  await assert.rejects(user(staff,"select public.transition_rental_booking($1,'RETURNED')",[booking]),/Invalid/);
  await user(staff,"select public.transition_rental_booking($1,'APPROVED')",[booking]);
  await user(staff,"select public.transition_rental_booking($1,'PAYMENT_PENDING')",[booking]);
  await assert.rejects(user(admin,"select public.transition_rental_booking($1,'CONFIRMED')",[booking]),/INTEGRATION_REQUIRED/);
  assert.equal((await user(customer,'select id from public.booking_status_history where booking_id=$1',[booking])).length,3);
  assert.equal((await db.query('select id from public.audit_logs where resource_id=$1',[booking])).rows.length,3);
 });
 await t.test('maintenance preserves existing booking and exposes operational conflict only',async()=>{
  await user(staff,"select public.create_availability_block($1,'2090-09-23','2090-09-24','repair','Repair conflict')",[asset]);
  assert.equal((await user(staff,'select * from public.booking_availability_conflicts where booking_id=$1',[booking])).length,1);
  assert.equal((await user(customer,'select * from public.booking_availability_conflicts')).length,0);
  const state=await user(customer,'select status from public.bookings where id=$1',[booking]);assert.equal(state[0].status,'PAYMENT_PENDING');
 });
 await t.test('cancel releases capacity, hold expiry releases capacity and records history',async()=>{
  await db.query("update public.equipment set operational_status='MAINTENANCE' where id=$1",[asset]);
  assert.ok((await user(staff,"select * from public.booking_availability_conflicts where booking_id=$1 and reason='operational_status'",[booking])).length===1);
  assert.equal((await user(customer,'select * from public.booking_availability_conflicts')).length,0);
  await db.query("update public.equipment set operational_status='AVAILABLE' where id=$1",[asset]);
  await user(admin,"select public.transition_rental_booking($1,'CANCELLED','Test cancellation')",[booking]);
  await db.query("update public.bookings set hold_expires_at=now()-interval '1 minute' where customer_id=$1",[other]);
  await create(customer,'2090-09-24','2090-09-26');
  assert.equal((await db.query("select id from public.bookings where customer_id=$1 and status='CANCELLED'",[other])).rows.length,1);
 });
 await t.test('company-owned hire has no third-party obligation',async()=>{
  await db.query("update public.equipment set ownership_type='COMPANY',owner_id=null,commission_override_bps=null where id=$1",[asset]);
  const id=await create(customer,'2090-12-01','2090-12-03');
  const row=(await db.query<{owner_id_snapshot:string|null;owner_net_snapshot:number;commission_bps_snapshot:number|null}>('select * from public.bookings where id=$1',[id])).rows[0];
  assert.equal(row.owner_id_snapshot,null);assert.equal(row.owner_net_snapshot,0);assert.equal(row.commission_bps_snapshot,null);
 });
 await t.test('audit failure rolls back reservation, booking and history together',async()=>{
  await db.exec(`create function private.fail_rental_audit() returns trigger language plpgsql as $$ begin raise exception 'Test audit failure'; end $$;
   create trigger fail_rental_audit before insert on public.audit_logs for each row execute function private.fail_rental_audit();`);
  await assert.rejects(create(other,'2091-01-01','2091-01-03'),/Test audit failure/);
  assert.equal((await db.query("select id from public.bookings where start_date='2091-01-01'")).rows.length,0);
  await db.exec('drop trigger fail_rental_audit on public.audit_logs; drop function private.fail_rental_audit()');
  await create(other,'2091-01-01','2091-01-03');
 });
 await db.close();
});
