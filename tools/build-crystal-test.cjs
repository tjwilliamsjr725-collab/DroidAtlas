const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'production-update/DroidAtlas_1.2_Data_Update.html'),'utf8');
const png=fs.readFileSync(path.join(root,'artwork/kyber-plaques/kyber-green-concept-v1.png'));
const rule=`<style id="variant-plaque-fix">
/* Approved image embedded for offline testing; the number remains accessible live text. */
.sellPlate.v-kyber{
 min-width:76px;width:76px;height:38px;padding:0 14px;
 background-image:url("data:image/png;base64,${png.toString('base64')}") !important;
 background-size:108% 150% !important;
 background-position:center !important;
 background-color:transparent !important;
 border-radius:0;box-shadow:none !important;filter:none;
}
</style>`;
assert(source.includes('<style id="variant-plaque-fix">'));
let html=source.replace(/<style id="variant-plaque-fix">[\s\S]*?<\/style>/,()=>rule);
html=html.replace('<title>DroidAtlas</title>','<title>DroidAtlas 1.2 · Crystal Plaque Test</title>');
html=html.replace('DROIDATLAS 1.2</div>','DROIDATLAS 1.2 · CRYSTAL TEST</div>');
fs.writeFileSync(path.join(root,'production-update/DroidAtlas_1.2_Crystal_Test_v1.html'),html);
console.log('Built standalone green crystal image test; data and storage logic unchanged.');
