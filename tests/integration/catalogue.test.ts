import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {btree_gist} from '@electric-sql/pglite/contrib/btree_gist';
import {catalogueSchema} from '../../lib/catalogue/contracts';
test('public catalogue executes against the real migrations with anonymous privileges',async t=>{
 const db=new PGlite({extensions:{btree_gist}});
 await db.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;
 create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
 await db.exec(await readFile('tests/fixtures/storage.sql','utf8'));
 for(const file of (await readdir('database/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(`database/migrations/${file}`,'utf8'));
 for(const file of ['development.sql','phase2-development.sql','phase3-development.sql'])await db.exec(await readFile(`database/seed/${file}`,'utf8'));
 async function anon<T=Record<string,unknown>>(sql:string,params:unknown[]=[]){await db.exec('begin;set local role anon');try{const r=await db.query<T>(sql,params);await db.exec('commit');return r.rows;}catch(e){await db.exec('rollback');throw e;}}
 const search=async(sql="select public.catalogue_search() data",params:unknown[]=[])=>((await anon<{data:{total:number;items:Record<string,unknown>[]}}>(sql,params))[0].data);
 const asset=(await db.query<{id:string}>("select id from public.equipment where slug='3t-mini-excavator'")).rows[0].id;
 const actor=crypto.randomUUID();await db.query('insert into auth.users values($1)',[actor]);
 await t.test('anonymous catalogue, slug detail, categories and keyword work with no ownership leakage',async()=>{
  const result=await search();assert.equal(result.total,12);catalogueSchema.parse(result);
  const forbidden=['owner_id','ownership_type','commission','payout','internal_reference','Catalogue demo owner'];
  for(const key of forbidden)assert.ok(!JSON.stringify(result).includes(key),key);
  assert.equal((await search("select public.catalogue_search(p_category=>'cleaning') data")).total,2);
  assert.equal((await search("select public.catalogue_search(p_query=>'excavator') data")).total,2);
  assert.equal((await search("select public.catalogue_search(p_query=>'not-a-machine') data")).total,0);
  assert.equal((await search("select public.catalogue_search(p_postcode=>'G77') data")).total,12);
  assert.equal((await search("select public.catalogue_search(p_postcode=>'SW1A 1AA') data")).total,0);
  const row=await anon<{data:{title:string;specifications:unknown[]}}>("select public.catalogue_detail('3t-mini-excavator') data");assert.equal(row[0].data.title,'3T Mini Excavator');assert.ok(row[0].data.specifications.length>0);
  assert.equal((await anon<{data:unknown}>("select public.catalogue_detail('missing-slug') data"))[0].data,null);
 });
 await t.test('hidden, archived and operationally unavailable equipment excluded',async()=>{
  await db.query('update public.equipment set listed=false where id=$1',[asset]);assert.equal((await search()).total,11);
  assert.equal((await anon<{data:unknown}>("select public.catalogue_detail('3t-mini-excavator') data"))[0].data,null);
  await db.query("update public.equipment set listed=true,operational_status='MAINTENANCE' where id=$1",[asset]);assert.equal((await search()).total,11);
  await db.query("update public.equipment set operational_status='AVAILABLE' where id=$1",[asset]);
  await assert.rejects(anon('select * from public.equipment'));await assert.rejects(anon('select * from public.owners'));await assert.rejects(anon('select * from public.platform_settings'));
  await assert.rejects(anon("select private.catalogue_item($1)",[asset]));
 });
 await t.test('date filters and anonymous availability use Phase 2 blocks',async()=>{
  await db.query("insert into public.availability_blocks(equipment_id,start_date,end_date,type,reason,created_by) values($1,'2091-09-22','2091-09-24','maintenance','PRIVATE NOTE',$2)",[asset,actor]);
  const result=await search("select public.catalogue_search(p_query=>'3T Mini',p_start=>'2091-09-22',p_end=>'2091-09-24',p_available=>true) data");assert.equal(result.total,0);
  assert.equal((await search("select public.catalogue_search(p_query=>'3T Mini',p_start=>'2091-09-24',p_end=>'2091-09-26',p_available=>true) data")).total,1);
  const availability=await anon<{data:{available:boolean}}>("select public.public_rental_availability($1,'2091-09-22','2091-09-24') data",[asset]);assert.equal(availability[0].data.available,false);assert.ok(!JSON.stringify(availability).includes('PRIVATE NOTE'));
 });
 await t.test('anonymous quote uses authoritative Phase 2 pennies and cannot accept a client total',async()=>{
  const q=(await anon<{data:{total_payable:number;rental_subtotal:number}}>("select public.public_rental_quote($1,'2091-10-22','2091-10-24','collection') data",[asset]))[0].data;assert.equal(q.rental_subtotal,30000);assert.equal(q.total_payable,80000);assert.ok(!JSON.stringify(q).includes('commission'));
  await assert.rejects(anon("select public.public_rental_quote($1,'2091-10-22','2091-10-24','collection',1)",[asset]));
  await assert.rejects(anon("select public.create_rental_booking($1,'2091-10-22','2091-10-24','collection')",[asset]));
 });
 await t.test('public Storage metadata policy only covers published catalogue paths; no client uploads',async()=>{
  await db.exec("insert into storage.buckets(id,name,public) values('inspection-private','inspection-private',false)");
  await db.exec("insert into storage.objects(bucket_id,name) values('equipment-public','catalogue/demo-phase3/3t-mini-excavator.webp'),('equipment-public','not-published.webp'),('inspection-private','private-evidence.webp')");
  assert.equal((await anon('select * from storage.objects')).length,1);
  await assert.rejects(anon("insert into storage.objects(bucket_id,name) values('equipment-public','attack.webp')"));
 });
 await db.close();
});
