
function updatePromptPreview(){
  if(!$('promptPreview')) return;
  const sample = state.inputMode==='batch' ? (batchStudents.find(s=>String(s.text||'').trim() || (s.files||[]).length) || null) : null;
  const p = buildPrompt(sample);
  $('promptPreview').textContent=p.slice(0,14000)+(p.length>14000?'\n\n[ZKRÁCENÝ NÁHLED – skutečný prompt pokračuje]':'');
}

function normalizeModelName(s){ return String(s||'').trim().replace(/^models\//i,''); }
function isValidModelName(s){ return /^[A-Za-z0-9][A-Za-z0-9._-]{1,80}$/.test(normalizeModelName(s)); }
function resolveGeminiModel(){ const fromInput=normalizeModelName($('geminiModelInput')?.value||''); if(fromInput && isValidModelName(fromInput)) return fromInput; return (geminiModel&&isValidModelName(geminiModel))?normalizeModelName(geminiModel):GEMINI_MODEL_DEFAULT; }
function setGeminiModel(m){ const norm=normalizeModelName(m); if(norm && isValidModelName(norm)){ geminiModel=norm; safeLocalSet(GEMINI_MODEL_SK,geminiModel); const inp=$('geminiModelInput'); if(inp && norm!==inp.value.trim()) inp.value=norm; } updateGeminiModelUI(); }
function loadGeminiModel(){ let stored=''; stored=safeLocalGet(GEMINI_MODEL_SK)||''; geminiModel=(stored&&isValidModelName(stored))?normalizeModelName(stored):GEMINI_MODEL_DEFAULT; const inp=$('geminiModelInput'); if(inp) inp.value=geminiModel; updateGeminiModelUI(); }
function resetGeminiModel(){ const inp=$('geminiModelInput'); if(inp) inp.value=GEMINI_MODEL_DEFAULT; setGeminiModel(GEMINI_MODEL_DEFAULT); }
function updateGeminiModelUI(){
  const el=$('geminiModelStatus'); if(!el) return;
  const live=normalizeModelName($('geminiModelInput')?.value||'');
  if(live && !isValidModelName(live)){ el.textContent='neplatný název — používá se '+resolveGeminiModel(); el.style.color='var(--err)'; return; }
  const m=resolveGeminiModel();
  const known=geminiAvailableModels.includes(m);
  const api=geminiAvailableModelsApiVersion?` · ověřeno přes ${geminiAvailableModelsApiVersion}`:'';
  el.textContent=(m===GEMINI_MODEL_DEFAULT)?'výchozí ('+GEMINI_MODEL_DEFAULT+')'+api:(known?'ověřený model: ':'vlastní: ')+m+api;
  el.style.color=known?'var(--ok)':(m===GEMINI_MODEL_DEFAULT?'var(--t4)':'var(--acc)');
  const sel=$('geminiModelSelect'); if(sel && geminiAvailableModels.length){ sel.value=geminiAvailableModels.includes(m)?m:''; }
}
function renderGeminiModelSelect(models,current,apiVersion){
  geminiAvailableModels=Array.isArray(models)?models:[];
  geminiAvailableModelsApiVersion=apiVersion||'';
  const sel=$('geminiModelSelect');
  if(!sel) return;
  if(!geminiAvailableModels.length){ sel.innerHTML='<option value="">Nejdřív ověř modely…</option>'; sel.disabled=true; updateGeminiModelUI(); return; }
  const options=['<option value="">Vyber dostupný model…</option>'].concat(geminiAvailableModels.map(m=>`<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`));
  sel.innerHTML=options.join('');
  sel.disabled=false;
  if(geminiAvailableModels.includes(current)) sel.value=current;
  updateGeminiModelUI();
}
function isEmbeddedBrowserEnv(){ const ua=navigator.userAgent||''; return /FBAN|FBAV|Instagram|Line|wv|Documents|Teams|Outlook|GSA/i.test(ua); }
function applyKeyEnvUI(){ if(!isEmbeddedBrowserEnv()) return; const btn=$('btnSaveKeyPermanent'); if(btn){btn.classList.add('hidden'); btn.disabled=true;} const note=$('geminiNote'); if(note) note.innerHTML='Jsi pravděpodobně ve <strong>vestavěném prohlížeči aplikace</strong>, kde je trvalé uložení nespolehlivé — klíč použij <strong>jen pro relaci</strong>, nebo otevři nástroj v běžném Chrome/Safari.'; }
function getGeminiInputKey(){ return ($('geminiKeyInput')?.value||'').trim(); }
function setGeminiKey(key,scope){ geminiApiKey=String(key||'').trim(); geminiKeyScope=scope || geminiKeyScope || 'session'; const inp=$('geminiKeyInput'); if(inp && geminiApiKey && inp.value!==geminiApiKey) inp.value=geminiApiKey; updateGeminiStatus(); }
function loadGeminiKey(){ let sessionKey='',storedKey=''; sessionKey=safeSessionGet(GEMINI_KEY_SESSION_SK)||''; storedKey=safeLocalGet(GEMINI_KEY_SK)||''; if(sessionKey){ setGeminiKey(sessionKey,'session'); } else if(storedKey){ setGeminiKey(storedKey,'permanent'); } else { setGeminiKey('', 'session'); } }
function persistCurrentKeyForScope(){ const key=getGeminiInputKey(); geminiApiKey=key; if(geminiKeyScope==='session'){ if(key) safeSessionSet(GEMINI_KEY_SESSION_SK,key); else safeSessionRemove(GEMINI_KEY_SESSION_SK); safeLocalRemove(GEMINI_KEY_SK); } if(geminiKeyScope==='permanent'){ if(key) safeLocalSet(GEMINI_KEY_SK,key); else safeLocalRemove(GEMINI_KEY_SK); safeSessionRemove(GEMINI_KEY_SESSION_SK); } updateGeminiStatus(); }
function useGeminiKeyForSession(){ geminiKeyScope='session'; persistCurrentKeyForScope(); toast(getGeminiInputKey()?'Klíč se použije jen pro tuto relaci.':'Zvolen režim relace. Vlož API klíč.','ok'); }
async function saveGeminiKeyPermanent(){
  if(isEmbeddedBrowserEnv()){ toast('V tomto vestavěném prohlížeči je trvalé uložení nespolehlivé. Přepínám na relaci.','warn'); useGeminiKeyForSession(); return; }
  const key=getGeminiInputKey(); if(!key){ toast('Nejdřív vlož API klíč a potom znovu klikni na „Uložit trvale“. Bez potvrzení se do zařízení nic neuloží.','warn'); return; }
  const ok=await uiConfirm('Klíč se uloží do tohoto prohlížeče a zůstane tam i po zavření. Dělej to jen na osobním zařízení. Na sdíleném nebo školním počítači zvol raději „Použít jen pro relaci“.\n\nUložit klíč trvale?','Trvalé uložení API klíče'); if(!ok){ updateGeminiStatus(); return; }
  geminiKeyScope='permanent'; persistCurrentKeyForScope(); toast('API klíč je uložený trvale v tomto prohlížeči.','ok');
}
function clearGeminiKey(){ safeSessionRemove(GEMINI_KEY_SESSION_SK); safeLocalRemove(GEMINI_KEY_SK); geminiApiKey=''; geminiKeyScope='session'; const inp=$('geminiKeyInput'); if(inp) inp.value=''; updateGeminiStatus(); toast('API klíč smazán. Režim je zpět na relaci.','warn'); }
function updateGeminiStatus(){
  const b=$('geminiStatus');
  const inputKey=getGeminiInputKey();
  const storedPermanent=safeLocalGet(GEMINI_KEY_SK)||'';
  const isPermanentConfirmed=Boolean(inputKey&&geminiKeyScope==='permanent'&&storedPermanent===inputKey);
  const isSessionActive=Boolean(inputKey&&geminiKeyScope==='session');
  if(b){
    if(isPermanentConfirmed){b.textContent='✓ Klíč uložen trvale';b.style.color='var(--acc)';}
    else if(isSessionActive){b.textContent='✓ Klíč jen v této relaci';b.style.color='var(--ok)';}
    else if(inputKey){b.textContent='Klíč je vložený, ale trvalé uložení nebylo potvrzeno';b.style.color='var(--acc)';}
    else {b.textContent='Klíč není nastaven – zvolen režim relace';b.style.color='var(--acc)';}
  }
  const sessionBtn=$('btnUseKeySession'),permBtn=$('btnSaveKeyPermanent'),clearBtn=$('btnClearKey');
  sessionBtn?.classList.toggle('key-mode-selected',geminiKeyScope==='session');permBtn?.classList.toggle('key-mode-selected',isPermanentConfirmed);clearBtn?.classList.toggle('key-clear-active',!inputKey);
  sessionBtn?.setAttribute('aria-pressed',String(geminiKeyScope==='session'));permBtn?.setAttribute('aria-pressed',String(isPermanentConfirmed));clearBtn?.setAttribute('aria-pressed',String(!inputKey));
}

const WC_MONTHS = new Set(['january','february','march','april','may','june','july','august','september','october','november','december']);
const WC_NAME_CONNECTORS = new Set(['of','and','the','de','del','la','le','van','von','nad','upon']);
const WC_CAP_STOP = new Set(['I','The','A','An','In','On','At','To','From','For','And','But','Or','If','When','While','Because','Although','However','Therefore','Firstly','Secondly','Finally','In','It','This','That','These','Those','There','Nowadays','Dear','Yours','Sir','Madam','Mr','Mrs','Ms','Miss','Kind','Regards']);
