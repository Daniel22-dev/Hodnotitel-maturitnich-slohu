const APP_ID = 'essay-evaluator';
const STUDIO_URL = 'https://daniel22-dev.github.io/AI-Studio-GHRAB/';
const GUARD_URL = STUDIO_URL + 'access/app-guard.js';
const IMPORT_TIMEOUT_MS = 4500;
const CHECK_TIMEOUT_MS = 8000;

class GuardTimeoutError extends Error { constructor(stage){ super(`Časový limit přístupové brány: ${stage}`); this.name='GuardTimeoutError'; } }
function withTimeout(promise,ms,stage){ return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new GuardTimeoutError(stage)),ms))]); }
function addOfflineWarning(reason){
  document.documentElement.dataset.ghrabAccess='granted';
  const banner=document.createElement('div');
  banner.className='ghrab-offline-access-warning';
  banner.setAttribute('role','status');
  banner.textContent='Nouzový offline režim: přístupovou bránu AI Studia se nepodařilo ověřit. Aplikace je dostupná, ale revokace a aktuální oprávnění nebyly zkontrolovány.';
  banner.title=String(reason?.message||reason||'Brána nedostupná');
  document.body.prepend(banner);
}
function showFatal(message){
  document.documentElement.dataset.ghrabAccess='denied';
  const box=document.createElement('div');box.className='ghrab-access-fatal';box.innerHTML='<div><h1>Aplikaci se nepodařilo spustit</h1><p></p><p>Obnov stránku nebo aplikaci otevři z AI Studia.</p></div>';box.querySelector('p').textContent=message;document.body.appendChild(box);
}
async function loadApplication(){ await import('./app.js'); }

let guardModule;
try{
  guardModule=await withTimeout(import(GUARD_URL),IMPORT_TIMEOUT_MS,'načtení modulu');
}catch(error){
  addOfflineWarning(error);
  try{await loadApplication();}catch(appError){showFatal('Lokální soubory aplikace nejsou dostupné: '+(appError?.message||appError));}
}

if(guardModule){
  try{
    if(typeof guardModule.protectApp!=='function') throw new Error('Modul přístupové brány neobsahuje protectApp().');
    const allowed=await withTimeout(guardModule.protectApp(APP_ID,{studioUrl:STUDIO_URL}),CHECK_TIMEOUT_MS,'ověření oprávnění');
    if(allowed) await loadApplication();
    else document.documentElement.dataset.ghrabAccess='denied';
  }catch(error){
    if(error instanceof GuardTimeoutError || navigator.onLine===false){
      addOfflineWarning(error);
      try{await loadApplication();}catch(appError){showFatal('Lokální soubory aplikace nejsou dostupné: '+(appError?.message||appError));}
    }else{
      showFatal('Přístupovou bránu se nepodařilo bezpečně ověřit: '+(error?.message||error));
    }
  }
}
