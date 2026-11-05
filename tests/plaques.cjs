const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('./playwright.cjs');
const root=path.join(__dirname,'..');
const crystal=process.argv.includes('--crystal');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:393,height:852}});
 await page.goto('file:///'+path.join(root,crystal?'production-update/DroidAtlas_1.2_Crystal_Test_v1.html':'production-update/DroidAtlas_1.2_Data_Update.html').replaceAll('\\','/'));
 if(crystal){
  const embedded=await page.evaluate(async()=>{
   cycle=1;rb=2;render();
   const p=document.querySelector('.sellPlate.v-kyber');
   const url=getComputedStyle(p).backgroundImage.slice(5,-2);
   const img=new Image();img.src=url;await img.decode();return {width:img.naturalWidth,height:img.naturalHeight,png:url.split(',')[1]};
  });
  assert.equal(embedded.width,1586);assert.equal(embedded.height,992);
  assert.deepEqual(Buffer.from(embedded.png,'base64'),fs.readFileSync(path.join(root,'artwork/kyber-plaques/kyber-green-concept-v1.png')));
 }
 const report=await page.evaluate(()=>{
  const missing=[],variants={},locations=new Set();let total=0;
  for(cycle=1;cycle<=6;cycle++)for(rb=1;rb<=40;rb++){
   render();
   for(const plate of document.querySelectorAll('#answer .sellPlate')){
    total++;const style=getComputedStyle(plate),variant=plate.title.split(' minimum')[0];
    variants[variant]=(variants[variant]||0)+1;
    if((style.backgroundImage==='none'&&style.backgroundColor==='rgba(0, 0, 0, 0)')||plate.getBoundingClientRect().height<1){
     missing.push({cycle,rb,droid:plate.closest('.card').querySelector('.droid').textContent,variant});locations.add(cycle+'/'+rb);
    }
   }
  }
  cycle=1;rb=2;render();
  const rb2=DATA['1']['2'].requirements.map(r=>({droid:r.droid,requiredNow:r.variant,last:sellStatus(r.droid,r.variant).last,finalVariant:sellStatus(r.droid,r.variant).variant}));
  cycle=1;rb=15;render();
  return {total,missingCount:missing.length,affectedRows:locations.size,variants,missing,rb2};
 });
 console.log(JSON.stringify({...report,missing:report.missing.slice(0,8)},null,2));
 fs.writeFileSync(path.join(root,'tests/plaque-audit.json'),JSON.stringify(report,null,2));
 await page.screenshot({path:path.join(root,crystal?'tests/crystal-rb15-plaques.png':'tests/production-rb15-plaques.png'),fullPage:true});
 await browser.close();
 assert.equal(report.total,720);if(!process.argv.includes('--audit'))assert.equal(report.missingCount,0,'All variant plaques must have visible backgrounds');
 assert.deepEqual(report.rb2,[{droid:'BDX Explorer',requiredNow:'Default',last:36,finalVariant:'Kyber'},{droid:'2BB',requiredNow:'Default',last:36,finalVariant:'Kyber'},{droid:'Bal-Core',requiredNow:'Default',last:2,finalVariant:'Default'}]);
})().catch(e=>{console.error(e);process.exitCode=1});
