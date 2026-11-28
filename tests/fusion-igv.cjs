const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'production-update/fusion-verification.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal(manifest.status,'IGV');
assert.equal(manifest.recipes.length,28);
const verified=new Set(manifest.recipes.map(r=>{assert.equal(r.status,'IGV');return r.result;}));
assert.equal(verified.size,28,'All 28 verified names must be unique');
const fusion=html.match(/<div id="fusionView" class="appView" hidden>([\s\S]*?)(?=<div id="droidexView")/);
assert(fusion,'Missing fusion view');
const cards=[...fusion[1].matchAll(/<section class="fusionCard">([\s\S]*?)<\/section>/g)];
assert.equal(cards.length,28,'All 28 Fusion recipe cards must be present');
const actual=new Set();
for(const [,card] of cards){
 const name=card.match(/<div class="fusionResult">([^<]+)<\/div>/)?.[1];
 const status=card.match(/<div class="fusionStatus">([^<]+)<\/div>/)?.[1];
 assert(name,'Missing Fusion result title');
 assert(!actual.has(name),'Duplicate Fusion result: '+name);
 actual.add(name);
 assert(verified.has(name),'Unexpected unverified recipe: '+name);
 assert.equal(status,'IGV · Verified in game','Incorrect status for '+name);
}
assert.deepEqual([...actual].sort(),[...verified].sort());
assert.match(fusion[1],/All 28 Fusion recipes are IGV/);
assert(!fusion[1].includes('Community reported · v1.40'),'Outdated Fusion status remains');
console.log('PASS: 28 named Fusion recipes IGV, no future recipe implicitly verified');
