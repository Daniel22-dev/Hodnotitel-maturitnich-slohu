const APP_ID = 'essay-evaluator';
const STUDIO_URL = 'https://daniel22-dev.github.io/AI-Studio-GHRAB/';
const GUARD_URL = STUDIO_URL + 'access/app-guard.js';
const IMPORT_TIMEOUT_MS = 4500;
const CHECK_TIMEOUT_MS = 8000;

class GuardTimeoutError extends Error { constructor(stage){ super(`Časový limit přístupové brány: ${stage}`); this.name='GuardTimeoutError'; } }
function withTimeout(promise,ms,stage){let timer;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new GuardTimeoutError(stage)),ms);});return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));}
function showFatal(message){
  document.documentElement.dataset.ghrabAccess='denied';
  const box=document.createElement('div');box.className='ghrab-access-fatal';box.innerHTML='<div><h1>Aplikaci se nepodařilo spustit</h1><p></p><p>Obnov stránku nebo aplikaci otevři z AI Studia.</p></div>';box.querySelector('p').textContent=message;document.body.appendChild(box);
}
async function loadApplication(){ await import('./app.js'); }

let guardModule;
try{
  guardModule=await withTimeout(import(GUARD_URL),IMPORT_TIMEOUT_MS,'načtení modulu');
}catch(error){
  showFatal('Přístupovou bránu AI Studia se nepodařilo načíst. Bez platného ověření se Hodnotitel z bezpečnostních důvodů nespustí: '+(error?.message||error));
}

if(guardModule){
  try{
    if(typeof guardModule.protectApp!=='function') throw new Error('Modul přístupové brány neobsahuje protectApp().');
    const allowed=await withTimeout(guardModule.protectApp(APP_ID,{studioUrl:STUDIO_URL}),CHECK_TIMEOUT_MS,'ověření oprávnění');
    if(allowed) await loadApplication();
    else document.documentElement.dataset.ghrabAccess='denied';
  }catch(error){
    showFatal('Přístupovou bránu se nepodařilo bezpečně ověřit. Aplikace zůstává uzamčena: '+(error?.message||error));
  }
}
