// Prefer the project's installed dependency; allow an explicit module location for managed runtimes.
try{module.exports=require('playwright');}catch{
 module.exports=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_MODULE_PATH,'C:/Users/VDAX/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'].filter(Boolean)}));
}
