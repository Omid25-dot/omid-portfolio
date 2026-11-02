import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeNext} from '../../lib/permissions/policy';
import {signReview,readReview} from '../../lib/booking/review-token';
test('booking intent allowlist preserves selections but rejects financial and external redirects',()=>{
 const path='/booking/mini-excavator?start=2091-09-22&end=2091-09-24&method=collection';assert.equal(safeNext(path),path);
 for(const path of ['//evil.test','/booking/a?total=1','/booking/a?start=2091-09-22&start=2092-09-22','/booking/a?next=https://evil.test','/booking/a%2f..','/booking/a?method=delivery'])assert.equal(safeNext(path),'/account');
});
test('review tokens bind user, dates, current quote and retry key, reject tampering and expiry',()=>{
 const user=crypto.randomUUID();const key='test-only-strong-key';const r={user,equipment:crypto.randomUUID(),slug:'mini-excavator',start:'2091-09-22',end:'2091-09-24',request:crypto.randomUUID(),quote:{total_payable:50000},expires:2000};
 const token=signReview(r,key);assert.deepEqual(readReview(token,key,user,1000),r);
 for(const [value,id,now] of [[token+'a',user,1000],[token,crypto.randomUUID(),1000],[token,user,2000]] as const)assert.throws(()=>readReview(value,key,id,now));
});
