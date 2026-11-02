// Explicit development-only fixtures. Real hosted Auth/RLS/RPCs and real Chrome UI.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFileSync,mkdirSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {chromium} from '@playwright/test';
process.loadEnvFile('.env.local');
assert.equal(process.env.LIVE_RENTAL_VERIFY,'rentora-dev');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname.split('.')[0],readFileSync('supabase/.temp/project-ref','utf8').trim());
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,options);
const client=()=>createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,options);
const must=r=>{if(r.error)throw Error(`Hosted check failed: ${r.error.code??'unknown'}`);return r.data;};
const users=[],sessions=[];const equipment=randomUUID(),slug=`phase4-test-${equipment}`,imagePath=`catalogue/phase4-tests/${equipment}.webp`;let browser;
const pass=message=>console.log(`PASS ${message}`);
const args=(start='2092-10-22',end='2092-10-24')=>({p_equipment:equipment,p_start:start,p_end:end,p_method:'collection'});
const requestArgs=(q,id=randomUUID(),start='2092-10-22',end='2092-10-24')=>({p_equipment:equipment,p_start:start,p_end:end,p_request:id,p_expected_quote:q,p_first_name:'Demo',p_last_name:'Customer',p_phone:'07000 000000',p_terms:true});
try{
 const seed=must(await admin.from('equipment').select('*').eq('slug','3t-mini-excavator').single());
 const {id,created_at,updated_at,...fields}=seed;void id;void created_at;void updated_at;
 must(await admin.from('equipment').insert({...fields,id:equipment,slug,title:'Phase 4 verification excavator',is_demo:true}));
 must(await admin.storage.from('equipment-public').upload(imagePath,readFileSync('public/demo-equipment/3t-mini-excavator.webp'),{contentType:'image/webp'}));
 must(await admin.from('equipment_images').insert({equipment_id:equipment,storage_path:imagePath,alt_text:'Demo test equipment illustration',is_primary:true}));
 for(let i=0;i<2;i++){
  const email=`phase4-${randomUUID()}@example.invalid`,password=`Test!${randomBytes(24).toString('base64url')}`;
  const user=must(await admin.auth.admin.createUser({email,password,email_confirm:true})).user;users.push({id:user.id,email,password});
  const c=client();must(await c.auth.signInWithPassword({email,password}));sessions.push(c);
 }
 const [a,b]=sessions;
 let q=must(await a.rpc('quote_rental',args()));
 must(await admin.from('equipment').update({daily_rate:seed.daily_rate+100}).eq('id',equipment));
 assert.equal((await a.rpc('request_customer_booking',requestArgs(q))).error?.message,'QUOTE_CHANGED');
 assert.equal(must(await admin.from('bookings').select('id').eq('equipment_id',equipment)).length,0);pass('hosted stale quote rollback');
 q=must(await a.rpc('quote_rental',args()));
 const key=randomUUID();const retry=await Promise.all([a.rpc('request_customer_booking',requestArgs(q,key)),a.rpc('request_customer_booking',requestArgs(q,key))]);
 const ref=must(retry[0]);assert.equal(must(retry[1]),ref);pass('simultaneous same-request retry creates one booking');
 assert.equal(must(await b.rpc('customer_booking_detail',{p_reference:ref})),null);
 assert.ok((await b.rpc('cancel_customer_booking',{p_reference:ref})).error);
 const own=must(await a.rpc('customer_booking_detail',{p_reference:ref}));assert.equal(own.status,'REQUESTED');
 for(const key of ['owner','commission','actor_id','reason','customer_id'])assert.ok(!JSON.stringify(own).includes(key));
 assert.ok((await client().rpc('request_customer_booking',requestArgs(q))).error);
 assert.ok((await a.from('bookings').update({security_deposit:0,status:'CONFIRMED'}).eq('reference',ref)).error);
 must(await a.rpc('cancel_customer_booking',{p_reference:ref}));
 assert.equal(must(await a.rpc('customer_booking_detail',{p_reference:ref})).history.length,2);
 pass('hosted reference privacy, anonymous/financial denial, cancellation/history');
 const raceDates=['2092-11-22','2092-11-24'];q=must(await a.rpc('quote_rental',args(...raceDates)));
 const race=await Promise.all([a,b].map(c=>c.rpc('request_customer_booking',requestArgs(q,randomUUID(),...raceDates))));
 assert.equal(race.filter(r=>!r.error).length,1);assert.equal(race.find(r=>r.error).error.code,'23P01');pass('different customers race: exactly one wins');
 browser=await chromium.launch({channel:'chrome',headless:true});mkdirSync('/tmp/booking-screenshots',{recursive:true});
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
  const month=width===1440?'08':'09';const path=`/booking/${slug}?start=2093-${month}-22&end=2093-${month}-24&method=collection`;
  await page.goto(`http://localhost:3000${path}`);await page.waitForURL(/\/login\?/);
  assert.equal(new URL(page.url()).searchParams.get('next'),path);
  const signupHref=await page.getByRole('link',{name:'Sign up',exact:true}).getAttribute('href');assert.ok(signupHref.includes(encodeURIComponent(path)));
  await page.getByLabel('Email address').fill(users[0].email);await page.getByLabel('Password',{exact:true}).fill(users[0].password);await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.waitForURL(`http://localhost:3000${path}`,{timeout:30000});
  await page.getByLabel('First name',{exact:true}).fill('Demo');await page.getByLabel('Last name',{exact:true}).fill('Customer');await page.getByLabel('Phone number').fill('07000 000000');await page.getByRole('checkbox').check();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`/tmp/booking-screenshots/review-${width}.png`,fullPage:true});
  if(width===1440){
   must(await admin.from('equipment').update({daily_rate:seed.daily_rate+200}).eq('id',equipment));
   await page.getByRole('button',{name:'Request booking — no payment today'}).click();await page.getByRole('alert').filter({hasText:'price has changed'}).waitFor();
   await page.reload();await page.getByRole('checkbox').check();
  }
  if(width===390){
   must(await admin.from('equipment').update({operational_status:'MAINTENANCE'}).eq('id',equipment));
   await page.getByRole('button',{name:'Request booking — no payment today'}).click();await page.getByRole('alert').filter({hasText:'no longer available'}).waitFor();
   must(await admin.from('equipment').update({operational_status:'AVAILABLE'}).eq('id',equipment));await page.reload();await page.getByRole('checkbox').check();
  }
  await page.getByRole('button',{name:'Request booking — no payment today'}).click();
  await page.waitForURL(/\/booking\/confirmation\/RNT-/,{timeout:30000});
  const reference=page.url().split('/').pop();await page.getByRole('heading',{name:'Thanks. Your request is in.'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`/tmp/booking-screenshots/confirmation-${width}.png`,fullPage:true});
  const denied=await browser.newContext();const token=must(await b.auth.getSession()).session;
  await denied.addCookies([{name:`sb-${new URL(url).hostname.split('.')[0]}-auth-token`,value:'base64-'+Buffer.from(JSON.stringify(token)).toString('base64url'),url:'http://localhost:3000',sameSite:'Lax'}]);
  const stranger=await denied.newPage();await stranger.goto(`http://localhost:3000/booking/confirmation/${reference}`);await stranger.getByRole('heading',{name:'Page not found'}).waitFor();await denied.close();
  await page.goto('http://localhost:3000/account/bookings');await page.getByText(reference,{exact:true}).waitFor();
  await page.goto(`http://localhost:3000/account/bookings/${reference}`);
  await page.getByText('Withdraw this unpaid request',{exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Cancel my request'}).click();await page.getByText('Cancelled',{exact:true}).first().waitFor();
  await page.reload();await page.getByText('Cancelled',{exact:true}).first().waitFor();
  assert.equal(must(await b.rpc('customer_booking_detail',{p_reference:reference})),null);
  await context.close();pass(`Chrome ${width}px login continuation, review/repricing, creation, confirmation, list and withdrawal`);
 }
 const records=must(await admin.from('bookings').select('id').eq('equipment_id',equipment));
 const audit=must(await admin.from('audit_logs').select('action,actor_id,resource_id,created_at').in('resource_id',records.map(r=>r.id)));
 assert.ok(audit.some(r=>r.action==='booking.created'));assert.ok(audit.some(r=>r.action==='booking.status_changed'));pass('real audit records');
}finally{
 if(browser)await browser.close();
 for(const c of sessions)await c.auth.signOut({scope:'global'});
 const records=must(await admin.from('bookings').select('id').eq('equipment_id',equipment));
 if(records.length){const ids=records.map(r=>r.id);must(await admin.from('booking_status_history').delete().in('booking_id',ids));must(await admin.from('bookings').delete().in('id',ids));}
 must(await admin.from('equipment').delete().eq('id',equipment));
 must(await admin.storage.from('equipment-public').remove([imagePath]));
 for(const user of users)must(await admin.auth.admin.deleteUser(user.id));
 pass('isolated fixtures removed; audit retained');
}
