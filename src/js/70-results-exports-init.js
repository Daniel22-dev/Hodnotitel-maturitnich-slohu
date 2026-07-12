function stripMachineJson(txt){
  let t=String(txt||'');
  const start=t.indexOf(RESULT_JSON_START);
  if(start>=0){
    const end=t.indexOf(RESULT_JSON_END,start);
    if(end>=0) t=t.slice(0,start)+t.slice(end+RESULT_JSON_END.length);
  }
  const fb=t.indexOf(RESULT_FEEDBACK_START);
  if(fb>=0) t=t.slice(fb+RESULT_FEEDBACK_START.length);
  return t.trim();
}
function extractResultViewSection(txt, view='teacher'){
  const base=stripMachineJson(txt);
  const markers=Object.entries(RESULT_VIEW_MARKERS).map(([key,marker])=>({key,marker,idx:base.indexOf(marker)})).filter(x=>x.idx>=0).sort((a,b)=>a.idx-b.idx);
  if(!markers.length) return null;
  const wanted=RESULT_VIEW_MARKERS[view] || RESULT_VIEW_MARKERS.teacher;
  const current=markers.find(x=>x.marker===wanted) || markers.find(x=>x.marker===RESULT_VIEW_MARKERS.teacher) || markers[0];
  const start=current.idx+current.marker.length;
  const next=markers.find(x=>x.idx>current.idx);
  return base.slice(start,next?next.idx:base.length).trim();
}
function buildRecordTableFromMetadata(txt){
  const parsed=extractResultMetadata(txt);
  const m=parsed.meta;
  if(!m){
    return '# Evidence\n\nStrojový souhrn není dostupný. Přepni na učitelský detail a zkontroluj výsledek ručně.';
  }
  const labels={
    zadani_a_rozsah:'Zadání a rozsah',
    odstavce_a_koherence:'Odstavce a koherence',
    lexikalni_a_spellingove_chyby:'Lexikální a spellingové chyby',
    gramaticke_chyby:'Gramatické chyby',
    obsah:'Obsah',
    ptn_a_koheze:'PTN a koheze',
    uroven_slovni_zasoby:'Úroveň slovní zásoby',
    uroven_gramatiky:'Úroveň gramatiky'
  };
  const rows=RESULT_SECTION_KEYS.map(k=>`| ${labels[k]||k} | ${m.sections?.[k] ?? '—'} | |`).join('\n');
  const fail=m.fail_signal?('ano'+(m.fail_reason?' – '+m.fail_reason:'')):'ne';
  return `# Evidence\n\n| Kategorie | Body | Hlavní důvod |\n|---|---:|---|\n${rows}\n\n| Souhrn | Hodnota |\n|---|---:|\n| Body celkem | ${m.score_total ?? '—'}/24 |\n| Známka | ${m.grade ?? '—'} |\n| Finální počet slov | ${m.final_word_count ?? '—'} |\n| RAW počet slov | ${m.raw_word_count ?? '—'} |\n| Odečteno slov | ${m.deducted_word_count ?? '—'} |\n| Fail signál | ${fail} |\n| Odhad šablonovitosti / AI jazyka | ${m.ai_language_estimate_percent ?? '—'} % |`;
}
function buildStudentFallbackFromMetadata(txt){
  const s=resultSummaryParts(txt);
  return `# Zpětná vazba pro studenta\n\nSamostatná studentská sekce v tomto výsledku není dostupná, protože výstup vznikl ve starší verzi nebo byl vložen ručně bez značek.\n\n- Body: ${s.score!==null?s.score+'/24':'—'}\n- Známka: ${s.grade!==null?s.grade:'—'}\n- Finální počet slov: ${s.words!==null?s.words:'—'}\n\nPro konkrétní chyby a doporučení použij učitelský detail.`;
}
function displayFeedbackText(txt, view=null){
  const selected=view || state.resultView || state.outputStyle || 'teacher';
  const section=extractResultViewSection(txt, selected);
  if(section) return section;
  if(selected==='record') return buildRecordTableFromMetadata(txt);
  if(selected==='student') return buildStudentFallbackFromMetadata(txt);
  return stripMachineJson(txt) || String(txt||'').trim();
}
function preflightInfo(model){
  syncStateFromFields(false);
  const scan=runPrivacyScan();
  const g=GENRES.find(x=>x.id===state.genre);
  const task=state.taskTitle||currentTask().title||'—';
  const evalLabel={count:'Jen počet slov',standard:'Standardní hodnocení',deep:'Hloubková analýza'}[state.evalMode]||state.evalMode;
  const filesCount=state.inputMode==='batch'?batchStudents.reduce((a,s)=>a+(s.files||[]).length,0):attachedFiles.length;
  let code=state.studentCode||'STUDENT_001';
  let words='—';
  let students=1;
  if(state.inputMode==='batch'){
    const ready=batchStudents.filter(s=>String(s.text||'').trim() || (s.files||[]).length);
    students=ready.length;
    code=ready.map(s=>s.code).slice(0,4).join(', ')+(ready.length>4?'…':'');
    const counts=ready.filter(s=>String(s.text||'').trim()).map(s=>localWordCountReport(s.text||'',state.taskText||'',task,state.genre||'').finalCount);
    words=counts.length?`${counts.reduce((a,b)=>a+b,0)} celkem (${Math.min(...counts)}–${Math.max(...counts)} na text)`:'text v přílohách / neuvedeno';
  }else{
    const wc=localWordCountReport(state.studentText||'',state.taskText||'',task,state.genre||'');
    words=String(wc.finalCount);
  }
  return {scan,g,task,evalLabel,filesCount,code,words,students,model:model||resolveGeminiModel(),output:outputStyleLabel(state.outputStyle||state.resultView||'teacher')};
}
function preflightPreviewText(){
  if(state.inputMode==='batch'){
    const ready=batchStudents.filter(s=>String(s.text||'').trim() || (s.files||[]).length);
    return ready.map((s,i)=>`===== ${i+1}. ${s.code} =====\n${getOutboundStudentTextFromValues(s.text||'',s.identity||'',s.code||('STUDENT_'+String(i+1).padStart(3,'0')),s.extraPii||'').text || '[Text je v přiloženém obrázku/PDF.]'}`).join('\n\n').slice(0,18000);
  }
  return (getOutboundStudentText().text || '[Text je v přiloženém obrázku/PDF.]').slice(0,18000);
}
function buildPreflightHtml(model, showPreview=false){
  const i=preflightInfo(model);
  const suspicious=i.scan.blocking.length;
  const attachWarnings=i.scan.attachmentWarnings.length;
  const summary=[
    ['Kód / dávka', state.inputMode==='batch'?`${i.students} studentů: ${i.code||'—'}`:i.code],
    ['Zadání', i.task],
    ['Útvar', i.g?.label||state.genre||'—'],
    ['Text', `${i.words} slov`],
    ['Přílohy', String(i.filesCount)],
    ['Podezřelé údaje', `${suspicious} nálezů${attachWarnings?`, ${attachWarnings} upozornění k přílohám`:''}`],
    ['Režim hodnocení', i.evalLabel],
    ['Výstupní styl', i.output],
    ['Model', i.model]
  ].map(([k,v])=>`<div class="preflight-item"><b>${escapeHtml(k)}</b>${escapeHtml(v)}</div>`).join('');
  const warn=(suspicious||attachWarnings)?`<div class="warn-box"><strong>Pozor:</strong> aktuální kontrola stále eviduje ${suspicious} podezřelých nálezů a ${attachWarnings} upozornění k přílohám. Pokud jsi je už vědomě potvrdil/a v Privacy režimu, můžeš pokračovat; jinak se vrať k anonymizaci.</div>`:'<div class="ok-box">✓ Privacy kontrola nehlásí nevyřešený textový nález. Přesto zkontroluj přílohy a odchozí text.</div>';
  const preview=showPreview?`<div class="field-label" style="margin-top:10px">Odchozí pseudonymizovaný text</div><div class="preflight-preview">${escapeHtml(preflightPreviewText())}</div>`:'';
  return `<div class="small-muted">Toto je poslední kontrola před skutečným voláním Gemini API. Aplikace odešle pouze pseudonymizovaný text, zadání, rubriku a případné přílohy.</div><div class="preflight-summary">${summary}</div>${warn}${preview}`;
}
function preflightConfirmBeforeApi(model){
  return new Promise(resolve=>{
    const render=(showPreview=false)=>showModal('Kontrola před odesláním do Gemini', buildPreflightHtml(model,showPreview), [
      {label:'Vrátit se k anonymizaci',onClick:()=>{goTo(2); resolve(false);}},
      {label:'Zkontrolovat odchozí text',close:false,onClick:()=>render(true)},
      {label:'Odeslat do Gemini',className:'primary',onClick:()=>resolve(true)}
    ]);
    render(false);
  });
}


function defaultTeacherReview(){ return {sections:{}, score_total:null, grade:null, note:'', verified:false, verifiedAt:''}; }
function normalizeTeacherReview(review){
  const r = review && typeof review==='object' ? review : {};
  const sections={}; const src=r.sections&&typeof r.sections==='object'?r.sections:{};
  RESULT_SECTION_KEYS.forEach(k=>{ sections[k]=clampIntOrNull(src[k],0,3); });
  return {sections, score_total:clampIntOrNull(r.score_total,0,24), grade:clampIntOrNull(r.grade,1,5), note:String(r.note||''), verified:Boolean(r.verified), verifiedAt:String(r.verifiedAt||'')};
}
function teacherReviewHasData(review=state.teacherReview){
  const r=normalizeTeacherReview(review);
  return r.verified || !!r.note.trim() || r.score_total!==null || r.grade!==null || RESULT_SECTION_KEYS.some(k=>r.sections[k]!==null);
}
function currentResultMeta(txt=state.result){ return extractResultMetadata(txt||'').meta || null; }
function resultContextForText(txt=state.result){
  const needle=String(txt||'');
  return batchResults.find(r=>String(r?.result||'')===needle) || null;
}
function getEffectiveReview(txt=state.result,options={}){
  const meta=currentResultMeta(txt)||{};
  const batchContext=options.context||resultContextForText(txt);
  const useTeacherReview=options.useTeacherReview!==undefined
    ? Boolean(options.useTeacherReview)
    : (!batchContext && txt===state.result && state.inputMode!=='batch');
  const review=useTeacherReview?normalizeTeacherReview(state.teacherReview):normalizeTeacherReview(defaultTeacherReview());
  const sections={};
  RESULT_SECTION_KEYS.forEach(k=>{ sections[k]=review.sections[k]!==null ? review.sections[k] : (meta.sections?.[k] ?? null); });
  const vals=Object.values(sections).filter(v=>v!==null);
  const sum=vals.length===8?vals.reduce((a,b)=>a+b,0):null;
  const score=review.score_total!==null ? review.score_total : (sum!==null ? sum : (meta.score_total ?? null));
  const grade=review.grade!==null ? review.grade : (meta.grade ?? null);
  return {
    sections,
    score_total:score,
    grade,
    final_word_count:meta.final_word_count??null,
    raw_word_count:meta.raw_word_count??null,
    deducted_word_count:meta.deducted_word_count??null,
    fail_signal:meta.fail_signal?true:false,
    fail_reason:meta.fail_reason||'',
    ai_language_estimate_percent:meta.ai_language_estimate_percent??null,
    student_code:meta.student_code||batchContext?.code||state.studentCode||'',
    source:meta.source||'none',
    note:review.note,
    verified:review.verified,
    verifiedAt:review.verifiedAt,
    hasTeacherReview:useTeacherReview&&teacherReviewHasData(review)
  };
}
function renderTeacherReviewPanel(forceDefaults=false){
  const panel=$('teacherReviewPanel'); if(!panel) return;
  const isBatch=batchResults.length>0 || state.inputMode==='batch';
  const hasResult=!!(state.result&&state.result.trim()) && !isBatch;
  panel.classList.toggle('hidden',!hasResult);
  if(!hasResult) return;
  const meta=currentResultMeta(state.result)||{};
  const review=forceDefaults?defaultTeacherReview():normalizeTeacherReview(state.teacherReview);
  const grid=$('teacherReviewGrid');
  if(grid){
    grid.innerHTML=RESULT_SECTION_KEYS.map(k=>{
      const val=review.sections[k]!==null?review.sections[k]:(meta.sections?.[k]??'');
      return `<div class="review-item"><label for="review_${k}">${escapeHtml(RESULT_SECTION_LABELS[k]||k)}</label><input type="number" min="0" max="3" step="1" id="review_${k}" data-review-section="${k}" value="${val==null?'':escapeHtml(String(val))}"></div>`;
    }).join('');
  }
  const scoreVal=review.score_total!==null?review.score_total:(meta.score_total??'');
  if($('teacherReviewScore')) $('teacherReviewScore').value=scoreVal==null?'':scoreVal;
  const gradeVal=review.grade!==null?review.grade:(meta.grade??'');
  if($('teacherReviewGrade')) $('teacherReviewGrade').value=gradeVal==null?'':gradeVal;
  if($('teacherReviewNote')) $('teacherReviewNote').value=review.note||'';
  if($('teacherReviewVerified')) $('teacherReviewVerified').checked=!!review.verified;
  if($('teacherReviewVerifiedAt')) $('teacherReviewVerifiedAt').textContent=review.verifiedAt?('Potvrzeno: '+review.verifiedAt):'Zatím nepotvrzeno jako finální lidská kontrola.';
}
function syncTeacherReviewFromFields(markVerifiedDate=false){
  if(!$('teacherReviewPanel')) return;
  const sections={};
  RESULT_SECTION_KEYS.forEach(k=>{ const el=document.querySelector(`[data-review-section="${k}"]`); sections[k]=clampIntOrNull(el?.value,0,3); });
  let verified=!!$('teacherReviewVerified')?.checked;
  let old=normalizeTeacherReview(state.teacherReview);
  let verifiedAt=old.verifiedAt;
  if(markVerifiedDate && verified && !verifiedAt) verifiedAt=new Date().toLocaleString('cs-CZ');
  if(!verified) verifiedAt='';
  state.teacherReview={sections, score_total:clampIntOrNull($('teacherReviewScore')?.value,0,24), grade:clampIntOrNull($('teacherReviewGrade')?.value,1,5), note:String($('teacherReviewNote')?.value||''), verified, verifiedAt};
}
function recalculateTeacherReviewTotal(){
  const vals=RESULT_SECTION_KEYS.map(k=>clampIntOrNull(document.querySelector(`[data-review-section="${k}"]`)?.value,0,3));
  if(vals.every(v=>v!==null) && $('teacherReviewScore')) $('teacherReviewScore').value=String(vals.reduce((a,b)=>a+b,0));
}
function handleTeacherReviewInput(){ syncTeacherReviewFromFields(false); renderResultSummary(state.result); saveState(); }
function teacherReviewMarkdown(txt=state.result){
  const e=getEffectiveReview(txt);
  const rows=RESULT_SECTION_KEYS.map(k=>`| ${RESULT_SECTION_LABELS[k]||k} | ${e.sections[k] ?? '—'} |`).join('\n');
  const verified=e.verified?`ano${e.verifiedAt?' – '+e.verifiedAt:''}`:'ne';
  const note=e.note&&e.note.trim()?e.note.trim():'—';
  return `## Finální kontrola učitele\n\n| Kategorie | Finální body |\n|---|---:|\n${rows}\n\n| Souhrn | Hodnota |\n|---|---:|\n| Finální body celkem | ${e.score_total ?? '—'}/24 |\n| Finální známka | ${e.grade ?? '—'} |\n| Finální počet slov | ${e.final_word_count ?? '—'} |\n| Ověřeno učitelem | ${verified} |\n| Poznámka učitele | ${String(note).replace(/\n/g,' ')} |`;
}
function exportHeaderMarkdown(view=null,txt=state.result,context=null){
  ensureWorkflowState();
  context=context||resultContextForText(txt);
  const e=getEffectiveReview(txt,{useTeacherReview:!context,context});
  const g=GENRES.find(x=>x.id===state.genre);
  const viewName=outputStyleLabel(view||state.resultView||state.outputStyle||'teacher');
  const studentName=context?.identity||state.studentIdentity||'—';
  const studentCode=context?.code||e.student_code||state.studentCode||'—';
  return `# Gymnázium, Ostrava-Hrabůvka, příspěvková organizace\n\n## Hodnocení maturitního slohu\n\n| Položka | Hodnota |\n|---|---|\n| Série | ${seriesDisplayName()} |\n| Třída | ${state.series.className||'—'} |\n| Student | ${studentName} |\n| Kód studenta | ${studentCode} |\n| Zadání | ${state.taskTitle||currentTask().title||'—'} |\n| Útvar | ${g?.label||state.genre||'—'} |\n| Datum práce | ${state.series.assessmentDate||'—'} |\n| Hodnotitel | ${state.series.teacherName||'—'} |\n| Zobrazený výstup | ${viewName} |\n| Body / známka | ${(e.score_total??'—')}/24 · známka ${e.grade??'—'} |\n| Finální počet slov | ${e.final_word_count??'—'} |\n| Ověřeno učitelem | ${e.verified?'ano':'ne'} |\n| Verze rubriky | ${RUBRIC_VERSION} |\n| Vytvořeno v aplikaci | Hodnotitel maturitních slohů ${APP_VERSION} |\n| Datum exportu | ${new Date().toLocaleString('cs-CZ')} |\n\n`;
}
function composeExportMarkdown(view=null,txt=state.result,context=null){
  const selected=view||state.resultView||state.outputStyle||'teacher';
  context=context||resultContextForText(txt);
  const teacherSection=context?'':teacherReviewMarkdown(txt)+'\n\n---\n\n';
  const enhancements=typeof reportEnhancementMarkdown==='function'?reportEnhancementMarkdown(txt,selected,context):'';
  return exportHeaderMarkdown(selected,txt,context)+teacherSection+displayFeedbackText(txt,selected)+enhancements;
}
function markdownToPlainText(md){ return String(md||'').replace(/```[\s\S]*?```/g,'').replace(/^#+\s*/gm,'').replace(/\*\*(.*?)\*\*/g,'$1').replace(/`([^`]+)`/g,'$1').replace(/\|/g,'\t').replace(/\n{3,}/g,'\n\n').trim(); }
function xmlEscape(s){ return String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c])); }
async function downloadDocx(){
  try{
    syncTeacherReviewFromFields(true); saveState(); const title=safeFileName(state.taskTitle||currentTask().title||'hodnoceni');
    if(batchResults.length){ await downloadBatchDocxZip(); return; }
    const blob=await createDocxBlob('Hodnocení maturitního slohu', composeExportMarkdown()); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${title}_hodnoceni.docx`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('DOCX stažen.');
  }catch(e){ toast(e.message||String(e),'err'); }
}
async function downloadBatchDocxZip(){
  const JSZip=await ensureJSZip(); const zip=new JSZip(); const base=safeFileName(state.taskTitle||currentTask().title||'hodnoceni');
  for(let i=0;i<batchResults.length;i++){ const r=batchResults[i]; const blob=await createDocxBlob(`${r.code} – zpětná vazba`, composeExportMarkdown(state.resultView,r.result,r)); zip.file(`${String(i+1).padStart(2,'0')}_${safeFileName(r.code)}_zpetna_vazba.docx`,blob); }
  const out=await zip.generateAsync({type:'blob'}); const a=document.createElement('a'); a.href=URL.createObjectURL(out); a.download=`${base}_docx_zpetne_vazby.zip`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('DOCX ZIP stažen.');
}
function summaryRows(){
  const rows=[]; const baseTask=state.taskTitle||currentTask().title||'';
  if(batchResults.length){ batchResults.forEach((r,i)=>{ const s=resultSummaryParts(r.result); const m=extractResultMetadata(r.result).meta||{}; rows.push({poradi:i+1,kod:r.code,stav:r.status,body:s.score??'',znamka:s.grade??'',slova:s.words??'',fail:s.fail?'ano':'ne',souhrn:s.source||'',zadani:baseTask,overeno:'',poznamka:'',lokalni:r.identity||r.sourceName||''}); }); }
  else { const e=getEffectiveReview(state.result); rows.push({poradi:1,kod:e.student_code||state.studentCode||'',stav:'hotovo',body:e.score_total??'',znamka:e.grade??'',slova:e.final_word_count??'',fail:e.fail_signal?'ano':'ne',souhrn:e.source||'',zadani:baseTask,overeno:e.verified?'ano':'ne',poznamka:e.note||'',lokalni:state.studentIdentity||''}); }
  return rows;
}
function rowsToCsv(rows){ const headers=['poradi','kod','stav','body','znamka','slova','fail','souhrn','zadani','overeno','poznamka','lokalni']; return [headers.join(';')].concat(rows.map(r=>headers.map(h=>'"'+String(r[h]??'').replace(/"/g,'""')+'"').join(';'))).join('\n'); }
function downloadCsvSummary(){ syncTeacherReviewFromFields(true); saveState(); const csv=rowsToCsv(summaryRows()); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFileName(state.taskTitle||currentTask().title||'hodnoceni')}_souhrn.csv`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('CSV souhrn stažen.'); }
function columnName(n){ let s=''; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); } return s; }
async function createXlsxBlob(rows){
  const JSZip=await ensureJSZip(); const zip=new JSZip(); const headers=['pořadí','kód','stav','body','známka','slova','fail','souhrn','zadání','ověřeno učitelem','poznámka učitele','lokální identifikace']; const keys=['poradi','kod','stav','body','znamka','slova','fail','souhrn','zadani','overeno','poznamka','lokalni'];
  const all=[headers,...rows.map(r=>keys.map(k=>r[k]??''))];
  const sheetRows=all.map((row,ri)=>`<row r="${ri+1}">`+row.map((v,ci)=>`<c r="${columnName(ci+1)}${ri+1}" t="inlineStr"><is><t>${xmlEscape(v)}</t></is></c>`).join('')+`</row>`).join('');
  zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  zip.folder('_rels').file('.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.folder('xl').file('workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Souhrn" sheetId="1" r:id="rId1"/></sheets></workbook>');
  zip.folder('xl').folder('_rels').file('workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
  zip.folder('xl').folder('worksheets').file('sheet1.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`);
  return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
async function downloadXlsxSummary(){ try{ syncTeacherReviewFromFields(true); saveState(); const blob=await createXlsxBlob(summaryRows()); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFileName(state.taskTitle||currentTask().title||'hodnoceni')}_souhrn.xlsx`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('XLSX souhrn stažen.'); }catch(e){ toast(e.message||String(e),'err'); } }
function buildEmailText(txt=state.result, code=state.studentCode){ const context=resultContextForText(txt); const feedback=displayFeedbackText(txt,'student')+(typeof reportEnhancementMarkdown==='function'?reportEnhancementMarkdown(txt,'student',context):''); const e=getEffectiveReview(txt,{useTeacherReview:!context,context}); const note=e.note&&e.note.trim()?`\n\nPoznámka učitele: ${e.note.trim()}`:''; return `Dobrý den,\n\nposílám zpětnou vazbu ke slohové práci (${code||'student'}).\n\n${feedback}${note}\n\nS pozdravem`; }
async function downloadEmailTemplate(){
  try{
    if(batchResults.length){ const JSZip=await ensureJSZip(); const zip=new JSZip(); batchResults.forEach((r,i)=>zip.file(`${String(i+1).padStart(2,'0')}_${safeFileName(r.code)}_email.txt`,buildEmailText(r.result,r.code))); const blob=await zip.generateAsync({type:'blob'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFileName(state.taskTitle||currentTask().title||'hodnoceni')}_emailove_sablony.zip`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('E-mailové šablony staženy jako ZIP.'); return; }
    syncTeacherReviewFromFields(true); saveState(); const blob=new Blob([buildEmailText()],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFileName(state.taskTitle||currentTask().title||'hodnoceni')}_email.txt`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('E-mailová šablona stažena.');
  }catch(e){ toast(e.message||String(e),'err'); }
}
function renderBatchAggregateSummary(){
  const el=$('resultSummary'); if(!el) return;
  const finished=batchResults.filter(r=>r?.result);
  const scores=finished.map(r=>getEffectiveReview(r.result,{useTeacherReview:false}).score_total).filter(Number.isFinite);
  const valid=finished.filter(r=>r.validation?.ok).length;
  const review=finished.filter(r=>!r.validation?.ok).length;
  const approved=finished.filter(r=>r.approved).length;
  const average=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1):'—';
  el.innerHTML=`<div class="sum-card"><b>Reporty</b><span>${finished.length}</span></div><div class="sum-card"><b>Průměr</b><span>${average}${average==='—'?'':'/24'}</span></div><div class="sum-card"><b>Validní</b><span>${valid}</span></div><div class="sum-card"><b>Ke kontrole</b><span>${review}</span></div><div class="sum-card"><b>Schváleno</b><span>${approved}</span></div>`;
}
function renderResult(){
  if(!$('resultBox')) return;
  const isBatch=batchResults.length>0;
  const text=state.result||'Zatím není vygenerované žádné hodnocení.';
  if(isBatch) renderBatchAggregateSummary(); else renderResultSummary(text);
  renderResultViewControls();
  renderTeacherReviewPanel();
  const resultBox=$('resultBox');
  resultBox.classList.toggle('has-report',Boolean(state.result&&state.result.trim()));
  resultBox.innerHTML=state.result&&state.result.trim()
    ? (isBatch?`<div class="batch-overview"><h2>Dávkové hodnocení je připravené</h2><p>Níže najdeš samostatný školní report pro každého studenta. Před schválením zkontroluj výsledky označené jako „ke kontrole“ a ověř správné spárování e-mailů.</p></div>`:renderReportDocument(text,state.resultView,null))
    : markdownToHtml(text);
  if($('batchResultsBox')){
    $('batchResultsBox').classList.toggle('hidden',!isBatch);
    $('batchResultsBox').innerHTML=isBatch?batchResults.map((r,i)=>{
      const status=r.validation?.ok?'Validní výstup':'Vyžaduje kontrolu';
      return `<section class="batch-result-card"><div class="batch-result-toolbar"><div><h3>${escapeHtml(r.identity||r.code)}</h3><span>${escapeHtml(r.code)} · ${escapeHtml(status)}</span></div><div class="batch-result-actions"><button class="btn-mini" data-copy-batch="${i}">Zkopírovat report</button><button class="btn-mini" data-download-batch="${i}">Stáhnout TXT</button></div></div>${renderReportDocument(r.result||'',state.resultView,r)}</section>`;
    }).join(''):'';
    document.querySelectorAll('[data-copy-batch]').forEach(b=>b.onclick=()=>{
      const r=batchResults[Number(b.dataset.copyBatch)];
      copyText(composeExportMarkdown(state.resultView,r.result,r),'Report zkopírován.');
    });
    document.querySelectorAll('[data-download-batch]').forEach(b=>b.onclick=()=>downloadSingleBatchTxt(Number(b.dataset.downloadBatch)));
  }
  $('downloadZipBtn')?.classList.toggle('hidden',!isBatch);
  if($('rawResult')) $('rawResult').textContent=text;
  if($('rawResultWrap')) $('rawResultWrap').classList.toggle('hidden',!showRaw);
  if(typeof renderReportEnhancementControls==='function') renderReportEnhancementControls();
}
function renderResultSummary(text){
  const el=$('resultSummary'); if(!el) return;
  const hasReal=state.result&&state.result.trim(); if(!hasReal){ el.innerHTML=''; return; }
  const s=resultSummaryParts(text);
  const eff=getEffectiveReview(text);
  const score=eff.score_total!==null?eff.score_total:(s.score!==null?s.score:'—');
  const grade=eff.grade!==null?eff.grade:(s.grade!==null?s.grade:'—');
  const words=eff.final_word_count!==null?eff.final_word_count:(s.words!==null?s.words:'—');
  const fail=eff.fail_signal?'zkontrolovat':'ne';
  const srcLabel=eff.hasTeacherReview?'učitel':(s.source==='json'?'JSON':s.source==='fallback'?'fallback':'chybí');
  const warn=(!s.ok && s.error)?`<div class="warn-box" style="grid-column:1/-1;margin:0"><strong>Strojový souhrn:</strong> ${escapeHtml(s.error)} Souhrn se pokusil použít nouzový fallback.</div>`:'';
  el.innerHTML=`<div class="sum-card"><b>Body</b><span>${score}${score==='—'?'':'/24'}</span></div><div class="sum-card"><b>Známka</b><span>${grade}</span></div><div class="sum-card"><b>Slova</b><span>${words}</span></div><div class="sum-card"><b>Fail signál</b><span>${fail}</span></div><div class="sum-card"><b>Souhrn</b><span>${srcLabel}</span></div>${warn}`;
}
function markdownToHtml(md){
  return markdownFragmentToHtml(displayFeedbackText(md));
}
function markdownFragmentToHtml(md){
  let s=String(md||'').replace(/```[a-zA-Z]*\n?/g,'').replace(/```/g,'');
  const lines=s.split(/\n/);
  let html='',listType='',inTable=false;
  const closeList=()=>{ if(listType){html+=`</${listType}>`; listType='';} };
  const closeTable=()=>{ if(inTable){html+='</tbody></table></div>'; inTable=false;} };
  const closeAll=()=>{ closeList(); closeTable(); };
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    if(!line){closeAll();continue;}
    if(/^\|.+\|$/.test(line) && i+1<lines.length && /^\|\s*[-:]+/.test(lines[i+1].trim())){
      closeAll();
      const heads=line.split('|').slice(1,-1).map(x=>inlineMd(x.trim()));
      html+='<div class="report-table-wrap"><table><thead><tr>'+heads.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody>';
      inTable=true; i++; continue;
    }
    if(inTable && /^\|.+\|$/.test(line)){
      const cells=line.split('|').slice(1,-1).map(x=>inlineMd(x.trim()));
      html+='<tr>'+cells.map(c=>`<td>${c}</td>`).join('')+'</tr>'; continue;
    }
    closeTable();
    if(/^###\s+/.test(line)){closeList();html+='<h3>'+inlineMd(line.replace(/^###\s+/,''))+'</h3>';continue;}
    if(/^##\s+/.test(line)){closeList();html+='<h2>'+inlineMd(line.replace(/^##\s+/,''))+'</h2>';continue;}
    if(/^#\s+/.test(line)){closeList();html+='<h1>'+inlineMd(line.replace(/^#\s+/,''))+'</h1>';continue;}
    if(/^>\s?/.test(line)){closeList();html+='<blockquote>'+inlineMd(line.replace(/^>\s?/,''))+'</blockquote>';continue;}
    if(/^[-•]\s+/.test(line)){
      if(listType!=='ul'){closeList();html+='<ul>';listType='ul';}
      html+='<li>'+inlineMd(line.replace(/^[-•]\s+/,''))+'</li>';continue;
    }
    if(/^\d+[.)]\s+/.test(line)){
      if(listType!=='ol'){closeList();html+='<ol>';listType='ol';}
      html+='<li>'+inlineMd(line.replace(/^\d+[.)]\s+/,''))+'</li>';continue;
    }
    closeList(); html+='<p>'+inlineMd(line)+'</p>';
  }
  closeAll(); return html;
}
function inlineMd(s){ return escapeHtml(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>'); }
function safeFileName(s){ return String(s||'soubor').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'soubor'; }
function downloadSingleBatchTxt(i){
  const r=batchResults[i]; if(!r) return;
  const blob=new Blob([composeExportMarkdown(state.resultView,r.result||'',r)],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${String(i+1).padStart(2,'0')}_${safeFileName(r.code)}_zpetna_vazba.txt`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove();
}
function ensureJSZip(){
  return new Promise((resolve,reject)=>{
    if(window.JSZip)return resolve(window.JSZip);
    const existing=document.querySelector('script[data-local-jszip="1"]');
    if(existing){existing.addEventListener('load',()=>window.JSZip?resolve(window.JSZip):reject(new Error('Lokální knihovna JSZip se načetla chybně.')), {once:true});existing.addEventListener('error',()=>reject(new Error('Lokální knihovnu JSZip se nepodařilo načíst. Obnov stránku nebo aplikaci znovu nahraj.')), {once:true});return;}
    const script=document.createElement('script');script.src='./vendor/jszip.min.js';script.dataset.localJszip='1';script.onload=()=>window.JSZip?resolve(window.JSZip):reject(new Error('Lokální knihovna JSZip se načetla chybně.'));script.onerror=()=>reject(new Error('Lokální knihovnu JSZip se nepodařilo načíst. Obnov stránku nebo aplikaci znovu nahraj.'));document.head.appendChild(script);
  });
}
async function downloadBatchZip(){
  if(!batchResults.length){toast('Nejdřív vygeneruj dávkové hodnocení.','warn'); return;}
  try{
    const JSZip=await ensureJSZip(); const zip=new JSZip(); const base=safeFileName(state.taskTitle||currentTask().title||'hodnoceni');
    const csvRows=summaryRows();
    batchResults.forEach((r,i)=>{ const fnBase=`${String(i+1).padStart(2,'0')}_${safeFileName(r.code)}`; const readable=composeExportMarkdown(state.resultView,r.result||'',r); zip.folder('txt').file(`${fnBase}_zpetna_vazba.txt`,readable||r.result||''); zip.folder('emailove_sablony').file(`${fnBase}_email.txt`,buildEmailText(r.result,r.code)); });
    for(let i=0;i<batchResults.length;i++){ const r=batchResults[i]; const fnBase=`${String(i+1).padStart(2,'0')}_${safeFileName(r.code)}`; const blob=await createDocxBlob(`${r.code} – zpětná vazba`, composeExportMarkdown(state.resultView,r.result,r)); zip.folder('docx').file(`${fnBase}_zpetna_vazba.docx`,blob); }
    zip.file('souhrn.csv',rowsToCsv(csvRows)); zip.file('souhrn.xlsx',await createXlsxBlob(csvRows)); zip.file('README.txt','Balíček obsahuje TXT a DOCX zpětné vazby, souhrn CSV/XLSX a e-mailové šablony pro ruční rozeslání. Před rozesláním zkontroluj správné spárování se studenty a případné osobní údaje.');
    const blob=await zip.generateAsync({type:'blob'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${base}_balicek_zpetnych_vazeb.zip`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('ZIP balíček stažen.');
  }catch(e){ toast(e.message||String(e),'err'); }
}
function downloadTxt(){
  syncTeacherReviewFromFields(true); saveState(); const text=composeExportMarkdown(); const title=(state.taskTitle||currentTask().title||'hodnoceni').replace(/[^a-z0-9á-žÁ-Ž_-]+/gi,'_').slice(0,80); const blob=new Blob([text],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${title}_hodnoceni.txt`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove();
}
async function copyText(text,msg){ try{ await navigator.clipboard.writeText(text); toast(msg); }catch(e){ toast('Kopírování selhalo. Označ text ručně.','err'); } }
function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
window.addEventListener('beforeunload',saveState);
function registerAppServiceWorker(){ if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){ navigator.serviceWorker.register(`./sw.js?v=${encodeURIComponent(APP_VERSION)}`,{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{}); } }
function renderBuildLabel(){ const el=$('buildLabel'); if(el && RELEASE.build && RELEASE.build!=='__BUILD__') el.textContent='· build '+RELEASE.build; }

