import { test, expect } from '@playwright/test';
import { fixtureSession } from '../fixtures/session';
// Browser-independent HTTP tests of real Next.js SSR routes, using the labelled Auth fixture.
test('HTTP: anonymous protected routes render safe redirects', async({request})=>{
 for (const path of ['/account','/admin']) {
  const response=await request.get(path); const html=await response.text();
  expect(html).toContain('/login?next='); expect(html).not.toContain('Access has been checked on the server.');
 }
});
test('HTTP: customer account works and admin is denied despite forged metadata',async({request})=>{
 const headers={cookie:`sb-127-auth-token=${fixtureSession('customer')}`};
 const account=await request.get('/account',{headers}); expect(await account.text()).toContain('Your account');
 const admin=await request.get('/admin',{headers}); const html=await admin.text(); expect(html).toContain('/forbidden'); expect(html).not.toContain('Change a user role');
});
test('HTTP: staff can access foundation but receives no privileged controls',async({request})=>{
 const response=await request.get('/admin',{headers:{cookie:`sb-127-auth-token=${fixtureSession('staff')}`}});
 const html=await response.text(); expect(html).toContain('Admin access'); expect(html).not.toContain('Record an access review'); expect(html).not.toContain('Change a user role');
});
test('HTTP: super admin sees guarded audit and role forms',async({request})=>{
 const response=await request.get('/admin',{headers:{cookie:`sb-127-auth-token=${fixtureSession('super_admin')}`}});
 const html=await response.text(); expect(html).toContain('Record an access review'); expect(html).toContain('Change a user role');
});
test('HTTP: password recovery requires a recovery grant',async({request})=>{
 const response=await request.get('/reset-password',{headers:{cookie:`sb-127-auth-token=${fixtureSession('customer')}`}});
 expect(await response.text()).toContain('/forgot-password');
});
test('HTTP: auth pages render labelled fields and security headers',async({request})=>{
 for (const path of ['/login','/signup','/forgot-password']) {
  const response=await request.get(path); expect(response.status()).toBe(200); expect(response.headers()['x-frame-options']).toBe('DENY'); expect(response.headers()['referrer-policy']).toBe('no-referrer');
  const html=await response.text(); expect(html).toContain('Email address'); expect(html).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
 }
});
function hiddenFields(html: string, index = 0) {
 const forms=[...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)];
 expect(forms.length).toBeGreaterThan(index);
 const fields:Record<string,string>={};
 const decode=(s:string)=>s.replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 for(const match of forms[index][1].matchAll(/<input\b[^>]*>/g)) {
  if(!match[0].includes('type="hidden"')) continue;
  const name=match[0].match(/name="([^"]+)"/)?.[1];
  if(name) fields[decode(name)]=decode(match[0].match(/value="([^"]*)"/)?.[1] || '');
 }
 return fields;
}
test('HTTP: server rejects weak signup password and missing rate limiter',async({request})=>{
 const signup=await request.get('/signup');
 const invalid=await request.post('/signup',{headers:{origin:'http://127.0.0.1:3101'},multipart:{...hiddenFields(await signup.text()),email:'fixture@example.invalid',password:'short'}});
 expect(await invalid.text()).toContain('Use at least 12 characters.');
 const login=await request.get('/login');
 const denied=await request.post('/login',{headers:{origin:'http://127.0.0.1:3101'},multipart:{...hiddenFields(await login.text()),email:'fixture@example.invalid',password:'long-password-for-test'}});
 expect(await denied.text()).toContain('Reference:');
});
test('HTTP: a customer cannot invoke a captured privileged server action',async({request})=>{
 const admin=await request.get('/admin',{headers:{cookie:`sb-127-auth-token=${fixtureSession('super_admin')}`}});
 const fields=hiddenFields(await admin.text());
 const response=await request.post('/admin',{headers:{origin:'http://127.0.0.1:3101',cookie:`sb-127-auth-token=${fixtureSession('customer')}`},multipart:{...fields,confirm:'yes'}});
 expect(await response.text()).toContain('Access unavailable');
});
