function singleAttachmentTranscriptRequired(){return Boolean((attachedFiles||[]).length&&!String(state.studentText||'').trim());}
function showSingleTranscriptGuidance(){toast('Fotka/PDF vyžaduje nejdřív digitální přepis a jeho učitelskou kontrolu — stejně jako v dávce. Použij tlačítko „Přepsat přes Gemini“.','warn');goTo(2);$('transcribeSingleBtn')?.focus();}
async function transcribeSingleAttachments(){
  syncStateFromFields();
  if(!(attachedFiles||[]).length){toast('Nejdřív přidej fotku nebo PDF.','warn');return;}
  if(!geminiApiKey&&getGeminiInputKey())useGeminiKeyForSession();
  geminiApiKey=getGeminiInputKey()||geminiApiKey;
  if(!geminiApiKey){toast('Pro automatický přepis zadej Gemini API klíč.','err');return;}
  const btn=$('transcribeSingleBtn');if(btn){btn.disabled=true;btn.textContent='Přepisuji…';}
  try{
    const student={code:state.studentCode||'STUDENT_001',files:attachedFiles};
    const out=await callGeminiTranscription(student,geminiApiKey,resolveGeminiModel());
    const text=String(out.text||'').trim();if(!text)throw new Error('Gemini nevrátilo použitelný přepis.');
    state.studentText=text;$('studentText').value=text;state.privacyApprovedHash='';
    updateStats();updatePromptPreview();saveState();renderPrivacyMode();
    toast('Přepis je vložený. Před hodnocením ho celý porovnej s originálem a případné chyby oprav.','warn');
  }catch(e){toast('Přepis se nepodařil: '+(e.message||e),'err');}
  finally{if(btn){btn.disabled=false;btn.textContent='Přepsat přes Gemini';}}
}
function requiresTranscriptReview(student){const s=ensureBatchStudentShape(student);return Boolean((s.files||[]).length&&!s.transcriptConfirmed);}
function confirmStudentTranscript(index){const s=batchStudents[index];if(!s||!String(s.text||'').trim()){toast('Nejdřív doplň nebo vygeneruj digitální přepis.','warn');return;}s.transcriptConfirmed=true;s.transcriptStatus='confirmed';s.status='čeká';renderBatchList();updateWorkflowDashboard();saveBatchProgress();toast(`${s.code}: přepis potvrzen učitelem.`);}
function invalidateStudentTranscript(index){const s=batchStudents[index];if(!s)return;s.transcriptConfirmed=false;s.transcriptStatus='needs-review';s.approved=false;renderBatchList();updateWorkflowDashboard();saveBatchProgress();}
async function transcribeBatchStudent(index){const s=batchStudents[index];if(!s||(s.files||[]).length===0){toast('Tato práce nemá obrazovou nebo PDF přílohu.','warn');return;}if(!geminiApiKey&&getGeminiInputKey())useGeminiKeyForSession();geminiApiKey=getGeminiInputKey()||geminiApiKey;if(!geminiApiKey){toast('Pro automatický přepis zadej Gemini API klíč.','err');return;}s.transcriptStatus='transcribing';s.status='přepisuji';renderBatchList();try{const out=await callGeminiTranscription(s,geminiApiKey,resolveGeminiModel());s.text=out.text||'';s.legibilityPercent=Math.max(0,Math.min(100,Number(out.legibility_percent)||0));s.uncertainFragments=Array.isArray(out.uncertain_fragments)?out.uncertain_fragments:[];s.transcriptStatus='needs-review';s.transcriptConfirmed=false;s.status='čeká';state.privacyApprovedHash='';toast(`${s.code}: přepis připraven ke kontrole.`);}catch(e){s.transcriptStatus='error';s.status='chyba';toast('Přepis se nepodařil: '+(e.message||e),'err');}finally{renderBatchList();updateWorkflowDashboard();saveBatchProgress();}}
async function callGeminiTranscription(student,key,model){const prompt=`PŘESNÝ PŘEPIS RUČNĚ PSANÉHO MATURITNÍHO SLOHU.\n- Přepiš pouze to, co je skutečně čitelné.\n- Neopravuj gramatiku, spelling, slovosled ani styl.\n- Zachovej odstavce a původní chyby.\n- Nečitelné místo označ [?] nebo [nečitelné: odhad].\n- Osobní údaje jako jméno, třída, podpis, e-mail či adresa nahraď [OSOBNÍ_ÚDAJ].\nVrať pouze validní JSON bez Markdownu: {"text":"...","legibility_percent":0,"uncertain_fragments":["..."]}.`;const raw=await callGemini(key,model,prompt,student.files||[],undefined);const cleaned=String(raw||'').replace(/^```(?:json)?\s*/i,'').replace(/```$/,'').trim();let parsed;try{parsed=JSON.parse(cleaned);}catch(_){parsed={text:raw,legibility_percent:0,uncertain_fragments:['Odpověď nebyla ve strukturovaném formátu; celý přepis zkontroluj ručně.']};}return parsed;}
