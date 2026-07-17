function materializeResponseSchema(value){if(Array.isArray(value))return value.map(materializeResponseSchema);if(!value||typeof value!=='object')return value;const out={};for(const [k,v] of Object.entries(value)){if(k==='nullable'){if(v)out.nullable=true;continue;}if(k==='type'&&Array.isArray(v)){out.type=v.find(x=>x!=='null')||'string';if(v.includes('null'))out.nullable=true;continue;}out[k]=materializeResponseSchema(v);}return out;}
function structuredGenerationConfig(){return {temperature:0.05,topP:0.8,maxOutputTokens:32768,responseMimeType:'application/json',responseSchema:materializeResponseSchema(EVALUATION_RESPONSE_SCHEMA)};}
function geminiPartsForStudent(student){const parts=[{text:buildPrompt(student)}];const useFiles=(student?.files||[]).length&&!String(student?.text||'').trim();for(const f of(useFiles?student.files:[]))parts.push({inline_data:{mime_type:f.mime,data:dataUrlToBase64(f.dataUrl)}});return parts;}
let lastQueueRequestAt=0;
async function queueThrottle(){const rpm=Math.max(1,Number(state.queueRpm)||5);const minGap=Math.ceil(60000/rpm);const wait=Math.max(0,lastQueueRequestAt+minGap-Date.now());if(wait)await sleepWithAbort(wait,abortController?.signal);lastQueueRequestAt=Date.now();}
async function postStructuredRequest(student,key,model,signal,repairContext=''){
  const prompt=repairContext?`${buildPrompt(student)}

OPRAVNÁ VALIDACE: Předchozí JSON měl tyto nedostatky:
${repairContext}
Vrať znovu celý JSON a oprav pouze tyto nedostatky.`:buildPrompt(student);
  const body={contents:[{role:'user',parts:[{text:prompt},...geminiPartsForStudent(student).slice(1)]}],generationConfig:structuredGenerationConfig()};
  let lastError;
  for(const version of [GEMINI_API_VERSION_PRIMARY,GEMINI_API_VERSION_FALLBACK]){
    for(let attempt=1;attempt<=GEMINI_RETRY_MAX_ATTEMPTS;attempt++){
      try{
        await queueThrottle();
        const res=await fetch(geminiGenerateUrl(version,model),{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal});
        const data=await res.json().catch(()=>({}));
        if(!res.ok){const err=makeGeminiApiError(data?.error?.message||`HTTP ${res.status}`,res.status,version,data);err.retryAfterMs=parseRetryAfterMs(res.headers?.get?.('retry-after'));throw err;}
        const finish=data?.candidates?.[0]?.finishReason||'';
        if(finish==='MAX_TOKENS')throw makeGeminiApiError('Model nedokončil strukturovaný výstup (limit tokenů). Zkus Standardní režim, kratší vstup nebo jiný model.',422,version,data);
        const text=(data.candidates||[]).flatMap(c=>(c.content?.parts||[]).map(p=>p.text||'')).join('').trim();
        try{return {raw:JSON.parse(text.replace(/^```(?:json)?\s*/i,'').replace(/```$/,'').trim()),usage:data.usageMetadata||{}};}
        catch(e){throw makeGeminiApiError('Model nevrátil platný dokončený JSON: '+(e.message||e),422,version,data);}
      }catch(e){
        lastError=e;if(shouldFallbackToV1Beta(e))break;
        if(!isRetryableGeminiError(e)||attempt>=GEMINI_RETRY_MAX_ATTEMPTS)throw e;
        const delay=geminiRetryDelayMs(attempt,e);updateRetryStatus('Strukturované hodnocení',attempt,delay,e);await sleepWithAbort(delay,signal);
      }
    }
  }
  throw lastError||new Error('Gemini nevrátilo strukturovaný výsledek.');
}
async function evaluateStudentStructured(student,key,model,signal,priceMode='standard'){const first=await postStructuredRequest(student,key,model,signal);let evaluation=finalizeEvaluation(first.raw,student);let usage=registerUsage(first.usage,priceMode);if(!evaluation.validation.ok){const repair=await postStructuredRequest(student,key,model,signal,evaluation.validation.issues.map(x=>'- '+x).join('\n'));evaluation=finalizeEvaluation(repair.raw,student);const extra=registerUsage(repair.usage,priceMode);usage={promptTokens:usage.promptTokens+extra.promptTokens,outputTokens:usage.outputTokens+extra.outputTokens,totalTokens:usage.totalTokens+extra.totalTokens,costUsd:usage.costUsd+extra.costUsd};}return {evaluation,result:evaluationToLegacyResult(evaluation),usage};}
function batchReadyStudents(){return batchStudents.map(ensureBatchStudentShape).filter(s=>String(s.text||'').trim()||(s.files||[]).length);}
function validateBatchPreflight(){const ready=batchReadyStudents();if(!ready.length)return 'Přidej alespoň jeden sloh.';if(ready.length>SERIES_MAX_WORKS)return `Jedna série může obsahovat maximálně ${SERIES_MAX_WORKS} prací.`;const notConfirmed=ready.filter(requiresTranscriptReview);if(notConfirmed.length)return `${notConfirmed.length} obrazových/PDF prací nemá potvrzený digitální přepis.`;return '';}
async function prepareApiRun(){syncStateFromFields();syncSeriesFromFields();commitTaskFieldsToDb(false);ensureWorkflowState();updateStats();if(!hasTaskBasics()){toast('Doplň přesné zadání a povinné body R1–Rn.','err');goTo(1);return null;}if(!(await privacyGateBeforeSend()))return null;if(!geminiApiKey&&getGeminiInputKey())useGeminiKeyForSession();geminiApiKey=getGeminiInputKey()||geminiApiKey;updateGeminiStatus();if(!geminiApiKey){toast('Zadej Gemini API klíč.','err');return null;}const model=resolveGeminiModel();setGeminiModel(model);return model;}
function recordEssayTelemetry(attempted,successful,failed,cancelled=0){
  try{
    window.GHRABTelemetry?.recordOutput({
      outputKind:'essay-evaluation',
      attemptedQuantity:attempted,
      successfulQuantity:successful,
      failedQuantity:failed,
      cancelledQuantity:cancelled,
      outcome:failed&&successful?'partial':failed?'error':successful?'success':'cancelled'
    });
  }catch(error){console.warn('Telemetrie Hodnotitele se nezapsala.',error);}
}
async function runEvaluation(){
  if(state.inputMode==='batch')return runBatchEvaluation();
  syncStateFromFields();
  if(!hasStudentInput()){toast('Vlož studentský text nebo přidej přílohu.','err');goTo(2);return;}
  const mode=state.workMode||'offline';
  if(mode==='offline'){
    state.result=buildOfflineReport();batchResults=[];renderResult();$('next3').disabled=false;saveState();recordEssayTelemetry(1,1,0);goTo(4);return;
  }
  if(singleAttachmentTranscriptRequired()){showSingleTranscriptGuidance();return;}
  if(mode==='manual'){await copyPromptWithPrivacyGate();return;}
  const model=await prepareApiRun();if(!model)return;
  const student={code:state.studentCode||'STUDENT_001',identity:state.studentIdentity,extraPii:state.extraPii,text:state.studentText,files:attachedFiles,transcriptConfirmed:true};
  if(!(await preflightConfirmBeforeApi(model)))return;
  abortController=new AbortController();$('runBtn').disabled=true;$('runBtn').innerHTML='<span class="loader"></span> Hodnotím a ověřuji…';$('cancelBtn').classList.remove('hidden');
  try{
    const out=await evaluateStudentStructured(student,geminiApiKey,model,abortController.signal,'standard');
    state.result=out.result;state.lastEvaluation=out.evaluation;batchResults=[];renderResult();$('next3').disabled=false;saveState();recordEssayTelemetry(1,1,0);
    toast(out.evaluation.validation.ok?'Hodnocení prošlo validační bránou.':'Výsledek vyžaduje učitelskou kontrolu.',out.evaluation.validation.ok?'ok':'warn');goTo(4);
  }catch(e){
    const cancelled=/zrušeno|cancelled|canceled|abort/i.test(String(e?.message||e));recordEssayTelemetry(1,0,cancelled?0:1,cancelled?1:0);toast(e.message||String(e),'err');$('runStatus').textContent=e.message||String(e);
  }finally{abortController=null;$('runBtn').disabled=false;renderWorkMode();$('cancelBtn').classList.add('hidden');updateWorkflowDashboard();}
}
async function runBatchEvaluation(){
  const error=validateBatchPreflight();if(error){toast(error,'err');goTo(2);return;}
  const mode=state.workMode||'offline';
  if(mode==='offline'){
    const count=batchReadyStudents().length;state.result=buildBatchOfflineReport();batchResults=[];renderResult();$('next3').disabled=false;saveState();if(count)recordEssayTelemetry(count,count,0);goTo(4);return;
  }
  if(mode==='manual'){if(!(await privacyGateBeforeSend()))return;downloadPromptBundleTxt();return;}
  const model=await prepareApiRun();if(!model)return;if(!(await preflightConfirmBeforeApi(model)))return;
  if(state.processingMode==='batch')return submitGeminiBatchJob(model);
  return runImmediateBatchQueue(model);
}
async function runImmediateBatchQueue(model){
  const ready=batchReadyStudents();const pending=ready.filter(s=>!batchResultDone(s.code));
  if(!pending.length){state.result=makeBatchSummaryText();renderResult();goTo(4);return;}
  let successful=0,failed=0,cancelled=0,recorded=false;
  abortController=new AbortController();$('runBtn').disabled=true;$('runBtn').innerHTML='<span class="loader"></span> Hodnotím řízenou frontu…';$('cancelBtn').classList.remove('hidden');$('batchProgress')?.classList.remove('hidden');
  try{
    for(let i=0;i<pending.length;i++){
      const s=pending[i];s.status='hodnotím';renderBatchList();$('runStatus').textContent=`${s.code}: analýza a validační brána (${i+1}/${pending.length})`;if($('batchProgressBar'))$('batchProgressBar').style.width=Math.round(i/pending.length*100)+'%';saveBatchProgress();
      try{
        const out=await evaluateStudentStructured(s,geminiApiKey,model,abortController.signal,'standard');successful++;
        s.status=out.evaluation.validation.ok?'hotovo':'kontrola';s.validation=out.evaluation.validation;s.usage=out.usage;
        upsertBatchResult({code:s.code,identity:s.identity||'',displayName:s.displayName||'',email:s.email||'',rosterId:s.rosterId||'',sourceName:s.sourceName||'',result:out.result,finalEvaluation:out.evaluation,validation:out.evaluation.validation,usage:out.usage,status:s.status,approved:false,deliveryStatus:'not-ready',savedAt:new Date().toISOString()});
      }catch(e){
        if(/zrušeno|cancelled|canceled|abort/i.test(String(e?.message||e)))throw e;
        failed++;s.status='chyba';upsertBatchResult({code:s.code,identity:s.identity||'',displayName:s.displayName||'',email:s.email||'',result:'CHYBA: '+(e.message||e),status:'chyba',approved:false,deliveryStatus:'not-ready',savedAt:new Date().toISOString()});
      }
      renderBatchList();renderBatchReviewDashboard();updateWorkflowDashboard();saveBatchProgress();if($('batchProgressBar'))$('batchProgressBar').style.width=Math.round((i+1)/pending.length*100)+'%';
    }
    state.result=makeBatchSummaryText();renderResult();$('next3').disabled=false;saveState();saveBatchProgress();recordEssayTelemetry(pending.length,successful,failed);recorded=true;goTo(4);
  }catch(e){
    const isCancelled=/zrušeno|cancelled|canceled|abort/i.test(String(e?.message||e));const remaining=Math.max(0,pending.length-successful-failed);if(isCancelled)cancelled=remaining;else failed+=remaining;
    recordEssayTelemetry(pending.length,successful,failed,cancelled);recorded=true;toast(e.message||String(e),'err');
  }finally{
    if(!recorded)recordEssayTelemetry(pending.length,successful,failed,Math.max(0,pending.length-successful-failed));
    abortController=null;$('runBtn').disabled=false;renderWorkMode();$('cancelBtn').classList.add('hidden');$('batchProgress')?.classList.add('hidden');renderBatchList();
  }
}
function batchApiCreateUrl(model){return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(String(model||GEMINI_MODEL_DEFAULT).replace(/^models\//,''))}:batchGenerateContent`;}
function batchApiStatusUrl(name){return `https://generativelanguage.googleapis.com/v1beta/${String(name||'').replace(/^\/+/, '')}`;}
function batchInlineRequest(student){return {request:{contents:[{role:'user',parts:geminiPartsForStudent(student)}],generationConfig:structuredGenerationConfig()},metadata:{key:student.code}};}
function estimateBatchPayloadBytes(body){try{return new Blob([JSON.stringify(body)]).size;}catch(_){return JSON.stringify(body).length*2;}}
async function submitGeminiBatchJob(model){const ready=batchReadyStudents().filter(s=>!batchResultDone(s.code));if(!ready.length){toast('Všechny práce už mají výsledek.','warn');return;}const body={batch:{display_name:`${seriesDisplayName()} ${new Date().toISOString()}`,input_config:{requests:{requests:ready.map(batchInlineRequest)}}}};try{$('runBtn').disabled=true;$('runStatus').textContent='Odesílám úspornou Batch API úlohu…';const payloadBytes=estimateBatchPayloadBytes(body);if(payloadBytes>19*1024*1024)throw new Error('Inline Batch požadavek překračuje bezpečný limit 19 MB. Použij okamžitou frontu nebo budoucí serverový režim.');const res=await fetch(batchApiCreateUrl(model),{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':geminiApiKey},body:JSON.stringify(body)});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.error?.message||`Batch API HTTP ${res.status}`);state.batchJob={name:data.name||data.batch?.name,state:data.state||data.metadata?.state||data.batch?.state||'JOB_STATE_PENDING',codes:ready.map(s=>s.code),model,submittedAt:new Date().toISOString(),lastCheckedAt:null};state.series.batchJob=state.batchJob;saveState();renderBatchJobPanel();toast('Batch úloha byla přijata. Výsledky načteš tlačítkem Zkontrolovat Batch úlohu.');}catch(e){toast('Batch API: '+(e.message||e),'err');}finally{$('runBtn').disabled=false;renderWorkMode();}}
async function checkGeminiBatchJob(){
  ensureWorkflowState();const job=state.batchJob||state.series?.batchJob;if(!job?.name){toast('Není uložená žádná Batch úloha.','warn');return;}
  if(!geminiApiKey&&getGeminiInputKey())useGeminiKeyForSession();geminiApiKey=getGeminiInputKey()||geminiApiKey;if(!geminiApiKey){toast('Zadej stejný Gemini API klíč, kterým byla úloha vytvořena.','err');return;}
  try{
    const res=await fetch(batchApiStatusUrl(job.name),{headers:{'x-goog-api-key':geminiApiKey}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.error?.message||`HTTP ${res.status}`);
    job.state=data.state||data.metadata?.state||data.batch?.state||job.state;job.lastCheckedAt=new Date().toISOString();state.batchJob=job;state.series.batchJob=job;
    if(/SUCCEEDED|COMPLETED/i.test(job.state))await importGeminiBatchResponses(data,job);
    else if(/FAILED|CANCELLED|CANCELED/i.test(job.state)&&!job.telemetryRecordedAt){const count=(job.codes||[]).length;recordEssayTelemetry(count,0,/FAILED/i.test(job.state)?count:0,/FAILED/i.test(job.state)?0:count);job.telemetryRecordedAt=new Date().toISOString();}
    saveState();renderBatchJobPanel();updateWorkflowDashboard();toast(`Stav Batch úlohy: ${job.state}`);
  }catch(e){toast('Kontrola Batch úlohy selhala: '+(e.message||e),'err');}
}
async function importGeminiBatchResponses(data,job){
  const rows=data?.dest?.inlinedResponses||data?.response?.inlinedResponses||data?.dest?.inlined_responses||data?.output?.inlinedResponses||data?.batch?.dest?.inlinedResponses||[];
  let successful=0,failed=0;
  for(let i=0;i<rows.length;i++){
    const row=rows[i];const code=String(row.metadata?.key||'').trim();if(!code){failed++;job.unassignedResponses=(job.unassignedResponses||0)+1;continue;}const student=batchStudents.find(s=>s.code===code);if(!student){failed++;job.unassignedResponses=(job.unassignedResponses||0)+1;continue;}
    const text=(row.response?.candidates||[]).flatMap(c=>(c.content?.parts||[]).map(p=>p.text||'')).join('').trim();
    try{
      const raw=JSON.parse(text.replace(/^```(?:json)?\s*/i,'').replace(/```$/,'').trim());const evaluation=finalizeEvaluation(raw,student);const usage=registerUsage(row.response?.usageMetadata||{},'batch');
      student.status=evaluation.validation.ok?'hotovo':'kontrola';student.validation=evaluation.validation;student.usage=usage;successful++;
      upsertBatchResult({code,identity:student.identity||'',displayName:student.displayName||'',email:student.email||'',rosterId:student.rosterId||'',result:evaluationToLegacyResult(evaluation),finalEvaluation:evaluation,validation:evaluation.validation,usage,status:student.status,approved:false,deliveryStatus:'not-ready',savedAt:new Date().toISOString()});
    }catch(e){failed++;student.status='chyba';upsertBatchResult({code,result:'CHYBA BATCH: '+(e.message||e),status:'chyba'});}
  }
  const attempted=Math.max((job.codes||[]).length,rows.length);failed+=Math.max(0,attempted-successful-failed);
  if(!job.telemetryRecordedAt){recordEssayTelemetry(attempted,successful,failed);job.telemetryRecordedAt=new Date().toISOString();}
  if(job.unassignedResponses)toast(`${job.unassignedResponses} odpověď${job.unassignedResponses===1?'':'i'} Batch API neobsahovala jednoznačný kód studenta a nebyla proto přiřazena.`,'warn');
  state.result=makeBatchSummaryText();renderBatchList();renderBatchReviewDashboard();renderResult();$('next3').disabled=batchResults.length===0;saveBatchProgress();
}