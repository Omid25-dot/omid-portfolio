import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasRole, mayAccessAccount, safeNext, operationalRoles, type Role } from '../../lib/permissions/policy';
import { loginSchema, signupSchema, profileUpdateSchema, roleChangeSchema, resetPasswordSchema } from '../../lib/validation/schemas';
import { RedisRestStore } from '../../lib/rate-limit/core';

test('role matrix denies customers and inactive operators', () => {
 for (const role of ['customer','staff','admin','super_admin'] as Role[]) {
  assert.equal(hasRole({id:'x',role,account_status:'active'},operationalRoles), role !== 'customer');
  assert.equal(hasRole({id:'x',role,account_status:'active'},['super_admin']), role === 'super_admin');
  for (const account_status of ['restricted','suspended'] as const) assert.equal(hasRole({id:'x',role,account_status},operationalRoles),false);
 }
 assert.equal(mayAccessAccount({id:'x',role:'customer',account_status:'suspended'}),false);
 assert.equal(mayAccessAccount({id:'x',role:'customer',account_status:'restricted'}),true);
});
test('redirect allowlist rejects external and encoded destinations', () => {
 for (const value of ['https://evil.example','//evil.example','/\\evil.example','/%2f%2fevil.example','/admin?next=evil',undefined,['/admin']]) assert.equal(safeNext(value),'/account');
 assert.equal(safeNext('/admin'),'/admin');
});
test('auth and profile schemas reject privilege injection and invalid input', () => {
 assert.equal(signupSchema.safeParse({email:'a@example.com',password:'short'}).success,false);
 assert.equal(loginSchema.safeParse({email:'a@example.com',password:'a',role:'admin'}).success,false);
 assert.equal(profileUpdateSchema.safeParse({first_name:'A',last_name:'B',phone:'',role:'super_admin'}).success,false);
 assert.equal(profileUpdateSchema.safeParse({first_name:'A',last_name:'B',phone:'',account_status:'active'}).success,false);
 assert.equal(roleChangeSchema.safeParse({user_id:'invalid',role:'owner'}).success,false);
 assert.equal(resetPasswordSchema.safeParse({password:'long-password-value',confirm_password:'different'}).success,false);
});
test('Redis adapter denies over-limit and fails closed for provider faults', async () => {
 const original = globalThis.fetch;
 try {
  const store = new RedisRestStore('https://redis.example.invalid','test');
  let calls=0;
  globalThis.fetch = async (_url,init) => {
   const command=JSON.parse(String(init?.body));
   assert.equal(command[0],'EVAL'); assert.match(command[1],/EXPIRE/);
   calls++; return Response.json({result:calls});
  };
  assert.equal(await store.consume('opaque-key',1,900),true);
  assert.equal(await store.consume('opaque-key',1,900),false);
  globalThis.fetch = async () => Response.json({error:'unavailable'},{status:503});
  await assert.rejects(store.consume('opaque-key',1,900));
  globalThis.fetch = async () => Response.json({result:'not-an-integer'});
  await assert.rejects(store.consume('opaque-key',1,900));
 } finally { globalThis.fetch=original; }
});

test('recovery grants expire and reject tampering, another user and malformed signatures', async () => {
 const {signRecoveryToken,verifyRecoveryToken}=await import('../../lib/auth/recovery-token');
 const token=signRecoveryToken('user-one','test-only-key',1000);
 assert.equal(verifyRecoveryToken(token,'user-one','test-only-key',1001),true);
 assert.equal(verifyRecoveryToken(token,'user-two','test-only-key',1001),false);
 assert.equal(verifyRecoveryToken(token,'user-one','wrong-key',1001),false);
 assert.equal(verifyRecoveryToken(token,'user-one','test-only-key',901000),false);
 assert.equal(verifyRecoveryToken(token+'.extra','user-one','test-only-key',1001),false);
 assert.equal(verifyRecoveryToken(`user-one.9999999.${'é'.repeat(64)}`,'user-one','test-only-key',1001),false);
});
