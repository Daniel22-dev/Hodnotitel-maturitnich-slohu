

function clampIntOrNull(v,min,max){
  if(v===null || v===undefined || v==='') return null;
  const n=Number(v);
  if(!Number.isFinite(n)) return null;
  const i=Math.round(n);
  if(i<min || i>max) return null;
  return i;
}
function normalizeSectionScores(obj){
  const out={};
  const src=obj && typeof obj==='object' ? obj : {};
  RESULT_SECTION_KEYS.forEach(k=>{ out[k]=clampIntOrNull(src[k],0,3); });
  return out;
}
function normalizeResultMetadata(raw, source='json'){
  if(!raw || typeof raw!=='object') return null;
  const sections=normalizeSectionScores(raw.sections);
  const sectionValues=Object.values(sections).filter(v=>v!==null);
  let score=clampIntOrNull(raw.score_total,0,24);
  if(score===null && sectionValues.length===8) score=sectionValues.reduce((a,b)=>a+b,0);
  const meta={
    schema_version:String(raw.schema_version||'1.0'),
    student_code:String(raw.student_code||'').trim(),
    final_word_count:clampIntOrNull(raw.final_word_count,0,2000),
    raw_word_count:clampIntOrNull(raw.raw_word_count,0,3000),
    deducted_word_count:clampIntOrNull(raw.deducted_word_count,0,3000),
    score_total:score,
    grade:clampIntOrNull(raw.grade,1,5),
    fail_signal:Boolean(raw.fail_signal),
    fail_reason:raw.fail_reason==null?null:String(raw.fail_reason).trim(),
    sections,
    ai_language_estimate_percent:clampIntOrNull(raw.ai_language_estimate_percent,0,100),
    json_confidence:String(raw.json_confidence||'').trim(),
    source
  };
  return meta;
}
function fallbackResultMetadata(txt){
  const t=String(txt||'');
  const score=(t.match(/(?:Celkem|CELKEM|Součet|SOUČET|počet bodů|Body)[^0-9]{0,30}(\d{1,2})\s*\/?\s*24/i)||[])[1];
  const grade=(t.match(/(?:Známka|ZNÁMKA|výsledná známka)[^0-9]{0,30}([1-5])/i)||[])[1];
  const words=(t.match(/(?:FINÁLNÍ POČET SLOV|Finální počet slov|final_word_count)[^0-9]{0,30}(\d{1,4})/i)||t.match(/\bZ\s*=\s*(\d{1,4})/)||[])[1];
  const fail=/FAIL|NEUSPĚL|známka 5 bez ohledu/i.test(t);
  if(!score && !grade && !words && !fail) return null;
  return normalizeResultMetadata({score_total:score,grade,final_word_count:words,fail_signal:fail,fail_reason:fail?'regex fallback signál':null,sections:{}},'fallback');
}
function extractResultJsonText(txt){
  const t=String(txt||'');
  const start=t.indexOf(RESULT_JSON_START);
  if(start<0) return '';
  const after=start+RESULT_JSON_START.length;
  const end=t.indexOf(RESULT_JSON_END,after);
  const raw=(end>=0?t.slice(after,end):t.slice(after)).trim();
  return raw.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
}
function extractResultMetadata(txt){
  const jsonText=extractResultJsonText(txt);
  if(jsonText){
    try{
      const parsed=JSON.parse(jsonText);
      const norm=normalizeResultMetadata(parsed,'json');
      if(norm) return {ok:true, meta:norm, error:null};
    }catch(e){
      const fb=fallbackResultMetadata(txt);
      return {ok:false, meta:fb, error:'JSON souhrn nejde přečíst: '+(e.message||e)};
    }
  }
  const fb=fallbackResultMetadata(txt);
  return {ok:false, meta:fb, error:jsonText?'JSON souhrn je prázdný nebo neplatný.':'Výstup neobsahuje MACHINE_SUMMARY_JSON.'};
}
function resultSummaryParts(txt){
  const parsed=extractResultMetadata(txt);
  const m=parsed.meta;
  return {
    score:m?.score_total??null,
    grade:m?.grade??null,
    words:m?.final_word_count??null,
    fail:m?.fail_signal?true:false,
    source:m?.source || 'none',
    ok:parsed.ok,
    error:parsed.error||''
  };
}

function makeBatchSummaryText(){
  if(!batchResults.length) return 'Zatím není vygenerované žádné dávkové hodnocení.';
  const rows=batchResults.map(r=>`- ${r.code}: ${r.status}${extractMiniSummary(r.result)}`).join('\n');
  return `# Souhrn dávkového hodnocení\n\nZadání: ${state.taskTitle||currentTask().title}\nPočet prací: ${batchResults.length}\n\n${rows}\n\nJednotlivé zpětné vazby jsou níže v kartách a lze je stáhnout jako ZIP balíček.`;
}
function extractMiniSummary(txt){
  const s=resultSummaryParts(txt);
  const bits=[];
  if(s.score!==null) bits.push(s.score+'/24');
  if(s.grade!==null) bits.push('známka '+s.grade);
  if(s.words!==null) bits.push(s.words+' slov');
  if(s.source==='fallback') bits.push('souhrn z fallbacku');
  if(!s.ok && s.error && s.source==='none') bits.push('JSON chybí');
  return bits.length?' · '+bits.join(' · '):'';
}

function cancelRun(){ if(abortController){ abortController.abort(); toast('Generování zrušeno.','warn'); } }
function geminiGenerateUrl(apiVersion, model){ return `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent`; }
function geminiModelsUrl(apiVersion){ return `https://generativelanguage.googleapis.com/${apiVersion}/models`; }
function makeGeminiApiError(message,status,apiVersion,raw){ const e=new Error(message); e.httpStatus=status||0; e.apiVersion=apiVersion; e.raw=raw; return e; }
function shouldFallbackToV1Beta(e){ return e && e.apiVersion===GEMINI_API_VERSION_PRIMARY && (e.httpStatus===400 || e.httpStatus===404 || /not found|not supported|not available|model/i.test(e.message||'')); }
async function fetchGeminiModelsList(key,apiVersion,signal){
  let res;
  try{ res=await fetch(geminiModelsUrl(apiVersion),{method:'GET',headers:{'x-goog-api-key':key},signal}); }
  catch(e){ if(e.name==='AbortError') throw makeGeminiApiError('Kontrola modelů byla zrušena.',0,apiVersion,e); throw makeGeminiApiError('Spojení s Gemini selhalo: '+e.message,0,apiVersion,e); }
  const data=await res.json().catch(()=>({}));
  if(!res.ok){ const msg=data?.error?.message||`HTTP ${res.status}`; throw makeGeminiApiError('Gemini API model list: '+msg,res.status,apiVersion,data); }
  return Array.isArray(data.models)?data.models:[];
}
async function checkGeminiModels(){
  if(!geminiApiKey && getGeminiInputKey()) useGeminiKeyForSession();
  geminiApiKey=getGeminiInputKey()||geminiApiKey; updateGeminiStatus();
  if(!geminiApiKey){ toast('Zadej Gemini API key, aby bylo možné načíst dostupné modely.','err'); return; }
  const btn=$('checkModelsBtn'); const oldText=btn?btn.textContent:''; if(btn){ btn.disabled=true; btn.textContent='Ověřuji…'; }
  try{
    let apiVersion=GEMINI_API_VERSION_PRIMARY, models=[];
    try{ models=await fetchGeminiModelsList(geminiApiKey,apiVersion); }
    catch(e){ if(shouldFallbackToV1Beta(e)){ apiVersion=GEMINI_API_VERSION_FALLBACK; models=await fetchGeminiModelsList(geminiApiKey,apiVersion); } else throw e; }
    const current=resolveGeminiModel();
    const usable=models.filter(m=>!Array.isArray(m.supportedGenerationMethods) || m.supportedGenerationMethods.includes('generateContent')).map(m=>normalizeModelName(m.name||m.displayName||'')).filter(Boolean);
    const unique=[...new Set(usable)].sort((a,b)=>a.localeCompare(b));
    renderGeminiModelSelect(unique,current,apiVersion);
    const currentOk=unique.includes(current);
    const shown=unique.slice(0,60);
    const listHtml=shown.length?shown.map(m=>`<button type="button" class="btn-mini" data-pick-model="${escapeHtml(m)}" style="margin:3px">${escapeHtml(m)}${m===current?' ✓':''}</button>`).join(''):'<p>Pro tento klíč se nepodařilo najít žádný model s generateContent.</p>';
    const html=`<div class="${currentOk?'ok-box':'warn-box'}"><strong>${currentOk?'Aktuální model je dostupný.':'Aktuální model nebyl v seznamu nalezen.'}</strong><br>Endpoint pro kontrolu: ${escapeHtml(apiVersion)}. Aktuální model: <code>${escapeHtml(current)}</code>.</div><p style="margin:8px 0">Kliknutím můžeš vybrat jiný dostupný model:</p><div style="max-height:260px;overflow:auto;border:1px solid var(--bdr2);border-radius:8px;padding:8px">${listHtml}</div>${unique.length>shown.length?`<p class="small-muted">Zobrazeno prvních ${shown.length} z ${unique.length} modelů.</p>`:''}`;
    showModal('Dostupné Gemini modely',html,[{label:'Zavřít',className:'primary'}]);
    document.querySelectorAll('[data-pick-model]').forEach(b=>b.onclick=()=>{ setGeminiModel(b.getAttribute('data-pick-model')||''); $('uiModal').classList.add('hidden'); toast('Model nastaven.'); });
  }catch(e){ toast(e.message||String(e),'err'); }
  finally{ if(btn){ btn.disabled=false; btn.textContent=oldText||'Ověřit modely'; } }
}

function parseRetryAfterMs(v){
  if(!v) return 0;
  const s=String(v).trim();
  if(/^\d+(\.\d+)?$/.test(s)) return Math.max(0, Math.round(parseFloat(s)*1000));
  const date=Date.parse(s);
  return Number.isFinite(date)?Math.max(0,date-Date.now()):0;
}
function isRetryableGeminiError(e){
  if(!e || /zrušeno/i.test(e.message||'')) return false;
  return e.httpStatus===0 || e.httpStatus===429 || e.httpStatus===500 || e.httpStatus===502 || e.httpStatus===503 || e.httpStatus===504;
}
function geminiRetryDelayMs(attempt,e){
  if(e && e.retryAfterMs) return Math.min(Math.max(e.retryAfterMs,800),60000);
  const expo=GEMINI_RETRY_BASE_MS * Math.pow(2, Math.max(0,attempt-1));
  const jitter=Math.floor(Math.random()*450);
  return Math.min(GEMINI_RETRY_MAX_MS, expo+jitter);
}
function sleepWithAbort(ms,signal){
  return new Promise((resolve,reject)=>{
    const t=setTimeout(()=>{ cleanup(); resolve(); },ms);
    const cleanup=()=>{ if(signal) signal.removeEventListener('abort',onAbort); };
    const onAbort=()=>{ clearTimeout(t); cleanup(); reject(makeGeminiApiError('Generování bylo zrušeno.',0,'',null)); };
    if(signal) signal.addEventListener('abort',onAbort,{once:true});
  });
}
function updateRetryStatus(context,attempt,delay,e){
  const sec=Math.ceil(delay/1000);
  const status=e?.httpStatus?`HTTP ${e.httpStatus}`:'chyba spojení';
  if($('runStatus')) $('runStatus').textContent=`${context}: ${status}. Opakuji pokus ${attempt+1}/${GEMINI_RETRY_MAX_ATTEMPTS} za ${sec} s…`;
}

async function callGemini(key,model,prompt,files,signal){
  const parts=[{text:prompt}];
  for(const f of files)parts.push({inline_data:{mime_type:f.mime,data:dataUrlToBase64(f.dataUrl)}});
  const body={contents:[{role:'user',parts}],generationConfig:{temperature:0.05,topP:0.8,maxOutputTokens:16384,responseMimeType:'application/json'}};
  async function post(apiVersion){
    for(let attempt=1;attempt<=GEMINI_RETRY_MAX_ATTEMPTS;attempt++){
      try{
        const res=await fetch(geminiGenerateUrl(apiVersion,model),{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal});
        const data=await res.json().catch(()=>({}));
        if(!res.ok){const err=makeGeminiApiError(data?.error?.message||`HTTP ${res.status}`,res.status,apiVersion,data);err.retryAfterMs=parseRetryAfterMs(res.headers?.get?.('retry-after'));throw err;}
        const finish=data?.candidates?.[0]?.finishReason||'';
        if(finish==='MAX_TOKENS')throw makeGeminiApiError('Přepis je delší než výstupní limit modelu. Rozděl přílohy na méně stran na jednoho studenta.',422,apiVersion,data);
        const text=(data.candidates||[]).flatMap(c=>(c.content?.parts||[]).map(p=>p.text||'')).join('').trim();
        if(!text)throw makeGeminiApiError('Gemini nevrátilo textový přepis.',0,apiVersion,data);
        return text;
      }catch(e){
        if(e?.name==='AbortError')throw makeGeminiApiError('Přepis byl zrušen.',0,apiVersion,e);
        if(!Number.isFinite(e?.httpStatus))e=makeGeminiApiError('Spojení s Gemini při přepisu selhalo: '+(e?.message||e),0,apiVersion,e);
        if(!isRetryableGeminiError(e)||attempt>=GEMINI_RETRY_MAX_ATTEMPTS)throw e;
        const delay=geminiRetryDelayMs(attempt,e);updateRetryStatus('Přepis přílohy',attempt,delay,e);await sleepWithAbort(delay,signal);
      }
    }
  }
  try{return await post(GEMINI_API_VERSION_PRIMARY);}catch(e){if(shouldFallbackToV1Beta(e))return post(GEMINI_API_VERSION_FALLBACK);throw e;}
}
