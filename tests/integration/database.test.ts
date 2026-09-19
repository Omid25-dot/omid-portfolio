import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';

// Actual embedded PostgreSQL execution, with a minimal Auth/JWT fixture.
// This does NOT test hosted Supabase Auth, PostgREST, email or service connectivity.
test('migrations, grants, RLS, ownership constraints and atomic audit', async t => {
 const db = new PGlite({ extensions: { btree_gist } });
 const ids = {
  customer:'20000000-0000-4000-8000-000000000001', other:'20000000-0000-4000-8000-000000000002',
  staff:'20000000-0000-4000-8000-000000000003', admin:'20000000-0000-4000-8000-000000000004',
  super_admin:'20000000-0000-4000-8000-000000000005', suspended:'20000000-0000-4000-8000-000000000006',
 };
 await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
 create schema auth; create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;`);
 await db.exec(await readFile('tests/fixtures/storage.sql','utf8'));
 for (const file of (await readdir('database/migrations')).filter(v=>v.endsWith('.sql')).sort()) await db.exec(await readFile(`database/migrations/${file}`,'utf8'));
 await db.exec(await readFile('database/seed/development.sql','utf8'));
 // Idempotent seed should neither duplicate nor overwrite later business settings.
 await db.exec(await readFile('database/seed/development.sql','utf8'));
 for (const [role,id] of Object.entries(ids)) {
  await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[id,{role:'super_admin',account_status:'active'}]);
  if (['staff','admin','super_admin'].includes(role)) await db.query('update public.profiles set role=$1 where id=$2',[role,id]);
 }
 await db.query("update public.profiles set role='admin', account_status='suspended' where id=$1",[ids.suspended]);
 async function asRole<T>(role: 'anon'|'authenticated', user: string|null, sql:string, params:unknown[] = []) {
  await db.exec('begin');
  try {
   await db.exec(`set local role ${role}`);
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user || '']);
   const result=await db.query<T>(sql,params);
   await db.exec('commit'); return result;
  } catch(error) { await db.exec('rollback'); throw error; }
 }
 await t.test('all tables enable RLS and public only gets active categories',async()=>{
  const tables = await db.query<{relrowsecurity:boolean}>("select relrowsecurity from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='public' and relkind='r'");
  assert.equal(tables.rows.length,13); assert.ok(tables.rows.every(x=>x.relrowsecurity));
  const categories=await asRole('anon',null,'select * from public.categories'); assert.equal(categories.rows.length,6);
  await assert.rejects(asRole('anon',null,'select * from public.profiles'));
  for (const table of ['owners','audit_logs','platform_settings','equipment','equipment_images','equipment_specifications','locations','service_areas']) await assert.rejects(asRole('anon',null,`select * from public.${table}`));
 });
 await t.test('metadata cannot elevate role; profile edits cannot modify protected fields',async()=>{
  const self=await asRole<{role:string}>('authenticated',ids.customer,'select * from public.profiles');
  assert.equal(self.rows.length,1); assert.equal(self.rows[0].role,'customer');
  await asRole('authenticated',ids.customer,"update public.profiles set first_name='Alice' where id=$1",[ids.customer]);
  const other=await asRole('authenticated',ids.customer,"update public.profiles set first_name='Hacked' where id=$1 returning id",[ids.other]); assert.equal(other.rows.length,0);
  await assert.rejects(asRole('authenticated',ids.customer,"update public.profiles set role='super_admin' where id=$1",[ids.customer]));
  await assert.rejects(asRole('authenticated',ids.customer,"update public.profiles set account_status='active' where id=$1",[ids.customer]));
  await assert.rejects(asRole('authenticated',ids.customer,'insert into public.profiles(id) values($1)',[crypto.randomUUID()]));
 });
 await t.test('customer cannot read private data or use admin functions',async()=>{
  for (const table of ['owners','audit_logs','platform_settings','equipment','locations','service_areas']) assert.equal((await asRole('authenticated',ids.customer,`select * from public.${table}`)).rows.length,0);
  await assert.rejects(asRole('authenticated',ids.customer,'select public.record_access_review()'));
  await assert.rejects(asRole('authenticated',ids.customer,"select public.change_profile_role($1,'admin')",[ids.other]));
  await assert.rejects(asRole('authenticated',ids.customer,"select private.append_audit($1,'forged','profile',$1)",[ids.customer]));
 });
 await t.test('staff is operational only; admin cannot change roles/settings',async()=>{
  assert.equal((await asRole('authenticated',ids.staff,'select * from public.locations')).rows.length,1);
  for (const table of ['owners','audit_logs','platform_settings']) assert.equal((await asRole('authenticated',ids.staff,`select * from public.${table}`)).rows.length,0);
  assert.equal((await asRole('authenticated',ids.admin,'select * from public.owners')).rows.length,1);
  assert.equal((await asRole('authenticated',ids.admin,'select * from public.platform_settings')).rows.length,0);
  for (const id of [ids.staff,ids.admin]) await assert.rejects(asRole('authenticated',id,"select public.change_profile_role($1,'super_admin')",[ids.other]));
  await assert.rejects(asRole('authenticated',ids.admin,"update public.platform_settings set value='0' where key='default_commission_bps'"));
 });
 await t.test('suspended admins lose privileged reads and mutations',async()=>{
  assert.equal((await asRole('authenticated',ids.suspended,'select * from public.owners')).rows.length,0);
  await assert.rejects(asRole('authenticated',ids.suspended,'select public.record_access_review()'));
 });
 await t.test('role changes write audit atomically and forbid self changes',async()=>{
  await asRole('authenticated',ids.super_admin,"select public.change_profile_role($1,'staff')",[ids.other]);
  const audit=await asRole<{actor_id:string;before_data:{role:string};after_data:{role:string}}>('authenticated',ids.admin,"select * from public.audit_logs where action='profile.role_changed'");
  assert.equal(audit.rows.length,1); assert.equal(audit.rows[0].actor_id,ids.super_admin);
  assert.equal(audit.rows[0].before_data.role,'customer'); assert.equal(audit.rows[0].after_data.role,'staff');
  await assert.rejects(asRole('authenticated',ids.super_admin,"select public.change_profile_role($1,'customer')",[ids.super_admin]));
  await assert.rejects(asRole('authenticated',ids.super_admin,"select public.change_profile_role($1,'owner')",[ids.other]));
  await asRole('authenticated',ids.admin,'select public.record_access_review()');
  const count=await db.query<{count:number}>('select count(*)::int as count from public.audit_logs'); assert.equal(count.rows[0].count,2);
  await assert.rejects(asRole('authenticated',ids.admin,'delete from public.audit_logs'));
 });
 await t.test('audit failure rolls back the role change',async()=>{
  await db.exec(`create function private.test_fail_audit() returns trigger language plpgsql as $$ begin raise exception 'test failure'; end $$;
   create trigger test_fail_audit before insert on public.audit_logs for each row execute function private.test_fail_audit();`);
  await assert.rejects(asRole('authenticated',ids.super_admin,"select public.change_profile_role($1,'admin')",[ids.other]));
  const profile=await db.query<{role:string}>('select role from public.profiles where id=$1',[ids.other]); assert.equal(profile.rows[0].role,'staff');
  await db.exec('drop trigger test_fail_audit on public.audit_logs; drop function private.test_fail_audit();');
 });
 await t.test('direct privileged RPC calls are throttled in the database',async()=>{
  for(let i=0;i<7;i++) await asRole('authenticated',ids.admin,'select public.record_access_review()');
  await assert.rejects(asRole('authenticated',ids.admin,'select public.record_access_review()'), /Rate limit/);
  await assert.rejects(asRole('authenticated',ids.admin,'delete from private.mutation_rate_limits'));
 });
 await t.test('ownership and money constraints reject invalid equipment',async()=>{
  const category=await db.query<{id:string}>('select id from public.categories limit 1');
  const insert=`insert into public.equipment(title,slug,category_id,daily_rate,base_location_id,ownership_type,owner_id) values('Demo','demo',$1,$2,'10000000-0000-4000-8000-000000000002',$3,$4)`;
  await assert.rejects(db.query(insert,[category.rows[0].id,100,'THIRD_PARTY',null]));
  await assert.rejects(db.query(insert,[category.rows[0].id,100,'COMPANY','10000000-0000-4000-8000-000000000003']));
  await assert.rejects(db.query(insert,[category.rows[0].id,-1,'COMPANY',null]));
  await db.query(insert,[category.rows[0].id,100,'COMPANY',null]);
  assert.equal((await asRole('authenticated',ids.customer,'select * from public.equipment')).rows.length,0);
 });
 await db.close();
});
