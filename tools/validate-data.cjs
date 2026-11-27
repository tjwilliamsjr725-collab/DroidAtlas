const fs=require('node:fs'),assert=require('node:assert/strict');
const d=require('../production-update/game-data.json');
const canon=s=>s.toUpperCase().replace(/^BASE /,'DEFAULT ').replace(/BU-4D/g,'B-U4D').replace(/J09-4MN/g,'JO9-4MN').replace(/OPTI-STRK/g,'OPTI-STRK');
const signature=r=>r.map(x=>canon(x.variant+' '+x.droid)).sort();
const other=fs.existsSync('research/tycoon-tools.html')?{}:JSON.parse(fs.readFileSync('research/tycoon-tools-requirements.json','utf8')).rows;
const source=fs.existsSync('research/tycoon-tools.html')?fs.readFileSync('research/tycoon-tools.html','utf8'):'';
for(const section of source.matchAll(/<h2 id="cycle-(\d)">.*?<tbody>(.*?)<\/tbody>/gs)){
 other[section[1]]={};
 for(const row of section[2].matchAll(/<tr><td class="dn">\d+ → (\d+)<\/td><td class="amber">(.*?)<\/td>.*?<td style="white-space:normal">(.*?)<\/td><\/tr>/gs)){
  const req=[...row[3].matchAll(/<span class="pill">(.*?)<\/span>/g)].map(m=>{const [variant,...n]=m[1].split(' ');return {variant:variant==='BASE'?'Default':variant,droid:n.join(' ')}});
  other[section[1]][row[1]]={credits:row[2],requirements:req};
 }
}
if(source)fs.writeFileSync('research/tycoon-tools-requirements.json',JSON.stringify({source:'https://www.tycoon-tools.com/droid-tycoon/rebirth-requirements/',retrievedAt:'2026-11-05',rows:other},null,2));
assert.equal(Object.keys(d.rebirths).length,6);assert.equal(Object.keys(other).length,6);
const names=new Set(d.roster.map(x=>x.name)),variants=new Set(['Default','Gold','Diamond','Rainbow','Beskar','Galactic','Stellar','Kyber']);
assert.equal(names.size,d.roster.length);assert.equal(d.roster.find(x=>x.name==='Proto-Roller').rarity,'Legendary');
const differences=[],creditDifferences=[];
const credit=s=>{const m=s.match(/^([\d.]+)(K|M|B|T|Qa)$/);return m?Number(m[1])*({K:1e3,M:1e6,B:1e9,T:1e12,Qa:1e15}[m[2]]):null};
for(const [cycle,rows]of Object.entries(d.rebirths)){
 assert.equal(Object.keys(rows).length,40);assert.equal(Object.keys(other[cycle]).length,40);
 for(const [rb,r]of Object.entries(rows)){
  assert.equal(r.requirements.length,3);assert.equal(new Set(r.requirements.map(x=>x.droid)).size,3);
  for(const x of r.requirements){assert(names.has(x.droid),'Missing roster '+x.droid);assert(variants.has(x.variant),'Invalid tier '+x.variant)}
  if(JSON.stringify(signature(r.requirements))!==JSON.stringify(signature(other[cycle][rb].requirements)))differences.push({cycle,rb,app:r.requirements,other:other[cycle][rb].requirements});
  if(+rb===36){if(cycle==='4'){assert.equal(r.credits,'1.19Qa');assert.equal(r.creditsStatus,'verified-ingame');assert.equal(r.requirementsStatus,'verified-ingame');}else assert.equal(r.creditsStatus,'conflicting-community');continue;}
  if(cycle==='4'&&+rb===37){assert.equal(r.credits,'2.5Qa');assert.equal(r.creditsStatus,'verified-ingame');assert.equal(r.requirementsStatus,'verified-ingame');assert.deepEqual(r.requirements,[{droid:'SEN-TRI',variant:'Kyber'},{droid:'Opti-Pod',variant:'Kyber'},{droid:'Gunrunner',variant:'Kyber'}]);}
  if(cycle==='4'&&+rb===38){assert.equal(r.credits,'4.5Qa');assert.equal(r.creditsStatus,'verified-ingame');assert.equal(r.requirementsStatus,'verified-ingame');assert.deepEqual(r.requirements,[{droid:'B1 Heavy',variant:'Kyber'},{droid:'Groundmech',variant:'Kyber'},{droid:'R7',variant:'Kyber'}]);}
  if(credit(r.credits)!==credit(other[cycle][rb].credits))creditDifferences.push({cycle,rb,app:r.credits,other:other[cycle][rb].credits});
 }
}
const report={checkedAt:'2026-11-27',rows:240,requirementDifferences:differences.length,creditDifferences:creditDifferences.length,unresolvedCreditRows:5,differences,creditDifferenceDetails:creditDifferences,note:'Cross-source agreement is community corroboration, not direct in-game certification.'};
fs.writeFileSync('research/final-data-validation.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
assert.equal(differences.length,0,'Community tables disagree; review before publishing');assert.equal(creditDifferences.length,0);
