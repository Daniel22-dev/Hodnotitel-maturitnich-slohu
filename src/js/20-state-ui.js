let suiteSessionLifecycle = null;
function makeInitialState(){ return {
  step:0, workMode:'offline', set:'practice', genre:'opinion', taskIndex:0, evalMode:'deep', outputStyle:'teacher', resultView:'teacher',
  taskTitle:'', taskText:'', taskReqs:'', studentText:'', studentIdentity:'', studentCode:'STUDENT_001', extraPii:'', inputMode:'single', privacyMode:'strict', privacyApprovedHash:'', result:'', teacherReview:{sections:{}, score_total:null, grade:null, note:'', verified:false, verifiedAt:''}
}; }
let tasks = loadTasks();
let state = makeInitialState();
let abortController = null;
let geminiApiKey = '';
let geminiKeyScope = 'session';
let geminiModel = GEMINI_MODEL_DEFAULT;
let geminiAvailableModels = [];
let geminiAvailableModelsApiVersion = '';
let attachedFiles = [];
let batchStudents = [];
let batchResults = [];
const $ = id => document.getElementById(id);

const RESULT_JSON_START = '=== MACHINE_SUMMARY_JSON ===';
const RESULT_JSON_END = '=== END_MACHINE_SUMMARY_JSON ===';
const RESULT_FEEDBACK_START = '=== FEEDBACK_MARKDOWN ===';
const RESULT_VIEW_MARKERS = {teacher:'=== TEACHER_DETAIL ===', student:'=== STUDENT_FEEDBACK ===', record:'=== RECORD_TABLE ==='};
const RESULT_SECTION_KEYS = ['zadani_a_rozsah','odstavce_a_koherence','lexikalni_a_spellingove_chyby','gramaticke_chyby','obsah','ptn_a_koheze','uroven_slovni_zasoby','uroven_gramatiky'];
const RESULT_SECTION_LABELS = {zadani_a_rozsah:'Zadání a rozsah',odstavce_a_koherence:'Odstavce a koherence',lexikalni_a_spellingove_chyby:'Lexikální a spellingové chyby',gramaticke_chyby:'Gramatické chyby',obsah:'Obsah',ptn_a_koheze:'PTN a koheze',uroven_slovni_zasoby:'Úroveň slovní zásoby',uroven_gramatiky:'Úroveň gramatiky'};
function toast(msg,type='ok'){
  const el=document.createElement('div'); el.className=`toast ${type==='err'?'err':type==='warn'?'warn':''}`; el.textContent=msg; $('toastStack').appendChild(el);
  setTimeout(()=>el.classList.add('visible'),20); setTimeout(()=>{el.classList.remove('visible'); setTimeout(()=>el.remove(),220)},4200);
}

function safeLocalGet(k){ try{return localStorage.getItem(k)}catch(_){return null} }
function appPersistenceBlocked(){ return Boolean(suiteSessionLifecycle?.isPersistenceBlocked?.()); }
function safeLocalSet(k,v){ if(appPersistenceBlocked()) return false; try{localStorage.setItem(k,v); return true}catch(_){return false} }
function safeLocalRemove(k){ try{localStorage.removeItem(k); return true}catch(_){return false} }
function safeSessionGet(k){ try{return sessionStorage.getItem(k)}catch(_){return null} }
function safeSessionSet(k,v){ if(appPersistenceBlocked()) return false; try{sessionStorage.setItem(k,v); return true}catch(_){return false} }
function safeSessionRemove(k){ try{sessionStorage.removeItem(k); return true}catch(_){return false} }

let modalReturnFocus=null;
function hideModal(){
  const modal=$('uiModal');
  modal?.classList.add('hidden');
  if(modal) delete modal.dataset.variant;
  const target=modalReturnFocus;
  modalReturnFocus=null;
  if(target&&typeof target.focus==='function'&&document.contains(target)) setTimeout(()=>target.focus(),0);
}
function showModal(title,body,actions,variant=''){
  const modal=$('uiModal');
  if(modal?.classList.contains('hidden')) modalReturnFocus=document.activeElement;
  if(modal){ if(variant) modal.dataset.variant=variant; else delete modal.dataset.variant; }
  $('uiModalTitle').textContent=title;
  $('uiModalBody').innerHTML=body;
  const a=$('uiModalActions');
  a.innerHTML='';
  actions.forEach(x=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='ui-modal-btn '+(x.className||'');
    b.textContent=x.label;
    if(x.id) b.id=x.id;
    if(x.ariaLabel) b.setAttribute('aria-label',x.ariaLabel);
    b.onclick=()=>{ if(x.close!==false) hideModal(); x.onClick&&x.onClick(); };
    a.appendChild(b);
  });
  modal.classList.remove('hidden');
  setTimeout(()=>a.querySelector('button')?.focus(),0);
}
function uiConfirm(body,title='Potvrzení'){ return new Promise(resolve=>showModal(title, escapeHtml(body).replace(/\n/g,'<br>'), [{label:'Zrušit',onClick:()=>resolve(false)},{label:'Potvrdit',className:'primary',onClick:()=>resolve(true)}])); }
function privacyIntroHtml(){ return `<div class="warn-box"><strong>Než začneš hodnotit:</strong> tento nástroj pracuje se studentskými texty, proto je nutné hlídat osobní údaje ještě před odesláním do AI.</div>
<p><span class="privacy-intro-strong">Co nástroj dělá automaticky:</span></p>
<ul class="privacy-intro-list"><li>u textu a Wordu nahrazuje e-maily, telefony, URL, možné rodné číslo a další rozpoznatelné identifikátory; zadané jméno nahrazuje jako celek i po jednotlivých částech dlouhých alespoň tři znaky,</li><li>při dávce přiděluje kódy typu STUDENT_001, STUDENT_002,</li><li>před odesláním spouští kontrolu citlivých údajů a v Privacy režimu zastaví odeslání, pokud něco najde,</li><li>studentské texty, identitu a výsledky ve výchozím stavu neukládá do trvalého úložiště prohlížeče; obnovu citlivé relace je nutné zapnout ručně,</li><li>Apps Script tajemství a backendový přístupový token se neukládají ani při zapnuté obnově citlivé relace,</li><li>mapu anonymizace drží jen lokálně v prohlížeči a neposílá ji do Gemini.</li></ul>
<p style="margin-top:10px"><span class="privacy-intro-strong">Co musí udělat uživatel:</span></p>
<ul class="privacy-intro-list"><li>zkontrolovat náhled „co odejde do AI“,</li><li>doplnit do anonymizačního seznamu jména, školu, třídu, město, adresu nebo jiné údaje, které aplikace nemusela poznat; skloňované tvary, přezdívky a varianty jmen je nutné uvést samostatně,</li><li>u fotek a PDF zkontrolovat, zda není jméno vidět přímo v obrázku; jednosouborový nástroj neumí obrázek lokálně spolehlivě začernit,</li><li>API klíč se neukládá trvale; v přímém režimu zůstává jen do zavření relace,</li><li>zvolit API režim pouze tehdy, když opravdu chceš automatické hodnocení přes Gemini; offline příprava a ruční AI režim API klíč nepotřebují.</li></ul>
<div class="ok-box" style="margin-top:12px"><strong>Doporučený bezpečný postup:</strong> Word nebo vložený text → doplnit jméno a další údaje → spustit kontrolu citlivých údajů → nahradit nebo potvrdit nálezy → zvolit offline / ruční AI / Gemini API podle potřeby.</div>`; }
function showPrivacyIntro(force=false){
  if(!force){ if(safeLocalGet(PRIVACY_ACK_SK)===APP_VERSION) return; }
  showModal('Ochrana osobních údajů a anonymizace', privacyIntroHtml(), [{label:'Rozumím, pokračovat',className:'primary',id:'privacyAckBtn',onClick:()=>{safeLocalSet(PRIVACY_ACK_SK,APP_VERSION)}}]);
}
function showTooltipFor(el){ const tt=$('tooltip'); if(!tt || !el) return; const txt=el.getAttribute('data-tip')||''; if(!txt) return; tt.textContent=txt; tt.setAttribute('aria-hidden','false'); tt.classList.add('visible'); const r=el.getBoundingClientRect(); const pad=10; const maxW=Math.min(310, window.innerWidth-24); tt.style.maxWidth=maxW+'px'; let left=Math.min(Math.max(pad, r.left + r.width/2 - maxW/2), window.innerWidth - maxW - pad); let top=r.bottom + 10; tt.style.left=left+'px'; tt.style.top=top+'px'; const tr=tt.getBoundingClientRect(); if(tr.bottom > window.innerHeight - pad){ top=Math.max(pad, r.top - tr.height - 10); tt.style.top=top+'px'; } }
function hideTooltip(){ const tt=$('tooltip'); if(!tt)return; tt.classList.remove('visible'); tt.setAttribute('aria-hidden','true'); }
function initTooltips(){ document.querySelectorAll('.tt-icon[data-tip]').forEach(el=>{ el.setAttribute('aria-label','Nápověda: '+(el.getAttribute('data-tip')||'')); el.addEventListener('mouseenter',()=>showTooltipFor(el)); el.addEventListener('mouseleave',hideTooltip); el.addEventListener('focus',()=>showTooltipFor(el)); el.addEventListener('blur',hideTooltip); el.addEventListener('click',e=>{e.preventDefault(); e.stopPropagation(); const tt=$('tooltip'); if(tt?.classList.contains('visible') && tt.textContent===(el.getAttribute('data-tip')||'')) hideTooltip(); else showTooltipFor(el);}); }); document.addEventListener('click',hideTooltip); window.addEventListener('scroll',hideTooltip,{passive:true}); window.addEventListener('resize',hideTooltip); }

const CHANGELOG_MAX_ENTRIES = 10;
const CHANGELOG = [
  {version:APP_VERSION, date:'27. 9. 2026', title:'Sjednocená karta O aplikaci', items:['Přidána společná sekce O aplikaci s identitou projektu, autorem, určením, technickým stavem a provozními zásadami.', 'Samostatný Deník změn byl přesunut do sbaleného Katalogu změn uvnitř této sekce.']},
  {version:'1.5.29', date:'25. 9. 2026', title:'GARP 2.7 r2 / G-02', items:['Aktivní bezpečnostní autorita přešla na GARP 2.7 r2 / G-02; GARP 2.5.1/N5 zůstává regresní vrstvou.', 'Školní profil zůstává nepřipojený a LIVE stav je NOT_TESTED.']},
  {version:'1.5.28', date:'17. 9. 2026', title:'Oprava dispatch payloadu', items:['Opraven limit GitHub REST API pro app-updated payload; release identita se přenáší v jednom vnořeném objektu.']},
  {version:'1.5.27', date:'17. 9. 2026', title:'Integrita toolingu a release identity', items:['Fail-closed kontrola GARP toolingu, SBOM/provenance/evidence a živé release identity byla rozšířena o trvalé regrese.']},
  {version:'1.5.26', date:'15. 9. 2026', title:'N5 scanner a deploy governance', items:['Secret scanner pokrývá další typy privátních klíčů a deploy vyžaduje chráněnou main i required check p5-release-gate.']},
  {version:'1.5.25', date:'7. 9. 2026', title:'GARP 2.5.1 assurance cleanup', items:['Doplněny přepočítávané assurance vazby, negativní kontroly a nezávislé SCA ověření.']},
  {version:'1.5.24', date:'7. 9. 2026', title:'Service Worker boundary hardening', items:['Service Worker přešel na explicitní static allowlist a bezpečnostní hranice dostala behaviorální regresní testy.']},
  {version:'1.5.23', date:'7. 9. 2026', title:'GARP 2.5.1 SHIELD-PREP', items:['Security-critical assety byly vyřazeny z precache/cache-first cest a vydávají se pouze přes síť bez cache.']},
  {version:'1.5.22', date:'5. 9. 2026', title:'P5 acceptance gate hotfix', items:['P5 gate rozlišuje legacy pre-upload stav od ecosystem-wave kandidáta bez oslabení fail-closed podmínek.']},
  {version:'1.5.21', date:'5. 9. 2026', title:'Runtime bootstrap hotfix', items:['Odstraněno neexistující volání renderRelease() a přidána regrese všech app-owned startup hooků.']},
];
function latestChangelog(){ return CHANGELOG.slice(0, CHANGELOG_MAX_ENTRIES); }
function aboutChangelogHtml(){
  return latestChangelog().map((entry,index)=>`<article class="about-changelog-entry${index===0?' current':''}"><header><b>v${escapeHtml(entry.version)}</b><span>${escapeHtml(entry.date)}</span></header><h4>${escapeHtml(entry.title)}</h4><ul>${entry.items.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></article>`).join('');
}
function aboutHtml(){
  return `<div class="about-modal-content">
    <section class="about-identity-card">
      <div class="about-app-mark" aria-hidden="true"><img src="icons/hodnotitel-shield-20260711-192.png" alt=""></div>
      <div><span class="about-eyebrow">HODNOTITEL MATURITNÍCH SLOHŮ</span><h2>Školní hodnoticí studio</h2><p>Důkazní hodnocení maturitních slohů podle pevné školní rubriky, ochrana citlivých údajů a finální kontrola učitele v jednom pracovním toku.</p><span class="about-version">v${escapeHtml(APP_VERSION)}</span></div>
    </section>
    <section class="about-facts-grid" aria-label="Identita a projekt">
      <article><span>AUTOR A VÝVOJOVÝ GARANT</span><h3>Daniel Baláž</h3><p>Koncepce, návrh funkcí, metodické vedení a vývoj aplikace.</p></article>
      <article><span>ŠKOLNÍ PROJEKT</span><h3>Gymnázium, Ostrava-Hrabůvka</h3><p>Interní nástroj AI Studia GHRAB určený pro práci učitele s maturitními slohy.</p></article>
      <article><span>PŘÍSTUP A URČENÍ</span><h3>Pro učitele s přístupem z AI Studia</h3><p>Aplikace podporuje hodnocení a přípravu zpětné vazby; konečné pedagogické rozhodnutí a schválení výsledku zůstává na učiteli.</p></article>
      <article><span>TECHNICKÝ STAV</span><h3>v${escapeHtml(APP_VERSION)} · PWA</h3><p>GHRAB Platform 1.1.2 · AI Core 1.0.0 · GARP 2.7 r2 / G-02. Školní server je připraven, ale zatím nepřipojen; LIVE stav je NOT_TESTED.</p></article>
    </section>
    <section class="about-principles" aria-labelledby="aboutPrinciplesTitle">
      <div class="about-section-heading"><span>PROVOZNÍ ZÁSADY</span><h3 id="aboutPrinciplesTitle">Co je dobré vědět</h3></div>
      <div class="about-principles-grid">
        <article><span>01</span><h4>Práce s daty</h4><p>Studentský obsah může obsahovat osobní údaje. Pseudonymizace není anonymizace; citlivé pracovní kopie se řídí relací a retenčním pravidlem 30 dnů. Export vzniká pouze na výslovnou akci učitele.</p></article>
        <article><span>02</span><h4>AI je podklad</h4><p>AI připravuje analýzu a důkazy. Aplikace uplatňuje školní rubriku a validační pravidla, ale výsledné hodnocení musí projít finální kontrolou učitele.</p></article>
        <article><span>03</span><h4>Režimy zpracování</h4><p>K dispozici je offline příprava, ruční AI režim a přímé Gemini API. Školní gateway je připravená jako budoucí profil, v aktuálním provozu není připojená.</p></article>
        <article><span>04</span><h4>Bezpečnostní vrstva</h4><p>Aktivní autoritou je GARP 2.7 r2 / G-02; GARP 2.5.1/N5 zůstává povinnou regresní baseline. Přístup i release cesta jsou fail-closed.</p></article>
      </div>
    </section>
    <details class="about-changelog" id="aboutChangelog">
      <summary><span><b>Katalog změn</b><small>Posledních ${CHANGELOG_MAX_ENTRIES} vydání aplikace</small></span><span class="about-changelog-toggle" aria-hidden="true"></span></summary>
      <div class="about-changelog-list">${aboutChangelogHtml()}</div>
    </details>
  </div>`;
}
function showAbout(){ showModal('O aplikaci',aboutHtml(),[{label:'Zavřít',className:'primary'}],'about'); }

function buildPersistentTaskSnapshot(sourceTasks=tasks){
  const snapshot=cloneTaskData(sourceTasks||makeDefaultTasks());
  // Ostrá zadání jsou důvěrný učitelský obsah: do persistentního localStorage nikdy nejdou.
  snapshot.exam=cloneTaskData(makeDefaultTasks().exam);
  return snapshot;
}
function loadTasks(){
  try{
    const sessionRaw=safeSessionGet(TASK_SESSION_STORAGE_KEY);
    if(sessionRaw) return mergeTasks(makeDefaultTasks(), JSON.parse(sessionRaw));
  }catch(e){}
  try{
    const raw=safeLocalGet(TASK_STORAGE_KEY);
    if(raw){
      const loaded=mergeTasks(makeDefaultTasks(), JSON.parse(raw));
      // Migrace starších verzí: historický obsah ostré sady přesunout pouze do session
      // a persistentní kopii okamžitě redigovat na placeholdery.
      safeSessionSet(TASK_SESSION_STORAGE_KEY,JSON.stringify(loaded));
      safeLocalSet(TASK_STORAGE_KEY,JSON.stringify(buildPersistentTaskSnapshot(loaded)));
      return loaded;
    }
  }catch(e){}
  return makeDefaultTasks();
}
function normalizeImportedTask(setId,genreId,item,index){
  const source=item&&typeof item==='object'?item:{};
  const fallback=placeholderTask(setId,genreId,index+1);
  const task={...fallback};
  task.id=String(source.id||fallback.id);
  task.number=Number.isFinite(Number(source.number))?Number(source.number):index+1;
  task.title=String(source.title||fallback.title);
  task.taskText=String(source.taskText||'');
  task.requirements=Array.isArray(source.requirements)?source.requirements.map(x=>String(x||'').trim()).filter(Boolean):[];
  task.sourceFile=String(source.sourceFile||'');
  task.isPlaceholder=!task.taskText.trim();
  return task;
}
function mergeTasks(base, incoming){
  if(!incoming || typeof incoming !== 'object') return base;
  for(const setId of ['practice','exam']){
    if(!incoming[setId] || typeof incoming[setId]!=='object') continue;
    for(const g of GENRES){
      const arr=incoming[setId][g.id];
      if(Array.isArray(arr) && arr.length) base[setId][g.id]=arr.map((item,i)=>normalizeImportedTask(setId,g.id,item,i));
    }
  }
  return base;
}
function saveTasks(){
  const sessionOk=safeSessionSet(TASK_SESSION_STORAGE_KEY,JSON.stringify(tasks));
  const localOk=safeLocalSet(TASK_STORAGE_KEY,JSON.stringify(buildPersistentTaskSnapshot(tasks)));
  return sessionOk&&localOk;
}
function sensitiveSaveEnabled(){ return safeLocalGet(SENSITIVE_SAVE_PREF_SK)==='1'; }
function sensitiveSnapshotExpired(savedAt){const ts=Date.parse(String(savedAt||''));return !Number.isFinite(ts)||Date.now()-ts>SENSITIVE_RETENTION_MS;}
function purgeLegacySensitiveStorage(){ LEGACY_STATE_KEYS.forEach(k=>safeLocalRemove(k)); }
function clearAllSavedState(){ safeLocalRemove(STORAGE_KEY); safeLocalRemove(TASK_STORAGE_KEY); safeLocalRemove(SENSITIVE_SAVE_PREF_SK); safeSessionRemove(TASK_SESSION_STORAGE_KEY); safeLocalRemove('maturitniHodnotitelPseudonymousHistoryV130'); safeSessionRemove(GEMINI_KEY_SESSION_SK); safeLocalRemove(GEMINI_KEY_SK); clearBatchProgress(); purgeLegacySensitiveStorage(); safeLocalRemove('maturitniHodnotitelStateV100'); }
function prepareSuiteSessionCleanup(){ try{abortController?.abort?.();}catch(_){} abortController=null; try{clearTimeout(batchProgressSaveTimer);}catch(_){} batchProgressSaveTimer=0; }
function scrubSuiteSessionRuntime(){
  geminiApiKey=''; geminiKeyScope='session'; geminiAvailableModels=[]; geminiAvailableModelsApiVersion='';
  state=makeInitialState(); tasks=makeDefaultTasks(); attachedFiles=[]; batchStudents=[]; batchResults=[];
  try{window.__GHRAB_ESSAY_WORKFLOW_ID__='';}catch(_){}
}
function suiteCleanupFailure(result){ try{toast('Bezpečné ukončení relace se nepodařilo dokončit. Data se nebudou znovu ukládat; obnov stránku až po kontrole úložiště.','err');}catch(_){} console.error('[suite-session] cleanup failed', result); }
async function endSensitiveWork(){
  if(suiteSessionLifecycle?.clearLocalWork){
    const result=await suiteSessionLifecycle.clearLocalWork('local-end-sensitive-work');
    if(!result.ok) return false;
    return true;
  }
  suiteCleanupFailure({ok:false,failures:['suite-lifecycle-unavailable']});
  return false;
}
function purgeSensitiveSavedState(){
  try{
    const raw=safeLocalGet(STORAGE_KEY); if(raw){ const data=JSON.parse(raw); SENSITIVE_STATE_FIELDS.forEach(k=>{ data[k]=k==='roster'?[]:''; }); if(data.reportSettings)data.reportSettings={...data.reportSettings,signature:'',customComments:[]}; safeLocalSet(STORAGE_KEY, JSON.stringify(data)); }
  }catch(_){}
  safeLocalRemove('maturitniHodnotitelPseudonymousHistoryV130');
  clearBatchProgress();
  purgeLegacySensitiveStorage();
}

function batchResultDone(code){
  return batchResults.some(r=>r&&r.code===code&&['hotovo','kontrola'].includes(r.status)&&String(r.result||'').trim());
}
function batchResultByCode(code){ return batchResults.find(r=>r && r.code===code); }
function upsertBatchResult(item){
  const idx=batchResults.findIndex(r=>r && r.code===item.code);
  if(idx>=0) batchResults[idx]=Object.assign({},batchResults[idx],item);
  else batchResults.push(item);
  saveBatchProgress();
}
function resetBatchResultsOnly(){
  batchResults=[];
  batchStudents.forEach(s=>{ if(['hotovo','kontrola','chyba','čeká na pokračování'].includes(s.status)) s.status='čeká'; });
  clearBatchProgress();
  renderBatchList(); renderResult(); saveState();
  toast('Výsledky dávky byly vymazány. Studenti v dávce zůstali.','warn');
}
let batchProgressSaveTimer=0;
let batchPersistenceWarningShown=false;
function warnBatchPersistenceFailure(){if(batchPersistenceWarningShown)return;batchPersistenceWarningShown=true;toast('Průběh dávky se nepodařilo uložit do úložiště prohlížeče. Stáhni si průběžný export nebo zmenši dávku; přílohy se do snapshotu neukládají.','warn');}
function saveBatchProgress(){
  if(!batchStudents.length && !batchResults.length){ clearBatchProgress(); return true; }
  let sessionRaw='',localRaw='';
  try{
    sessionRaw=JSON.stringify(buildBatchProgressSnapshot());
    if(sensitiveSaveEnabled()) localRaw=JSON.stringify(buildBatchProgressSnapshot({persistent:true}));
  }catch(_){warnBatchPersistenceFailure();return false;}
  const sessionOk=safeSessionSet(BATCH_PROGRESS_SESSION_SK,sessionRaw);
  const localOk=sensitiveSaveEnabled()?safeLocalSet(BATCH_PROGRESS_LOCAL_SK,localRaw):safeLocalRemove(BATCH_PROGRESS_LOCAL_SK);
  if(!sessionOk||!localOk){warnBatchPersistenceFailure();return false;}
  batchPersistenceWarningShown=false;return true;
}
function scheduleBatchProgressSave(delay=550){clearTimeout(batchProgressSaveTimer);batchProgressSaveTimer=setTimeout(()=>saveBatchProgress(),delay);}
function clearBatchProgress(){ safeSessionRemove(BATCH_PROGRESS_SESSION_SK); safeLocalRemove(BATCH_PROGRESS_LOCAL_SK); }
function init(){
  purgeLegacySensitiveStorage();
  const restored = loadState(); const batchRestored = tryRestoreBatchProgress(); if(restored || batchRestored) $('restoreBanner').classList.remove('hidden');
  const theme=safeLocalGet('maturitniHodnotitelTheme'); if(theme==='light') document.body.classList.add('light'); updateThemeBtn();
  loadGeminiKey(); loadGeminiModel();
  bindEvents(); initTooltips(); renderAll(); renderPrivacyMode(); renderWorkMode();
  if(!String(state.taskText||'').trim() && !String(state.taskTitle||'').trim()) fillTaskFieldsFromSelection(); else syncFieldsFromState();
  renderFiles(); renderBatchList(); updateStats(); updatePromptPreview(); applyKeyEnvUI(); setTimeout(()=>showPrivacyIntro(false),80);
}

async function toggleAppFullscreen(){
  const active=document.body.classList.toggle('focus-fullscreen');
  const btn=$('btnFs');
  if(btn){
    btn.textContent=active?'⤢':'⛶';
    btn.title=active?'Ukončit zvětšené zobrazení':'Zvětšené zobrazení';
    btn.setAttribute('aria-label', active?'Ukončit zvětšené zobrazení':'Zvětšit zobrazení');
  }

  const isMobileLayout = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  const isLocalContent = String(location.protocol || '').startsWith('content') || String(location.href || '').startsWith('content:');
  const allowNativeFullscreen = !isMobileLayout && !isLocalContent && document.fullscreenEnabled;

  try{
    if(active && allowNativeFullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen){
      await document.documentElement.requestFullscreen();
    }
    if(!active && document.fullscreenElement && document.exitFullscreen){
      await document.exitFullscreen();
    }
  }catch(e){
    // Nativní fullscreen je jen bonus. Bezpečný CSS režim zůstává funkční i na mobilech a content:// souborech.
  }

  if(active){
    setTimeout(()=>{ try{ window.scrollTo({top:0,left:0,behavior:'smooth'}); }catch(_){ window.scrollTo(0,0); } }, 30);
  }
  toast(active?'Zvětšené zobrazení zapnuto.':'Zvětšené zobrazení vypnuto.');
}
function bindEvents(){
  $('btnTheme').onclick=()=>{document.body.classList.toggle('light');safeLocalSet('maturitniHodnotitelTheme',document.body.classList.contains('light')?'light':'dark');updateThemeBtn();};
  $('btnFs').onclick=toggleAppFullscreen;
  $('aboutBtn').onclick=showAbout; $('privacyIntroBtn').onclick=()=>showPrivacyIntro(true); $('clearSavedBtn').onclick=endSensitiveWork; $('endSensitiveWorkBtn')?.addEventListener('click',endSensitiveWork);
  $('next0').onclick=()=>goTo(1); $('back1').onclick=()=>goTo(0); if($('againBtn')) $('againBtn').onclick=()=>goTo(2); $('next1').onclick=()=>{commitTaskFieldsToDb();goTo(2)}; $('back2').onclick=()=>goTo(1); $('next2').onclick=()=>goTo(3); $('back3').onclick=()=>goTo(2); $('next3').onclick=()=>goTo(4); $('back4').onclick=()=>goTo(3); $('newEvalBtn').onclick=()=>{state.studentText='';state.result='';state.studentIdentity='';state.extraPii='';state.teacherReview=defaultTeacherReview();attachedFiles=[];batchStudents=[];batchResults=[];clearBatchProgress();state.privacyApprovedHash='';goTo(0);syncFieldsFromState();renderFiles();renderBatchList();renderResult();updateStats();saveState();};
  ['taskTitle','taskText','taskReqs','studentText','studentIdentity','studentCode','extraPii'].forEach(id=>$(id).addEventListener('input',()=>{state.privacyApprovedHash='';updateStats();updatePromptPreview();saveState(false);renderPrivacyMode();}));
  $('anonymizeBtn').onclick=applyPseudonymizationToField; $('previewAnonBtn').onclick=showAnonPreview; $('clearTextBtn').onclick=()=>{$('studentText').value=''; attachedFiles=[]; syncStateFromFields(); renderFiles(); updateStats(); updatePromptPreview(); saveState();}; $('togglePrivacyBtn')?.addEventListener('click',togglePrivacyMode); $('runPrivacyCheckBtn')?.addEventListener('click',()=>{syncStateFromFields(); renderPrivacyReport(runPrivacyScan(), false);}); $('applyPrivacyFixBtn')?.addEventListener('click',applySelectedPrivacyFindings); $('approvePrivacyBtn')?.addEventListener('click',approvePrivacyCheck); $('toggleSensitiveSaveBtn')?.addEventListener('click',toggleSensitiveStateSaving); $('clearSensitiveSavedBtn')?.addEventListener('click',clearSensitiveSavedData);
  $('fileInput').addEventListener('change',handleFiles); $('transcribeSingleBtn')?.addEventListener('click',transcribeSingleAttachments); const ua=$('uploadArea'); ua.onclick=()=>$('fileInput').click(); ua.addEventListener('dragover',e=>{e.preventDefault(); ua.classList.add('dragover')}); ua.addEventListener('dragleave',()=>ua.classList.remove('dragover')); ua.addEventListener('drop',e=>{e.preventDefault(); ua.classList.remove('dragover'); handleFileList(e.dataTransfer.files)});
  $('batchFileInput')?.addEventListener('change',handleBatchFiles); $('pickBatchFilesBtn')?.addEventListener('click',()=>$('batchFileInput').click()); $('addBatchStudentBtn')?.addEventListener('click',()=>addBatchStudent()); $('clearBatchBtn')?.addEventListener('click',()=>{batchStudents=[];batchResults=[];clearBatchProgress();state.privacyApprovedHash='';renderBatchList();updateStats();saveState();renderPrivacyMode();}); $('clearBatchResultsBtn')?.addEventListener('click',()=>{resetBatchResultsOnly();});
  $('exportTasksBtn').onclick=()=>{const exported=JSON.stringify(tasks,null,2);$('taskJson').value=exported;const containsExam=Object.values(tasks.exam||{}).some(arr=>(arr||[]).some(t=>String(t?.taskText||'').trim()));toast(containsExam?'JSON obsahuje důvěrnou ostrou sadu. Ulož jej pouze do chráněného soukromého úložiště.':'Databáze zadání vypsána do JSON pole.',containsExam?'warn':'ok');};
  $('importTasksBtn').onclick=importTasks; $('resetTasksBtn').onclick=()=>{tasks=makeDefaultTasks(); saveTasks(); renderTasks(); fillTaskFieldsFromSelection(); toast('Vrácena výchozí vestavěná databáze.','warn');};
  document.querySelectorAll('[data-work-mode]').forEach(el=>{el.onclick=()=>{state.workMode=el.dataset.workMode; renderWorkMode(); updateStats(); updatePromptPreview(); saveState();};});
  $('copyManualPromptBtn')?.addEventListener('click',copyPromptWithPrivacyGate); $('downloadPromptBundleBtn')?.addEventListener('click',downloadPromptBundleWithPrivacyGate); $('importManualResultBtn')?.addEventListener('click',importManualResult);
  $('btnUseKeySession').onclick=useGeminiKeyForSession; $('btnSaveKeyPermanent').onclick=saveGeminiKeyPermanent; $('btnClearKey').onclick=clearGeminiKey; $('geminiKeyInput').addEventListener('input',()=>{ geminiApiKey=getGeminiInputKey(); if(geminiKeyScope==='session'){ if(geminiApiKey) safeSessionSet(GEMINI_KEY_SESSION_SK,geminiApiKey); else safeSessionRemove(GEMINI_KEY_SESSION_SK); } updateGeminiStatus(); }); $('geminiModelInput').addEventListener('input',updateGeminiModelUI); $('geminiModelInput').addEventListener('change',e=>setGeminiModel(e.target.value)); $('geminiModelSelect')?.addEventListener('change',e=>{ if(e.target.value) setGeminiModel(e.target.value); }); $('resetModelBtn').onclick=resetGeminiModel; $('checkModelsBtn')?.addEventListener('click',checkGeminiModels); $('toggleKey').onclick=()=>{const i=$('geminiKeyInput'); i.type=i.type==='password'?'text':'password';};
  $('copyPromptBtn').onclick=copyPromptWithPrivacyGate;
  document.querySelectorAll('[data-result-view]').forEach(el=>{el.onclick=()=>{state.resultView=el.dataset.resultView||'teacher'; renderResultViewControls(); renderResult(); saveState();};});
  $('copyResultBtn').onclick=()=>copyText(state.result?composeExportMarkdown(state.resultView,state.result,null):$('resultBox').textContent, 'Zobrazený report zkopírován.');
  $('downloadTxtBtn').onclick=downloadTxt; $('downloadDocxBtn')?.addEventListener('click',downloadDocx); $('printPdfBtn')?.addEventListener('click',printPdfExport); $('downloadCsvBtn')?.addEventListener('click',downloadCsvSummary); $('downloadXlsxBtn')?.addEventListener('click',downloadXlsxSummary); $('downloadEmailBtn')?.addEventListener('click',downloadEmailTemplate); if($('downloadZipBtn')) $('downloadZipBtn').onclick=downloadBatchZip; $('teacherReviewPanel')?.addEventListener('input',handleTeacherReviewInput); $('recalcReviewBtn')?.addEventListener('click',()=>{recalculateTeacherReviewTotal(); syncTeacherReviewFromFields(false); renderResultSummary(state.result); saveState();}); $('applyTeacherReviewBtn')?.addEventListener('click',()=>{syncTeacherReviewFromFields(true); saveState(); renderResult(); toast('Finální kontrola učitele uložena.');}); $('resetTeacherReviewBtn')?.addEventListener('click',()=>{state.teacherReview=defaultTeacherReview(); saveState(); renderResult(); toast('Vrácen AI návrh.','warn');}); $('runBtn').onclick=runEvaluation; $('cancelBtn').onclick=cancelRun;
}
function updateThemeBtn(){ $('btnTheme').textContent = document.body.classList.contains('light')?'🌙':'☀️'; }
function renderAll(){ renderProgress(); renderGenres(); renderTasks(); renderEvalMode(); renderOutputStyle(); renderInputMode(); renderWorkMode(); renderStep(); }
function renderWorkModeLegacy(){
  const mode=state.workMode||'offline';
  document.querySelectorAll('[data-work-mode]').forEach(el=>el.classList.toggle('active',el.dataset.workMode===mode));
  const notes={
    offline:'Offline příprava nic neodesílá mimo prohlížeč. Vytvoří pouze lokální protokol: anonymizace, kontrola citlivých údajů, mechanický RAW počet slov a odstavce. Jazykové hodnocení bez AI neprovádí.',
    manual:'Ruční AI režim API klíč nepotřebuje. Aplikace připraví anonymizovaný prompt, ty ho vložíš do zvoleného AI nástroje a hotovou odpověď můžeš vložit zpět pro export.',
    api:'Gemini API režim automaticky odešle pseudonymizovaný vstup do Gemini až po kliknutí na hodnoticí tlačítko. Používej samostatný API projekt/klíč pro hodnotitel.'
  };
  if($('workModeNote')) $('workModeNote').textContent=notes[mode]||notes.offline;
  $('offlinePanel')?.classList.toggle('hidden',mode!=='offline');
  $('manualPanel')?.classList.toggle('hidden',mode!=='manual');
  $('geminiPanel')?.classList.toggle('api-hidden',mode!=='api');
  if($('runBtn')){
    if(mode==='offline') $('runBtn').innerHTML=state.inputMode==='batch'?'🧭 Vytvořit offline přípravu dávky':'🧭 Vytvořit offline přípravu';
    else if(mode==='manual') $('runBtn').innerHTML=state.inputMode==='batch'?'📋 Připravit prompty pro dávku':'📋 Zkopírovat prompt pro ruční AI';
    else $('runBtn').innerHTML=state.inputMode==='batch'?'📦 Ohodnotit dávku přes Gemini API':'✍️ Ohodnotit sloh přes Gemini API';
  }
}
function renderStep(){
  for(let i=0;i<=4;i++) $('step'+i).classList.toggle('hidden',state.step!==i);
  [...document.querySelectorAll('.progress-seg')].forEach((el,i)=>{el.classList.toggle('done',i<state.step); el.classList.toggle('active',i===state.step);});
  [...document.querySelectorAll('.prog-label')].forEach((el,i)=>{el.classList.toggle('done',i<state.step); el.classList.toggle('active',i===state.step);});
  updateNavState(); updatePromptPreview(); renderChips(); renderWorkMode(); renderResult();
}
function goTo(step){ syncStateFromFields(); state.step=step; renderStep(); saveState(); window.scrollTo({top:0,behavior:'smooth'}); }
function renderGenres(){
  const box=$('genreCards'); box.innerHTML='';
  GENRES.forEach(g=>{const card=document.createElement('div'); card.className='task-card'; card.dataset.genre=g.id; card.innerHTML=`<div class="tc-title">${escapeHtml(g.label)}</div><div class="tc-desc">${escapeHtml(g.desc)}</div><span class="tc-tag">${g.id}</span>`; card.onclick=()=>{state.genre=g.id; state.taskIndex=0; fillTaskFieldsFromSelection(); renderGenres(); renderTasks(); renderChips(); updatePromptPreview(); saveState();}; box.appendChild(card);});
  document.querySelectorAll('[data-genre]').forEach(el=>el.classList.toggle('active',el.dataset.genre===state.genre));
}
function renderTasks(){
  const box=$('taskCards'); box.innerHTML=''; const arr=getTaskArray();
  arr.forEach((t,i)=>{ const missing=!String(t.taskText||'').trim(); const card=document.createElement('div'); card.className='task-card'; card.dataset.taskIndex=i; card.innerHTML=`<div class="tc-title">${escapeHtml(t.title||`Zadání ${i+1}`)}</div><div class="tc-desc">${missing?'Zatím bez pevně vloženého textu zadání.':'Zadání je uložené v databázi.'}</div><span class="tc-tag ${missing?'warn':''}">${missing?'doplnit':'připraveno'}</span>`; card.onclick=()=>{state.taskIndex=i; fillTaskFieldsFromSelection(); renderTasks(); renderChips(); updatePromptPreview(); saveState();}; box.appendChild(card); });
  document.querySelectorAll('[data-task-index]').forEach(el=>el.classList.toggle('active',Number(el.dataset.taskIndex)===state.taskIndex));
  document.querySelectorAll('[data-set]').forEach(el=>el.classList.toggle('active',el.dataset.set===state.set));
  $('examWarning').classList.toggle('hidden',state.set!=='exam');
  document.querySelectorAll('[data-set]').forEach(el=>el.onclick=()=>{state.set=el.dataset.set; state.taskIndex=0; fillTaskFieldsFromSelection(); renderTasks(); renderChips(); updatePromptPreview(); saveState();});
}
function renderInputMode(){
  document.querySelectorAll('[data-input-mode]').forEach(el=>{el.onclick=()=>{state.inputMode=el.dataset.inputMode; renderInputMode(); updateStats(); updatePromptPreview(); saveState();}; el.classList.toggle('active',el.dataset.inputMode===state.inputMode);});
  const batch=state.inputMode==='batch';
  $('batchBox')?.classList.toggle('hidden',!batch); $('singleStudentField')?.classList.toggle('hidden',batch); $('singleAnonField')?.classList.toggle('hidden',batch);
  renderWorkMode();
  renderBatchList();
}
function nextBatchCode(){
  const used=new Set([...batchStudents,...batchResults].map(x=>String(x?.code||'')).filter(Boolean));
  let max=0;
  for(const code of used){const m=code.match(/^STUDENT_(\d+)$/i);if(m)max=Math.max(max,Number(m[1])||0);}
  let next=Math.max(1,max+1),code='';
  do{code='STUDENT_'+String(next++).padStart(3,'0');}while(used.has(code));
  return code;
}
function addBatchStudent(data={}){
  const item=Object.assign({code:nextBatchCode(),identity:'',extraPii:'',text:'',files:[],sourceName:'ruční vstup',status:'čeká'},data);
  const used=new Set([...batchStudents,...batchResults].map(x=>String(x?.code||'')));if(!item.code||used.has(String(item.code)))item.code=nextBatchCode();
  batchStudents.push(item);
  renderBatchList(); updateStats(); updatePromptPreview(); saveState();
}
async function handleBatchFiles(e){ await handleBatchFileList(e.target.files); e.target.value=''; }
async function handleBatchFileList(list){
  const files=Array.from(list||[]); if(!files.length) return;
  for(const f of files){ await processBatchFile(f); }
  renderBatchList(); updateStats(); updatePromptPreview(); saveState();
}
async function processBatchFile(f){
  const code=nextBatchCode(); const ext=fileExt(f.name);
  const item={code,identity:f.name.replace(/\.[^.]+$/,''),extraPii:f.name.replace(/\.[^.]+$/,''),text:'',files:[],sourceName:f.name,status:'čeká'};
  try{
    if(['txt','md','markdown','csv','tsv'].includes(ext) || /^text\//.test(f.type)) item.text=await f.text();
    else if(ext==='docx') item.text=await extractDocxText(f);
    else if(/^image\//.test(f.type) || ['jpg','jpeg','png','webp','gif','heic','heif'].includes(ext)) item.files=[await prepareImageAttachment(f)];
    else if(ext==='pdf' || f.type==='application/pdf'){assertPdfInlineSize(f);item.files=[{name:'PŘÍLOHA_1.pdf',size:f.size,originalSize:f.size,mime:'application/pdf',dataUrl:await readAsDataUrl(f),wasDownscaled:false}];}
    else { toast('Nepodporovaný typ souboru v dávce: '+f.name,'err'); return; }
    batchStudents.push(item); state.privacyApprovedHash=''; saveBatchProgress(); toast('Do dávky přidáno: '+f.name);
  }catch(e){ toast('Soubor '+f.name+' se nepodařilo načíst: '+(e.message||e),'err'); }
}
function renderEvalMode(){
  document.querySelectorAll('[data-mode]').forEach(el=>{el.onclick=()=>{state.evalMode=el.dataset.mode; renderEvalMode(); updateStats(); updatePromptPreview(); saveState();}; el.classList.toggle('active',el.dataset.mode===state.evalMode);});
}
function renderOutputStyle(){
  if(!state.outputStyle) state.outputStyle='teacher';
  if(!state.resultView) state.resultView=state.outputStyle;
  document.querySelectorAll('[data-output-style]').forEach(el=>{
    el.onclick=()=>{state.outputStyle=el.dataset.outputStyle||'teacher'; state.resultView=state.outputStyle; renderOutputStyle(); renderResultViewControls(); renderResult(); updatePromptPreview(); saveState();};
    el.classList.toggle('active',el.dataset.outputStyle===state.outputStyle);
  });
}
function outputStyleLabel(v){ return ({teacher:'Učitelský detail',student:'Pro studenta',record:'Evidence'})[v||'teacher']||'Učitelský detail'; }
function renderResultViewControls(){
  const view=state.resultView||state.outputStyle||'teacher';
  document.querySelectorAll('[data-result-view]').forEach(el=>el.classList.toggle('active',el.dataset.resultView===view));
}
function getTaskArray(){ return tasks[state.set]?.[state.genre] || []; }
function currentTask(){ return getTaskArray()[state.taskIndex] || placeholderTask(state.set,state.genre,state.taskIndex+1); }
function fillTaskFieldsFromSelection(){ const t=currentTask(); state.taskTitle=t.title||''; state.taskText=t.taskText||''; state.taskReqs=(t.requirements||[]).join('\n'); syncFieldsFromState(); updateNavState(); }
function syncFieldsFromState(){ ['taskTitle','taskText','taskReqs','studentText','studentIdentity','studentCode','extraPii'].forEach(id=>{ if($(id)) $(id).value=state[id]||''; }); }
function syncStateFromFields(doCommit=true){ ['taskTitle','taskText','taskReqs','studentText','studentIdentity','studentCode','extraPii'].forEach(id=>{ if($(id)) state[id]=$(id).value; }); if(doCommit && state.step===1) commitTaskFieldsToDb(false); }
function commitTaskFieldsToDb(show=true){
  const arr=getTaskArray(); if(!arr[state.taskIndex]) return;
  arr[state.taskIndex].title=$('taskTitle').value.trim() || arr[state.taskIndex].title;
  arr[state.taskIndex].taskText=$('taskText').value.trim();
  arr[state.taskIndex].requirements=$('taskReqs').value.split('\n').map(x=>x.trim()).filter(Boolean);
  arr[state.taskIndex].isPlaceholder=!arr[state.taskIndex].taskText;
  saveTasks(); renderTasks(); if(show) toast('Zadání je uloženo do lokální databáze v tomto prohlížeči.');
}
function importTasks(){
  try{ const parsed=JSON.parse($('taskJson').value); tasks=mergeTasks(makeDefaultTasks(), parsed); saveTasks(); renderTasks(); fillTaskFieldsFromSelection(); toast('Databáze zadání importována.'); }
  catch(e){ toast('JSON se nepodařilo načíst: '+e.message,'err'); }
}
function hasTaskBasics(){ return String($('taskText').value||state.taskText).trim().length>20 && String($('taskReqs').value||state.taskReqs).trim().length>3; }
function hasStudentText(){ return String($('studentText').value||state.studentText).trim().length>20; }
function hasStudentInput(){ return state.inputMode==='batch' ? batchStudents.some(s=>String(s.text||'').trim() || (s.files||[]).length) : (hasStudentText() || attachedFiles.length>0); }
function updateNavState(){
  if($('next1')) $('next1').disabled = !hasTaskBasics();
  if($('next2')) $('next2').disabled = !hasStudentInput();
  const missing=!String(currentTask().taskText||state.taskText).trim(); $('missingTaskBox')?.classList.toggle('hidden',!missing);
  $('next3').disabled=!state.result;
}
function renderChips(){
  const g=GENRES.find(x=>x.id===state.genre); const setLabel=state.set==='exam'?'Ostrá verze':'Cvičná sada'; const modeLabel={count:'Jen počet slov',standard:'Standardní hodnocení',deep:'Hloubková analýza'}[state.evalMode];
  const workLabel={offline:'Offline příprava',manual:'Ruční AI',api:'Gemini API'}[state.workMode||'offline']; const html=`<span class="chip">${escapeHtml(setLabel)}</span><span class="chip">${escapeHtml(g?.label||state.genre)}</span><span class="chip">Zadání ${state.taskIndex+1}</span><span class="chip">${escapeHtml(workLabel)}</span><span class="chip ${state.evalMode==='deep'?'ok':''}">${escapeHtml(modeLabel)}</span>`;
  ['selectionChips','taskChips2','resultChips'].forEach(id=>{ if($(id)) $(id).innerHTML=html; });
}
function updateStats(){
  syncStateFromFields(false);
  let stats, approxPrompt=0;
  const resultBudget = state.evalMode==='deep'?16000:state.evalMode==='standard'?6500:1600;
  if(state.inputMode==='batch'){
    const total=batchStudents.length;
    const ready=batchStudents.filter(s=>String(s.text||'').trim() || (s.files||[]).length).length;
    const files=batchStudents.reduce((a,s)=>a+(s.files||[]).length,0);
    const sample=batchStudents.find(s=>String(s.text||'').trim() || (s.files||[]).length) || null;
    approxPrompt = sample ? estimateTokens(buildPrompt(sample)) : estimateTokens(buildPrompt());
    stats=[['Studentů v dávce',total],['Připraveno',ready],['Přílohy',files],['Odhad / 1 sloh',approxPrompt+' + výstup']];
  } else {
    const text=getOutboundStudentText().text||''; const wc=localWordCountReport(state.studentText||text, state.taskText||'', state.taskTitle||currentTask().title||'', state.genre||''); approxPrompt=estimateTokens(buildPrompt());
    stats=[['RAW tokeny',wc.rawCount],['Finální slova',wc.finalCount],['Odstavce',wc.paragraphs],['Přílohy',attachedFiles.length]];
  }
  const html=stats.map(x=>`<div class="sum-card"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('');
  if($('localStats')) $('localStats').innerHTML=html;
  if($('finalStats')) $('finalStats').innerHTML=html.replace(' + výstup', state.workMode==='api'?` + cca ${resultBudget}`:(state.workMode==='manual'?' + ruční AI':' + offline'));
  updateNavState(); renderChips(); renderInputMode();
}
