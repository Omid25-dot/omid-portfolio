import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir('/tmp/catalogue-screenshots',{recursive:true});
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}});
  for(const [path,name] of [['/','home'],['/equipment','catalogue'],['/category/cleaning','category'],['/equipment/jcb-3cx-backhoe-loader','detail']]){
   const response=await page.goto(`http://localhost:3000${path}`);assert.equal(response.status(),200);
   await page.locator('h1').waitFor();await page.waitForTimeout(700);
   await page.locator('img').evaluateAll(images=>images.forEach(i=>i.loading='eager'));
   await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name} overflow at ${width}`);
   assert.ok(!(await page.content()).includes('owner_id'));
   await page.screenshot({path:`/tmp/catalogue-screenshots/${name}-${width}.png`,fullPage:true});
  }
  await page.getByLabel('Hire from',{exact:true}).fill('2091-10-22');
  await page.getByLabel('Return on',{exact:true}).fill('2091-10-24');
  await page.getByRole('button',{name:'Check availability & price'}).click();
  await page.getByText('Total quoted',{exact:true}).waitFor({timeout:20000});
  assert.ok((await page.locator('.quote-lines').innerText()).includes('£390'));
  await page.screenshot({path:`/tmp/catalogue-screenshots/quote-${width}.png`,fullPage:true});
  await page.getByLabel('How would you like it?').selectOption('delivery');
  await page.getByLabel('Your postcode',{exact:true}).fill('G77 6AA');
  await page.getByRole('button',{name:'Check availability & price'}).click();
  await page.locator('.form-message').waitFor();
  assert.equal(await page.getByText('Total quoted',{exact:true}).count(),0);
  await page.goto('http://localhost:3000');
  await page.getByLabel('What do you need?').fill('JCB');
  await page.getByLabel('Your postcode',{exact:true}).fill('G77');
  await page.getByLabel('Hire from',{exact:true}).fill('2091-10-22');
  await page.getByLabel('Return on',{exact:true}).fill('2091-10-24');
  await page.getByRole('button',{name:'Search',exact:false}).click();
  await page.waitForURL(/equipment\?/);
  assert.equal(new URL(page.url()).searchParams.get('q'),'JCB');
  await page.getByRole('heading',{name:'JCB 3CX Backhoe Loader'}).waitFor();
  await page.goto('http://localhost:3000/equipment?q=does-not-exist');
  await page.getByText('No equipment matches',{exact:false}).first().waitFor();
  await page.close();
 }
 console.log('Chrome desktop/mobile routes, no overflow, anonymous server quote and empty results passed. Screenshots: /tmp/catalogue-screenshots');
}finally{await browser.close();}
