/* Build-time theme integration: does not touch game data, logic, or existing CSS. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const release=path.join(root,'release');
const themeRoot=path.join(root,'themes');
const registry=JSON.parse(fs.readFileSync(path.join(themeRoot,'manifest.json'),'utf8'));
assert.equal(registry.schemaVersion,1);
assert.equal(registry.defaultTheme,'default');
assert(registry.themes.length>=1);
const ids=new Set();
for(const t of registry.themes){
 assert(/^[a-z0-9-]{2,32}$/.test(t.id),'Unsafe theme ID');
 assert.equal(t.css,'./themes/'+t.id+'/theme.css');
 assert.equal(t.package,'./themes/'+t.id+'/theme.json');
 assert(!ids.has(t.id),'Duplicate theme ID');ids.add(t.id);
 const desc=JSON.parse(fs.readFileSync(path.join(root,t.package),'utf8'));
 assert.equal(desc.id,t.id);
 assert.equal(desc.css,t.css);
 assert(fs.existsSync(path.join(root,t.css)), 'Missing theme stylesheet');
}
assert(ids.has(registry.defaultTheme));
// Regenerate release theme directory from the registry-backed source packages only.
fs.rmSync(path.join(release,'themes'),{recursive:true,force:true});
fs.cpSync(themeRoot,path.join(release,'themes'),{recursive:true,force:true});

const htmlPath=path.join(root,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
assert(html.includes('id="infoBtn"')&&html.includes('id="closeInfo"'));
assert(html.includes('droidatlas-droidex-v1')&&html.includes('DROIDEX_FUSION_RECIPES'));
const cssLink='<link rel="stylesheet" href="./themes/theme-engine.css" id="da-theme-control-styles">';
const engineScript='<script src="./themes/engine.js" defer></script>';
if(!html.includes(cssLink))html=html.replace('</head>',cssLink+'\n</head>');
if(!html.includes(engineScript))html=html.replace('</body>',engineScript+'\n</body>');
assert(html.includes(cssLink)&&html.includes(engineScript));
fs.writeFileSync(htmlPath,html);
fs.writeFileSync(path.join(release,'index.html'),html);

const workerPath=path.join(root,'service-worker.js');
let worker=fs.readFileSync(workerPath,'utf8');
const files=['./themes/manifest.json','./themes/engine.js','./themes/theme-engine.css'];
for(const item of registry.themes)files.push(item.css,item.package);
const match=worker.match(/const APP_SHELL=(\[[^\]]*\]);/);
assert(match,'Service worker APP_SHELL anchor missing');
const original=[...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(m=>m[1]);
// Drop stale theme paths from earlier previews before regenerating the offline cache manifest.
const updated=[...new Set([...original.filter(item=>!item.startsWith('./themes/')),...files])];
for(const f of files)assert(fs.existsSync(path.join(release,f)),'Missing release asset '+f);
worker=worker.replace(match[0],'const APP_SHELL='+JSON.stringify(updated)+';');
worker=worker.replace(/const CACHE_NAME='droidatlas-[^']+';/,
  "const CACHE_NAME='droidatlas-1.2.6-theme-engine-preview-v1';");
assert(worker.includes('droidatlas-1.2.6-theme-engine-preview-v1'));
fs.writeFileSync(workerPath,worker);
fs.writeFileSync(path.join(release,'service-worker.js'),worker);
console.log('Theme Engine preview: '+registry.themes.length+' local packages; no game-data edits, no published version bump.');

