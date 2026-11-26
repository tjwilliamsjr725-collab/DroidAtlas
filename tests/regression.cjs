const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('./playwright.cjs');
const root=path.join(__dirname,'..'),production=process.argv.includes('--production');
const crystal=process.argv.includes('--crystal');
const appPath=crystal?'production-update/DroidAtlas_1.2_Crystal_Test_v1.html':production?'production-update/DroidAtlas_1.2_Data_Update.html':'DroidAtlas_Refresh_2026-11-05.html';
const url='file:///'+path.join(root,appPath).replaceAll('\\','/');
(async()=>{
 const current=fs.readFileSync(path.join(root,appPath),'utf8');
 const baseline=fs.readFileSync(path.join(root,production?'baseline/github-production-1.2.html':'baseline/v61.html'),'utf8');
 const styles=s=>[...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]);
 const originalStyles=production?current.replace(/<style id="variant-plaque-fix">[\s\S]*?<\/style>/,''):current;
 assert.deepEqual(styles(originalStyles),styles(baseline),'Existing production CSS unchanged (Kyber plaque repair is separate)');
 const images=s=>s.match(/data:image\/[^\s"')]+/g);
 assert.deepEqual(images(originalStyles),images(baseline),'Existing embedded artwork unchanged');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 const original={'Proto-Roller||Rainbow':true,'Retired Droid||Legacy':true};
 await page.evaluate(s=>{localStorage.setItem('droidatlas-droidex-v1',JSON.stringify(s));localStorage.setItem('daCycle','1');localStorage.setItem('daRb','12')},original);
 await page.reload();
 assert.equal(await page.evaluate(()=>localStorage.getItem(DX_KEY)),JSON.stringify(original));
 assert.match(await page.locator('#answer').innerText(),production?/REPORTED LAST NEED/:/SELL STATUS UNVERIFIED/);
 await page.locator('.cycle[data-cycle="6"]').click();
 if(!production){assert.match(await page.locator('#answer').innerText(),/reworked/);await page.locator('#communityPreview').check();}
 for(let cycle=1;cycle<=6;cycle++){
  await page.locator(`.cycle[data-cycle="${cycle}"]`).click();
  for(let rb=1;rb<=40;rb++){
   await page.locator('#rebirthSelect').selectOption(String(rb));
   assert.equal(await page.locator('#answer .card').count(),3,`cycle ${cycle} RB ${rb}`);
   assert.match(await page.locator('#answer').innerText(),production?/REPORTED LAST NEED/:/SELL STATUS UNVERIFIED/);
  }
 }
 await page.locator('#droidexTab').click();
 await page.locator('#dxSearch').fill('Proto-Roller');
 assert.equal(await page.locator('.dxVariant.filled').count(),1);
 await page.locator('.dxVariant[data-variant="Gold"]').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(DX_KEY)));
 assert.equal(saved['Proto-Roller||Gold'],true);assert.equal(saved['Proto-Roller||Rainbow'],true);
 assert.equal(saved['Proto-Roller||Default'],undefined);assert.equal(saved['Retired Droid||Legacy'],true);
 assert.equal(await page.evaluate(s=>localStorage.getItem(DX_KEY+s),production?'-backup-1.2-data-update':'-backup-2026-11-05'),JSON.stringify(original));
 await page.reload();await page.locator('#dxSearch').fill('Proto-Roller');
 assert.equal(await page.locator('.dxVariant.filled').count(),2);
 if(production){
  await page.locator('.dxBulkBtn').click();assert.equal(await page.locator('.dxVariant.filled').count(),12);
  await page.locator('.dxBulkBtn').click();assert.equal(await page.locator('.dxVariant.filled').count(),0);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(DX_KEY))['Retired Droid||Legacy']),true);
  await page.locator('#dxSearch').fill('');await page.locator('[data-class="Protocol"]').click();
  assert.equal(await page.locator('.dxCard').count(),6);
  await page.locator('[data-class="All"]').click();await page.locator('[data-rarity="Legendary"]').click();
  assert.equal(await page.locator('.dxCard').count()>0,true);
  await page.locator('#dxSearch').fill('Proto-Roller');await page.locator('#dxMissingOnly').check();
  assert.equal(await page.locator('.dxCard').count(),1);
  await page.locator('#dxMissingOnly').uncheck();await page.locator('[data-rarity="All"]').click();
 }
 await page.locator('#fusionTab').click();assert.equal(await page.locator('#fusionView').isVisible(),true);
 await page.locator('#rebirthTab').click();assert.equal(await page.locator('#rebirthView').isVisible(),true);
 // Invalid collection must survive load and every attempted toggle unchanged.
 await page.evaluate(()=>localStorage.setItem(DX_KEY,'{broken'));
 await page.reload();page.on('dialog',d=>d.dismiss());
 await page.locator('#droidexTab').click();await page.locator('#dxSearch').fill('Proto-Roller');
 await page.locator('.dxVariant[data-variant="Gold"]').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem(DX_KEY)),'{broken');
 assert.deepEqual(errors,[]);
 for(const width of [320,360,393,428]){
  await page.setViewportSize({width,height:852});
  await page.screenshot({path:path.join(root,`tests/${crystal?'crystal-':production?'production-':''}droidex-${width}.png`)});
  if(production){
   await page.locator('#rebirthTab').click();await page.locator('.cycle[data-cycle="6"]').click();await page.locator('#rebirthSelect').selectOption('40');
   await page.screenshot({path:path.join(root,`tests/${crystal?'crystal':'production'}-rebirth-${width}.png`),fullPage:true});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow at '+width);
   await page.locator('#droidexTab').click();
  }
 }
 await browser.close();console.log('PASS: 240 reported rows; navigation; exact history; unknown-key retention; backup; reload; corrupt-state protection; mobile screenshots.'+(production?' Production CSS and artwork unchanged; bulk controls and filters passed.':''));
})().catch(e=>{console.error(e);process.exitCode=1});
