const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('./playwright.cjs');
const root=path.join(__dirname,'..'),publicRoot=path.join(root,'release');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/DroidAtlas\//,'')||'index.html';
  if(name.includes('..')||name.includes('\\')){res.writeHead(400);res.end();return;}
  const file=path.join(publicRoot,name);
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');
  res.setHeader('Cache-Control','no-cache');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port+'/DroidAtlas/';
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const context=await browser.newContext({viewport:{width:393,height:852}});
    const page=await context.newPage(),errors=[],crossOrigin=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',req=>{if(!req.url().startsWith(origin)&&!req.url().startsWith('data:'))crossOrigin.push(req.url());});
    await page.goto(origin);
    await page.waitForSelector('#da-theme-settings',{state:'attached'});
    const base=await page.evaluate(()=>({
      active:window.DroidAtlasThemes.getActive(),
      bg:getComputedStyle(document.documentElement).getPropertyValue('--cmd-orange').trim(),
      dataSize:Object.values(DATA).reduce((sum,x)=>sum+Object.keys(x).length,0),
      roster:DROIDEX_ROSTER.length,
      originalMarkup:document.querySelector('#rebirthView').innerHTML,
      themeControlVisible:!!document.querySelector('#da-theme-settings').getClientRects().length
    }));
    assert.equal(base.active,'default');
    assert.equal(base.bg,'#fb4f14');
    assert.equal(base.dataSize,240);assert.equal(base.roster,112);
    assert.equal(base.themeControlVisible,false,'Theme settings must stay hidden until About is opened');
    const state='{"Mouse||Default":true,"Proto-Roller||Kyber":true}';
    await page.evaluate(value=>localStorage.setItem('droidatlas-droidex-v1',value),state);
    await page.locator('#infoBtn').click();
    await page.locator('#da-theme-select').selectOption('steel-night');
    await page.waitForFunction(()=>window.DroidAtlasThemes.getActive()==='steel-night');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--cmd-orange').trim()),'#9cb8cb');
    assert.equal(await page.evaluate(()=>localStorage.getItem('droidatlas-theme-v1')),'steel-night');
    await page.locator('#closeInfo').click();
    await page.reload();
    await page.waitForFunction(()=>window.DroidAtlasThemes.getActive()==='steel-night');
    assert.equal(await page.evaluate(()=>localStorage.getItem('droidatlas-droidex-v1')),state,'Theme reload must not change exact collection history');
    for(const w of [320,360,393,428]){
      await page.setViewportSize({width:w,height:850});
      const metrics=await page.evaluate(()=>({inner:window.innerWidth,scroll:document.documentElement.scrollWidth}));
      assert(metrics.scroll<=metrics.inner+1, 'Horizontal theme overflow at '+w+': '+JSON.stringify(metrics));
    }
    await page.locator('#infoBtn').click();
    await page.locator('#da-theme-reset').click();
    await page.waitForFunction(()=>window.DroidAtlasThemes.getActive()==='default');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--cmd-orange').trim()),base.bg);
    assert.equal(await page.evaluate(()=>document.getElementById('da-active-theme-sheet')),null,'Default theme must add no visual overrides');
    assert.equal(await page.evaluate(()=>localStorage.getItem('droidatlas-theme-v1')),'default');
    await page.locator('#closeInfo').click();
    await page.evaluate(()=>localStorage.setItem('droidatlas-theme-v1','../../untrusted.css'));
    await page.reload();
    await page.waitForSelector('#da-theme-settings',{state:'attached'});
    assert.equal(await page.evaluate(()=>window.DroidAtlasThemes.getActive()),'default','Invalid theme ID must fall back to safe default');
    assert.equal(await page.evaluate(()=>localStorage.getItem('droidatlas-theme-v1')),'default');
    assert.equal(await page.evaluate(()=>localStorage.getItem('droidatlas-droidex-v1')),state);

    // Old preview accidentally named the original appearance Kyber Crystal.
    // Migrate only that theme preference; never touch exact-variant history.
    await page.evaluate(()=>localStorage.setItem('droidatlas-theme-v1','kyber-crystal'));
    await page.reload();
    await page.waitForSelector('#da-theme-settings',{state:'attached'});
    await page.waitForFunction(()=>window.DroidAtlasThemes.getActive()==='default');
    assert.equal(await page.evaluate(()=>localStorage.getItem('droidatlas-theme-v1')),'default','Legacy misnamed theme choice migrates');
    assert.equal(await page.evaluate(()=>localStorage.getItem('droidatlas-droidex-v1')),state);

    // Offline PWA: both theme packages must remain switchable without network.
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.reload();
    assert(await page.evaluate(()=>!!navigator.serviceWorker.controller),'Theme preview must be controlled by service worker');
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('#da-theme-settings',{state:'attached'});
    await page.locator('#infoBtn').click();
    await page.locator('#da-theme-select').selectOption('steel-night');
    await page.waitForFunction(()=>window.DroidAtlasThemes.getActive()==='steel-night');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--cmd-orange').trim()),'#9cb8cb');
    assert.equal(await page.evaluate(()=>localStorage.getItem('droidatlas-droidex-v1')),state);
    await page.locator('#da-theme-reset').click();
    await page.waitForFunction(()=>window.DroidAtlasThemes.getActive()==='default');
    assert.equal(await page.evaluate(()=>document.querySelector('#rebirthView').innerHTML),base.originalMarkup,'Theme switching must leave Rebirth view untouched');
    assert.deepEqual(errors,[],'No theme-related script errors');
    assert.deepEqual(crossOrigin,[],'All theme files must be same-origin');
    console.log('PASS: theme registry, default preservation, Steel Night switch/persistence, invalid-id fallback, offline package switching, 320–428px widths, exact Droidex history unaffected.');
  }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;}).finally(()=>server.close());
