import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bookingInputSchema,rentalError} from '../../lib/booking/contracts';
test('rental input rejects impossible dates and all client financial/ownership fields',()=>{
 const valid={equipment_id:crypto.randomUUID(),start_date:'2090-09-22',end_date:'2090-09-24',fulfilment_method:'collection'};
 assert.ok(bookingInputSchema.safeParse(valid).success);
 for(const extra of [{total_payable:1},{commission_bps:0},{owner_id:crypto.randomUUID()},{customer_id:crypto.randomUUID()},{status:'CONFIRMED'}]) assert.equal(bookingInputSchema.safeParse({...valid,...extra}).success,false);
 assert.equal(bookingInputSchema.safeParse({...valid,start_date:'2090-02-30'}).success,false);
 assert.equal(bookingInputSchema.safeParse({...valid,end_date:valid.start_date}).success,false);
 assert.match(rentalError({code:'23P01',message:'raw SQL details'}),/choose different dates/);
 assert.ok(!rentalError({message:'secret database information'}).includes('secret'));
});
