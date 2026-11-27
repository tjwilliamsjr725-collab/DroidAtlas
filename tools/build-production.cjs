const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const original=read('baseline/github-production-1.2.html');
const data=JSON.parse(read('production-update/game-data.json'));
let html=original;
const replace=(a,b)=>{assert(html.includes(a),'Missing build anchor: '+a.slice(0,90));html=html.replace(a,b)};
// Only the new data tier needs a plaque; retain every existing 1.2 plaque unchanged.
const plaqueFix=`<style id="variant-plaque-fix">
.sellPlate.v-kyber{
 background-image:linear-gradient(145deg,rgba(229,255,245,.85) 0 5%,transparent 6% 24%,rgba(125,255,201,.22) 25% 32%,transparent 33% 70%,rgba(229,255,245,.6) 71% 76%,transparent 77%),linear-gradient(135deg,#79cbb2 0%,#226b55 23%,#123b32 49%,#388c6a 73%,#a5e6c8 100%) !important;
 box-shadow:inset 0 0 0 1px #a8dccb,inset 0 0 0 3px #254f43,0 2px 6px rgba(0,0,0,.28) !important;
}
</style>`;
replace('</head>',plaqueFix+'\n</head>');
html=html.replace(/const DATA=\{.*?\};/,'const GAME_DATA=JSON.parse(document.getElementById("game-data").textContent);\nconst DATA=GAME_DATA.rebirths;');
html=html.replace(/const DROIDEX_ROSTER=\[.*?\];const DROIDEX_VARIANTS=\[.*?\];/,'const DROIDEX_ROSTER=GAME_DATA.roster;const DROIDEX_VARIANTS=GAME_DATA.variants;');
replace('<script>','<script id="game-data" type="application/json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script>\n<script>');
for(const [a,b]of [['cycle>5','cycle>6'],['c<=5','c<=6'],['rb>35','rb>40'],['n<=35','n<=40'],['rb<35','rb<40'],['rb===35','rb===40']])html=html.replaceAll(a,b);
// Preserve the existing last-need calculation, but make its evidence boundary explicit.
replace("label:'SELL AFTER'","label:'REPORTED LAST NEED'");
replace('aria-label="Sell after Rebirth ${sell.last}; final required variant ${sell.variant}"','aria-label="Reported last need at Rebirth ${sell.last}; verify before selling; final required variant ${sell.variant}"');
replace('Minimum required variant · higher variants also satisfy it','Minimum required variant · Scourge also satisfies all variants (FOAD v1.36)');
replace("const creditBadge=row.creditsStatus==='verified-ingame'\n    ? badge('ig','Credits · Verified in game')\n    : badge('pending','Credits · Pending');","const creditBadge=row.creditsStatus==='verified-ingame'?badge('ig','Credits · Verified in game'):badge('pending',row.creditsStatus==='conflicting-community'?'Credits · Exact cost unresolved':'Credits · Community reported');");
replace("const reqBadge=badge('pending','Droid requirements · Pending community');","const reqBadge=row.requirementsStatus==='verified-ingame'?badge('ig','Requirements · Verified in game'):badge('pending','Requirements · Community reported; confirm in game');");
replace("${rb>=28?'<div class=\"note\">RB28–35 are newer endgame rows and are especially useful validation targets during this alpha.</div>':''}",'<div class="note">Reported last need covers this cycle only. Confirm the next requirement in game before selling; also consider fusion, income and Scourgedex turn-ins. Kyber activation requirements and costs need direct confirmation.</div>');
replace('Frozen data snapshot: 2026-08-23 · Community-assisted, developer/in-game-authoritative','DroidAtlas 1.2 · Data review 2026-11-05 · Community tables; official changes separately sourced');
replace('<h3>What this alpha does</h3>','<h3>DroidAtlas 1.2 · Data update</h3><p>The production 1.2 design is unchanged. Six cycles through RB40 are community reported, not directly verified. RB36 exact credits are unresolved. Proto-Roller is Legendary. Scourge Prime is Iconic; its class is unknown.</p><p><a href="https://droidex.dubtrackr.win/droid-tycoon-tools/rebirth-cycles/" target="_blank" rel="noopener">Reported rebirth tables</a> · <a href="https://communities.epicgames.com/thread/patch-notes-v1-35/R5TN" target="_blank" rel="noopener">Official Cycle 6 rework</a> · <a href="https://communities.epicgames.com/thread/patch-notes-v1-36-0/OAFy" target="_blank" rel="noopener">Official Scourge rule</a> · <a href="https://communities.epicgames.com/thread/v1-37-0-patch-notes/DsCl" target="_blank" rel="noopener">Official Scourge Prime</a></p><p>Roster additions and Kyber states are reported in the later local build; current completeness and Scourge eligibility still require in-game verification. Scourge is not inferred as historical acquisition of other variants.</p><button class="close" id="exportCollection">Export collection backup</button>');
replace('and when each required droid is safe to sell in the selected cycle.','and its reported final requirement in the selected cycle. Verify before selling.');
replace('This alpha intentionally leaves Fusion, production optimization, SC spawn rates, and other side systems out unless they become necessary to answer the core Rebirth question.','Droidex records each exact acquired droid/variant historically. Higher variants do not imply lower variants, ownership, or Scourgedex turn-ins. Selling does not clear acquisition history.');
replace('Functionality and data are unchanged from Alpha 0.4.','This build retains the production 1.2 styling; data changes are documented separately.');
replace("const DX_KEY='droidatlas-droidex-v1';let dxState={};try{dxState=JSON.parse(localStorage.getItem(DX_KEY)||'{}')||{}}catch(e){dxState={}}",`const DX_KEY='droidatlas-droidex-v1';let dxState={},dxWritable=true;const dxRaw=localStorage.getItem(DX_KEY);try{dxState=JSON.parse(dxRaw||'{}');if(!dxState||Array.isArray(dxState)||typeof dxState!=='object')throw Error('Invalid collection')}catch(e){dxWritable=false;dxState={}}`);
replace('function saveDx(){localStorage.setItem(DX_KEY,JSON.stringify(dxState))}',`function saveDx(){if(!dxWritable){alert('Saved collection could not be read. Export your backup; the original is unchanged.');return;}if(dxRaw&&!localStorage.getItem(DX_KEY+'-backup-1.2-data-update'))localStorage.setItem(DX_KEY+'-backup-1.2-data-update',dxRaw);localStorage.setItem(DX_KEY,JSON.stringify(dxState))}`);
replace('function toggleDx(n,v){','function toggleDx(n,v){if(!dxWritable){saveDx();return;}');
replace('function bulkDx(n,mode){','function bulkDx(n,mode){if(!dxWritable){saveDx();return;}');
replace('Object.values(dxState).filter(Boolean).length','DROIDEX_ROSTER.reduce((n,d)=>n+dxVariantsFor(d).filter(v=>!!dxState[dxKey(d.name,v)]).length,0)');
replace("if ('serviceWorker' in navigator) {","if (false) { // Standalone data-review file; publishing needs a separately reviewed cache update.");
replace('</body>',`<script>
document.getElementById('exportCollection').onclick=()=>{const backup={schemaVersion:1,exportedAt:new Date().toISOString(),collectionRaw:localStorage.getItem(DX_KEY),backupRaw:localStorage.getItem(DX_KEY+'-backup-1.2-data-update')};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));a.download='DroidAtlas-collection-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
</script></body>`);
// Existing production styling/artwork remain byte-identical; only Kyber's missing plaque is added.
const styles=s=>[...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]);
assert.deepEqual(styles(html.replace(plaqueFix,'')),styles(original));
assert.deepEqual(html.match(/data:image\/[^\s"')]+/g),original.match(/data:image\/[^\s"')]+/g));
fs.writeFileSync(path.join(root,'production-update/DroidAtlas_1.2_Data_Update.html'),html);
console.log('Built production 1.2 data update; original CSS and artwork preserved.');
