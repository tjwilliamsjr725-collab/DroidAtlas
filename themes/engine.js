/* DroidAtlas Theme Engine v0.1
 * Independent of Rebirth, Fusion, Droidex and their localStorage keys.
 * Theme identifiers and stylesheet URLs come only from the same-origin registry.
 */
(() => {
  'use strict';
  const STORAGE_KEY='droidatlas-theme-v1';
  const DEFAULT_ID='default';
  const registryURL='./themes/manifest.json';
  const FALLBACK=[
    {id:'default',name:'Default',description:'Original orange-and-blue command theme',css:'./themes/default/theme.css'},
    {id:'steel-night',name:'Steel Night (Preview)',description:'Dark steel experimental shell',css:'./themes/steel-night/theme.css'}
  ];
  const root=document.documentElement;
  let themes=FALLBACK;
  let active=DEFAULT_ID;
  let switching=0;
  let controls=null;
  function saved(){
    try{const stored=localStorage.getItem(STORAGE_KEY);return stored==='kyber-crystal'?DEFAULT_ID:(stored||DEFAULT_ID);}
    catch(_){return DEFAULT_ID;}
  }
  function store(id){
    try{localStorage.setItem(STORAGE_KEY,id);}catch(_){/* Private browsing */ }
  }
  function savedLegacyAlias(){
    try{return localStorage.getItem(STORAGE_KEY)==='kyber-crystal';}catch(_){return false;}
  }
  function validEntries(input){
    if(!Array.isArray(input)||input.length===0||input.length>20)throw Error('Invalid theme registry');
    const ids=new Set();
    for(const entry of input){
      if(!entry||typeof entry.id!=='string'||!/^[a-z0-9-]{2,32}$/.test(entry.id)||
         typeof entry.name!=='string'||entry.name.length>50||
         entry.css!=='./themes/'+entry.id+'/theme.css'||ids.has(entry.id)){
        throw Error('Unsafe or duplicate theme package');
      }
      ids.add(entry.id);
    }
    if(!ids.has(DEFAULT_ID))throw Error('Default theme is missing');
    return input;
  }
  async function readRegistry(){
    try{
      const response=await fetch(registryURL,{cache:'no-cache'});
      if(!response.ok)throw Error('Theme registry not available');
      const data=await response.json();
      if(data.schemaVersion!==1||data.defaultTheme!==DEFAULT_ID)throw Error('Unsupported registry');
      return validEntries(data.themes);
    }catch(error){
      // Keep the canonical default usable if launched from a local HTML file.
      return FALLBACK;
    }
  }
  function status(message){
    if(controls)controls.status.textContent=message;
  }
  async function switchTo(id,{persist=true}={}){
    const target=themes.find(theme=>theme.id===id);
    if(!target)throw Error('Theme not registered');
    const ticket=++switching;
    if(target.id===DEFAULT_ID){
      document.getElementById('da-active-theme-sheet')?.remove();
      root.setAttribute('data-da-theme',DEFAULT_ID);
      active=DEFAULT_ID;
      if(persist)store(active);
      status('Default orange-and-blue theme active.');
      return active;
    }
    status('Loading '+target.name+'…');
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.media='not all'; // Load without displaying it until the package succeeds.
    link.href=target.css;
    const ready=new Promise((resolve,reject)=>{
      link.onload=()=>resolve();
      link.onerror=()=>reject(Error('Theme stylesheet unavailable'));
    });
    document.head.appendChild(link);
    try{
      await ready;
      if(ticket!==switching){link.remove();return active;}
      const previous=document.getElementById('da-active-theme-sheet');
      if(previous)previous.remove();
      link.id='da-active-theme-sheet';
      link.media='all';
      root.setAttribute('data-da-theme',target.id);
      active=target.id;
      if(persist)store(active);
      status(target.name+' active. Collection history is unaffected.');
      return active;
    }catch(error){
      link.remove();
      if(ticket===switching)status('Theme unavailable. Previous appearance retained.');
      throw error;
    }
  }
  function mountControls(){
    const dialog=document.getElementById('info');
    const close=document.getElementById('closeInfo');
    if(!dialog||!close)throw Error('DroidAtlas About dialog unavailable');
    if(document.getElementById('da-theme-settings'))return;
    const section=document.createElement('section');
    section.id='da-theme-settings';
    section.setAttribute('aria-label','Theme settings');
    const h=document.createElement('h4');h.textContent='Appearance · Theme Engine';
    const label=document.createElement('label');
    label.htmlFor='da-theme-select';label.textContent='Select theme';
    const select=document.createElement('select');
    select.id='da-theme-select';
    for(const theme of themes){
      const opt=document.createElement('option');
      opt.value=theme.id; opt.textContent=theme.name;
      select.appendChild(opt);
    }
    select.value=active;
    const info=document.createElement('p');
    info.textContent='Themes change appearance only. Your exact-variant Droidex collection, Rebirth position, and Fusion data remain separate.';
    const reset=document.createElement('button'); reset.type='button';
    reset.id='da-theme-reset';reset.textContent='Restore Kyber Crystal';
    const response=document.createElement('p');
    response.id='da-theme-status';response.setAttribute('role','status');response.setAttribute('aria-live','polite');
    section.append(h,label,select,info,reset,response);
    dialog.insertBefore(section,close);
    controls={select,status:response};
    select.addEventListener('change',async()=>{
      select.disabled=true;
      try{await switchTo(select.value);}
      catch(_){select.value=active;}
      finally{select.disabled=false;}
    });
    reset.addEventListener('click',async()=>{
      await switchTo(DEFAULT_ID);
      select.value=DEFAULT_ID;
    });
  }
  async function start(){
    themes=await readRegistry();
    const requested=saved();
    // Silently migrate the old misnamed preview preference without altering Droidex keys.
    if(requested===DEFAULT_ID&&savedLegacyAlias())store(DEFAULT_ID);
    if(!themes.some(x=>x.id===requested))store(DEFAULT_ID);
    mountControls();
    try{await switchTo(themes.some(x=>x.id===requested)?requested:DEFAULT_ID,{persist:false});}
    catch(_){await switchTo(DEFAULT_ID,{persist:false});store(DEFAULT_ID);}
    controls.select.value=active;
  }
  // Exposes a small controlled API for automated tests and future settings UI.
  window.DroidAtlasThemes=Object.freeze({
    getActive:()=>active,
    getAvailable:()=>themes.map(({id,name})=>({id,name})),
    set:async id=>{
      const value=await switchTo(id);
      if(controls)controls.select.value=value;
      return value;
    },
    reset:async()=>{
      const value=await switchTo(DEFAULT_ID);
      if(controls)controls.select.value=value;
      return value;
    }
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
