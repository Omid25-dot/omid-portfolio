import {test} from 'node:test';
import assert from 'node:assert/strict';
import {imageUrl,filterUrl,scalarParams,searchSchema} from '../../lib/catalogue/contracts';
test('catalogue URL state, numeric blanks, postcode and date validation',()=>{
 const p=searchSchema.parse(scalarParams({q:'mini digger',postcode:'g77',start:'2091-09-22',end:'2091-09-24',max:''}));assert.equal(p.max,100000);assert.equal(p.postcode,'G77');
 assert.match(filterUrl(p),/q=mini\+digger/);assert.match(filterUrl(p),/postcode=G77/);
 assert.equal(searchSchema.safeParse({start:'2091-09-22',end:'2091-09-21'}).success,false);
 assert.equal(searchSchema.safeParse({available:'1'}).success,false);
 assert.equal(searchSchema.safeParse({postcode:'<script>'}).success,false);
});
test('missing and unsafe image paths have a deliberate local fallback',()=>{
 assert.equal(imageUrl(),'/images/equipment-placeholder.svg');assert.equal(imageUrl('../inspection-private/evidence.webp'),'/images/equipment-placeholder.svg');assert.equal(imageUrl('https://evil.invalid/a.jpg'),'/images/equipment-placeholder.svg');
});
