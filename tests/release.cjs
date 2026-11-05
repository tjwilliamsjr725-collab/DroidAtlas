const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('./playwright.cjs');
const root=path.join(__dirname,'..');let current=false;
const mime={'.html':'text/html','.js':'application/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/DroidAtlas\//,'')||'index.html';
 if(name.includes('..')||name.includes('\\')){res.writeHead(400);res.end();return;}
 let file=path.join(root,'release',name);
 if(!current&&name==='index.html')file=path.join(root,'baseline/github-production-1.2.html');
 if(!current&&name==='service-worker.js')file=path.join(root,'baseline/production-1.2-service-worker.js');
 if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.setHeader('Cache-Control','no-cache');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}/DroidAtlas/`;
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
 const context=await browser.newContext({viewport:{width:393,height:852},acceptDownloads:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
 const historic=await page.evaluate(()=>{
  const state={};for(const d of DROIDEX_ROSTER)for(const v of dxVariantsFor(d)){if(Object.keys(state).length<301)state[dxKey(d.name,v)]=true;}
  localStorage.setItem(DX_KEY,JSON.stringify(state));localStorage.setItem('daCycle','1');localStorage.setItem('daRb','2');localStorage.setItem('droidatlas-tab','droidex');return state;
 });
 await page.reload();assert.match(await page.locator('#dxCount').innerText(),/^301 \/ 589$/);
 await page.evaluate(async()=>{await caches.open('unrelated-app-cache');});
 current=true;
 // Exercise an actual installed 1.2 worker updating at the same scope/origin.
 await page.evaluate(async()=>{
  const reg=await navigator.serviceWorker.getRegistration();
  await new Promise(async(resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('Worker upgrade timed out')),15000);
   navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timeout);resolve();},{once:true});
   await reg.update();
  });
 });
 await page.reload();
 assert.match(await page.locator('.commandMeta').innerText(),/1.2.1/);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem(DX_KEY))),historic,'301 historical entries survive upgrade');
 assert.equal(await page.locator('#droidexView').isVisible(),true,'Active tab survives');
 assert.match(await page.locator('#dxCount').innerText(),/^301 \/ 1000$/);
 assert(await page.evaluate(async()=> (await caches.keys()).includes('unrelated-app-cache')),'Unrelated caches survive');
 assert(!(await page.evaluate(async()=>await caches.keys())).includes('droidatlas-1.2-cache-v1'));
 await page.locator('#rebirthTab').click();
 assert.equal(await page.locator('#rebirthSelect').inputValue(),'2');
 const integrity=await page.evaluate(()=>{
  let n=0;const order=['Default','Gold','Diamond','Rainbow','Beskar','Galactic','Stellar','Kyber'];
  for(let c=1;c<=6;c++)for(let rb=1;rb<=40;rb++)for(const req of DATA[c][rb].requirements){
   // Independent flat-list oracle, rather than duplicating the app's forward loop.
   const uses=Object.entries(DATA[c]).filter(([level,row])=>+level>=rb&&row.requirements.some(x=>x.droid===req.droid));
   const last=Math.max(...uses.map(([level])=>+level));
   const variant=DATA[c][last].requirements.find(x=>x.droid===req.droid).variant;
   cycle=c;window.__testRb=rb;
   // rb is shadowed in this loop; evaluate the pure expected values below using global assignment separately.
   n++;if(!order.includes(variant))throw Error('Bad variant');
  }
  const results=[];for(cycle=1;cycle<=6;cycle++)for(rb=1;rb<=40;rb++)for(const req of DATA[cycle][rb].requirements){
   const uses=Object.entries(DATA[cycle]).filter(([level,row])=>+level>=rb&&row.requirements.some(x=>x.droid===req.droid));
   const last=Math.max(...uses.map(([level])=>+level)),variant=DATA[cycle][last].requirements.find(x=>x.droid===req.droid).variant;
   const actual=sellStatus(req.droid,req.variant);if(actual.last!==last||actual.variant!==variant)results.push({cycle,rb,droid:req.droid});
  }
  cycle=1;rb=2;render();return {n,results};
 });
 assert.equal(integrity.n,720);assert.deepEqual(integrity.results,[]);
 await page.locator('#infoBtn').click();const download=page.waitForEvent('download');await page.locator('#exportCollection').click();
 const file=await (await download).path();assert.deepEqual(JSON.parse(JSON.parse(fs.readFileSync(file,'utf8')).collectionRaw),historic);
 await page.locator('#closeInfo').click();
 await context.setOffline(true);await page.reload();assert.match(await page.locator('.commandMeta').innerText(),/1.2.1/);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem(DX_KEY))),historic);
 const art=await page.evaluate(async()=>{const p=document.querySelector('.v-kyber'),im=new Image();im.src=getComputedStyle(p).backgroundImage.slice(5,-2);await im.decode();return im.naturalWidth;});assert.equal(art,1586);
 await context.setOffline(false);
 await page.evaluate(()=>{localStorage.setItem('daCycle','bad');localStorage.setItem('daRb','NaN')});await page.reload();
 assert.match(await page.locator('#answer').innerText(),/Cycle 1 · RB 1/);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(root,'tests/release-validation.json'),JSON.stringify({version:'1.2.1',passed:true,rows:240,lastNeedPositions:720,historicalEntriesPreserved:301,export:true,installedUpgrade:true,offline:true,unrelatedCachesPreserved:true,invalidNavigationRecovered:true,indexSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'release/index.html'))).digest('hex')},null,2));
 console.log('PASS: installed 1.2 → 1.2.1 upgrade, 301 exact history entries preserved, export, offline, 720 independently checked last-need results, invalid navigation recovery; no script errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
