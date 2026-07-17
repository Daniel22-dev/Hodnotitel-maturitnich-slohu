let tasks = loadTasks();
let state = {
  step:0, workMode:'offline', set:'practice', genre:'opinion', taskIndex:0, evalMode:'deep', outputStyle:'teacher', resultView:'teacher',
  taskTitle:'', taskText:'', taskReqs:'', studentText:'', studentIdentity:'', studentCode:'STUDENT_001', extraPii:'', inputMode:'single', privacyMode:'strict', privacyApprovedHash:'', result:'', teacherReview:{sections:{}, score_total:null, grade:null, note:'', verified:false, verifiedAt:''}
};
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
function safeLocalSet(k,v){ try{localStorage.setItem(k,v); return true}catch(_){return false} }
function safeLocalRemove(k){ try{localStorage.removeItem(k); return true}catch(_){return false} }
function safeSessionGet(k){ try{return sessionStorage.getItem(k)}catch(_){return null} }
function safeSessionSet(k,v){ try{sessionStorage.setItem(k,v); return true}catch(_){return false} }
function safeSessionRemove(k){ try{sessionStorage.removeItem(k); return true}catch(_){return false} }

let modalReturnFocus=null;
function hideModal(){
  $('uiModal')?.classList.add('hidden');
  const target=modalReturnFocus;
  modalReturnFocus=null;
  if(target&&typeof target.focus==='function'&&document.contains(target)) setTimeout(()=>target.focus(),0);
}
function showModal(title,body,actions){
  const modal=$('uiModal');
  if(modal?.classList.contains('hidden')) modalReturnFocus=document.activeElement;
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
<ul class="privacy-intro-list"><li>u textu a Wordu nahrazuje e-maily, telefony, URL, možné rodné číslo a další rozpoznatelné identifikátory; zadané jméno nahrazuje jako celek i po jednotlivých částech dlouhých alespoň tři znaky,</li><li>při dávce přiděluje kódy typu STUDENT_001, STUDENT_002,</li><li>před odesláním spouští kontrolu citlivých údajů a v Privacy režimu zastaví odeslání, pokud něco najde,</li><li>studentské texty, identitu a výsledky ve výchozím stavu neukládá do trvalého úložiště prohlížeče; obnovu citlivé relace je nutné zapnout ručně,</li><li>mapu anonymizace drží jen lokálně v prohlížeči a neposílá ji do Gemini.</li></ul>
<p style="margin-top:10px"><span class="privacy-intro-strong">Co musí udělat uživatel:</span></p>
<ul class="privacy-intro-list"><li>zkontrolovat náhled „co odejde do AI“,</li><li>doplnit do anonymizačního seznamu jména, školu, třídu, město, adresu nebo jiné údaje, které aplikace nemusela poznat; skloňované tvary, přezdívky a varianty jmen je nutné uvést samostatně,</li><li>u fotek a PDF zkontrolovat, zda není jméno vidět přímo v obrázku; jednosouborový nástroj neumí obrázek lokálně spolehlivě začernit,</li><li>neukládat API klíč trvale na sdíleném zařízení,</li><li>zvolit API režim pouze tehdy, když opravdu chceš automatické hodnocení přes Gemini; offline příprava a ruční AI režim API klíč nepotřebují.</li></ul>
<div class="ok-box" style="margin-top:12px"><strong>Doporučený bezpečný postup:</strong> Word nebo vložený text → doplnit jméno a další údaje → spustit kontrolu citlivých údajů → nahradit nebo potvrdit nálezy → zvolit offline / ruční AI / Gemini API podle potřeby.</div>`; }
function showPrivacyIntro(force=false){
  if(!force){ if(safeLocalGet(PRIVACY_ACK_SK)===APP_VERSION) return; }
  showModal('Ochrana osobních údajů a anonymizace', privacyIntroHtml(), [{label:'Rozumím, pokračovat',className:'primary',id:'privacyAckBtn',onClick:()=>{safeLocalSet(PRIVACY_ACK_SK,APP_VERSION)}}]);
}
function showTooltipFor(el){ const tt=$('tooltip'); if(!tt || !el) return; const txt=el.getAttribute('data-tip')||''; if(!txt) return; tt.textContent=txt; tt.classList.add('visible'); const r=el.getBoundingClientRect(); const pad=10; const maxW=Math.min(310, window.innerWidth-24); tt.style.maxWidth=maxW+'px'; let left=Math.min(Math.max(pad, r.left + r.width/2 - maxW/2), window.innerWidth - maxW - pad); let top=r.bottom + 10; tt.style.left=left+'px'; tt.style.top=top+'px'; const tr=tt.getBoundingClientRect(); if(tr.bottom > window.innerHeight - pad){ top=Math.max(pad, r.top - tr.height - 10); tt.style.top=top+'px'; } }
function hideTooltip(){ $('tooltip')?.classList.remove('visible'); }
function initTooltips(){ document.querySelectorAll('.tt-icon[data-tip]').forEach(el=>{ el.setAttribute('aria-label','Nápověda: '+(el.getAttribute('data-tip')||'')); el.addEventListener('mouseenter',()=>showTooltipFor(el)); el.addEventListener('mouseleave',hideTooltip); el.addEventListener('focus',()=>showTooltipFor(el)); el.addEventListener('blur',hideTooltip); el.addEventListener('click',e=>{e.preventDefault(); e.stopPropagation(); const tt=$('tooltip'); if(tt?.classList.contains('visible') && tt.textContent===(el.getAttribute('data-tip')||'')) hideTooltip(); else showTooltipFor(el);}); }); document.addEventListener('click',hideTooltip); window.addEventListener('scroll',hideTooltip,{passive:true}); window.addEventListener('resize',hideTooltip); }

const CHANGELOG_MAX_ENTRIES = 10;
const CHANGELOG = [
  {version:APP_VERSION+' AI STUDIO EDITION', items:['Opraven ruční AI režim: prompt obsahuje úplné JSON schéma a vložený výsledek prochází stejným deterministickým bodováním a validační bránou jako API.', 'Opraveny hraniční chyby počtu slov, nadpisů a vstupního zámku; technická značka nahraného textu se už nikdy nepočítá.', 'Kódy studentů se po odebrání práce nerecyklují a nejednoznační jmenovci se nepárují automaticky.', 'Fotku nebo PDF je nyní nutné nejdřív přepsat a potvrdit; prázdný text už nemůže vytvořit automatickou známku 5.', 'Batch odpovědi s citacemi se neukládají do localStorage a výsledky bez identifikačního klíče se nepřiřazují podle pořadí.', 'Doplněny regresní testy, limit PDF, bezpečnější práce s API klíčem, kompatibilita bez regex lookbehind a opravy exportu DOCX/PWA cache., sjednocená certifikace GHRAB QA 1.0.2 a fail-closed přístupová brána.']},
  {version:'1.4.0 AI STUDIO EDITION', items:['Přidána anonymní technická telemetrie počtu zpracovaných slohů, úspěchů, chyb a zrušení.', 'Batch API zapisuje metriku až při dokončení a chrání se před dvojím započtením.', 'Text práce, výsledek, jméno ani jiné údaje studenta se do telemetrie neposílají.']},
  {version:'1.3.7 AI STUDIO EDITION', items:['Přidán úplný interaktivní manuál dostupný samostatným tlačítkem v záhlaví.', 'Manuál se otevírá v nové kartě, zachová rozpracovanou sérii a používá stejné oprávnění AI Studia.', 'Manuál je součástí offline PWA balíčku.']},
  {version:'1.3.6 AI STUDIO EDITION', items:['Stabilizována PWA identita, service worker, přístupová brána a bezpečná obnova dávky bez base64 příloh.', 'Sjednoceno školní logo a verze řízená výhradně z package.json.', 'Doplněny první funkční zlaté testy word-countu, snapshotu a pseudonymizace.']},
  {version:'1.3.5 AI STUDIO EDITION', items:['Sjednoceno školní logo a název školy s ostatními aplikacemi AI Studia.', 'Autorské údaje v zápatí používají společný dvouřádkový formát celé sady.']},
  {version:'1.3.4 AI STUDIO EDITION', items:['Opraven křehký CI test, který blokoval celé nasazení kvůli volitelnému oznámení AI Studiu.', 'Build a GitHub Pages se spustí i bez volitelného repository dispatch.', 'Import seznamu z IS je ověřen pro čárky, středníky, tabulátory i nové řádky.']},
  {version:'1.3.3 AI STUDIO EDITION', items:['Připravena vycentrovaná PWA ikona štítu, pera a potvrzení v běžné i maskable variantě.', 'Regresní test potvrzuje import 16 e-mailů z jednoho čárkového exportu IS.']},
  {version:'1.3.2 AI STUDIO EDITION', items:['Opraven import skupiny z IS a přidán živý náhled počtu rozpoznaných studentů.', 'Barevnost názvu, školní logo a PWA ikona byly sjednoceny.']},
  {version:'1.3.0 AI STUDIO EDITION', items:['Dokončeno Report Studio, skutečně formátovaný DOCX, komentářová banka, anonymní třídní analytika a pseudonymní historie.', 'DOCX import i exporty používají lokální knihovnu bez CDN.', 'Odstraněny překryté staré implementace reportu a exportů.']},
  {version:'1.2.0 AI STUDIO EDITION', items:['Přepracován studentský i učitelský report a opraven přenos odečteného počtu slov.', 'Opraveno pokračování dávky, izolace učitelské korekce a validace kontaktů.', 'Studentská zpětná vazba dostala přehlednější akční strukturu.']},
];
function latestChangelog(){ return CHANGELOG.slice(0, CHANGELOG_MAX_ENTRIES); }
function showChangelog(){ const items=latestChangelog(); const html=`<p class="small-muted" style="margin-bottom:10px">Zobrazuje se posledních ${items.length} změn. Starší položky se v nových verzích průběžně odstraňují.</p>`+items.map(v=>`<h3 style="color:var(--acc);margin:8px 0 4px">${escapeHtml(v.version)}</h3><ul style="margin-left:18px">${v.items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`).join(''); showModal('Co je nového',html,[{label:'Zavřít',className:'primary'}]); }

function loadTasks(){
  try{ const raw=safeLocalGet(TASK_STORAGE_KEY); if(raw) return mergeTasks(makeDefaultTasks(), JSON.parse(raw)); }catch(e){}
  return makeDefaultTasks();
}
function normalizeImportedTask(setId,genreId,item,index){
  const task=Object.assign(placeholderTask(setId,genreId,index+1),item&&typeof item==='object'?item:{});
  task.id=String(task.id||`${setId}-${genreId}-${index+1}`);
  task.set=setId;
  task.genre=genreId;
  task.number=Number.isFinite(Number(task.number))?Number(task.number):index+1;
  task.title=String(task.title||placeholderTask(setId,genreId,index+1).title);
  task.taskText=String(task.taskText||'');
  task.requirements=Array.isArray(task.requirements)?task.requirements.map(x=>String(x||'').trim()).filter(Boolean):[];
  task.sourceFile=String(task.sourceFile||'');
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
function saveTasks(){ safeLocalSet(TASK_STORAGE_KEY, JSON.stringify(tasks)); }
function sensitiveSaveEnabled(){ return safeLocalGet(SENSITIVE_SAVE_PREF_SK)==='1'; }
function purgeLegacySensitiveStorage(){ LEGACY_STATE_KEYS.forEach(k=>safeLocalRemove(k)); }
function clearAllSavedState(){ safeLocalRemove(STORAGE_KEY); safeLocalRemove(SENSITIVE_SAVE_PREF_SK); safeLocalRemove('maturitniHodnotitelPseudonymousHistoryV130'); clearBatchProgress(); purgeLegacySensitiveStorage(); }
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
  let raw='';
  try{raw=JSON.stringify(buildBatchProgressSnapshot());}catch(_){warnBatchPersistenceFailure();return false;}
  const sessionOk=safeSessionSet(BATCH_PROGRESS_SESSION_SK,raw);
  const localOk=sensitiveSaveEnabled()?safeLocalSet(BATCH_PROGRESS_LOCAL_SK,raw):safeLocalRemove(BATCH_PROGRESS_LOCAL_SK);
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
  $('changesBtn').onclick=showChangelog; $('privacyIntroBtn').onclick=()=>showPrivacyIntro(true); $('clearSavedBtn').onclick=()=>{clearAllSavedState(); location.reload();};
  $('next0').onclick=()=>goTo(1); $('back1').onclick=()=>goTo(0); if($('againBtn')) $('againBtn').onclick=()=>goTo(2); $('next1').onclick=()=>{commitTaskFieldsToDb();goTo(2)}; $('back2').onclick=()=>goTo(1); $('next2').onclick=()=>goTo(3); $('back3').onclick=()=>goTo(2); $('next3').onclick=()=>goTo(4); $('back4').onclick=()=>goTo(3); $('newEvalBtn').onclick=()=>{state.studentText='';state.result='';state.studentIdentity='';state.extraPii='';state.teacherReview=defaultTeacherReview();attachedFiles=[];batchStudents=[];batchResults=[];clearBatchProgress();state.privacyApprovedHash='';goTo(0);syncFieldsFromState();renderFiles();renderBatchList();renderResult();updateStats();saveState();};
  ['taskTitle','taskText','taskReqs','studentText','studentIdentity','studentCode','extraPii'].forEach(id=>$(id).addEventListener('input',()=>{state.privacyApprovedHash='';updateStats();updatePromptPreview();saveState(false);renderPrivacyMode();}));
  $('anonymizeBtn').onclick=applyPseudonymizationToField; $('previewAnonBtn').onclick=showAnonPreview; $('clearTextBtn').onclick=()=>{$('studentText').value=''; attachedFiles=[]; syncStateFromFields(); renderFiles(); updateStats(); updatePromptPreview(); saveState();}; $('togglePrivacyBtn')?.addEventListener('click',togglePrivacyMode); $('runPrivacyCheckBtn')?.addEventListener('click',()=>{syncStateFromFields(); renderPrivacyReport(runPrivacyScan(), false);}); $('applyPrivacyFixBtn')?.addEventListener('click',applySelectedPrivacyFindings); $('approvePrivacyBtn')?.addEventListener('click',approvePrivacyCheck); $('toggleSensitiveSaveBtn')?.addEventListener('click',toggleSensitiveStateSaving); $('clearSensitiveSavedBtn')?.addEventListener('click',clearSensitiveSavedData);
  $('fileInput').addEventListener('change',handleFiles); $('transcribeSingleBtn')?.addEventListener('click',transcribeSingleAttachments); const ua=$('uploadArea'); ua.onclick=()=>$('fileInput').click(); ua.addEventListener('dragover',e=>{e.preventDefault(); ua.classList.add('dragover')}); ua.addEventListener('dragleave',()=>ua.classList.remove('dragover')); ua.addEventListener('drop',e=>{e.preventDefault(); ua.classList.remove('dragover'); handleFileList(e.dataTransfer.files)});
  $('batchFileInput')?.addEventListener('change',handleBatchFiles); $('pickBatchFilesBtn')?.addEventListener('click',()=>$('batchFileInput').click()); $('addBatchStudentBtn')?.addEventListener('click',()=>addBatchStudent()); $('clearBatchBtn')?.addEventListener('click',()=>{batchStudents=[];batchResults=[];clearBatchProgress();state.privacyApprovedHash='';renderBatchList();updateStats();saveState();renderPrivacyMode();}); $('clearBatchResultsBtn')?.addEventListener('click',()=>{resetBatchResultsOnly();});
  $('exportTasksBtn').onclick=()=>{$('taskJson').value=JSON.stringify(tasks,null,2); toast('Databáze zadání vypsána do JSON pole.');};
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
