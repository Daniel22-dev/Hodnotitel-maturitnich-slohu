function stripOuterPunct(token){
  return String(token||'').replace(/^[\s"'“”‘’«»„‚()\[\]{}<>.,;:!?¿¡]+|[\s"'“”‘’«»„‚()\[\]{}<>.,;:!?¿¡]+$/g,'');
}
function normalizePlainForCount(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
function normalizeTokenForCount(t){ return normalizePlainForCount(stripOuterPunct(t)); }
function isNumericCountToken(token){
  const c=stripOuterPunct(token).replace(/^[$€£¥]+/,'').replace(/[%]+$/,'');
  return /^[+-]?\d+(?:[.,:/-]\d+)*(?:st|nd|rd|th)?$/i.test(c);
}
function isCapitalizedCountWord(token){
  const c=stripOuterPunct(token);
  if(!c || WC_MONTHS.has(c.toLowerCase())) return false;
  return /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][A-Za-zÁ-žÀ-ÿ'’-]+$/.test(c);
}
function buildCountTokens(text){
  const raw=String(text||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const lines=raw.split('\n');
  const tokens=[];
  let para=0, seenInPara=false;
  lines.forEach((line,lineIndex)=>{
    if(!line.trim()){
      if(seenInPara){ para++; seenInPara=false; }
      return;
    }
    seenInPara=true;
    line.trim().split(/\s+/).filter(Boolean).forEach((rawToken,indexInLine)=>{
      tokens.push({raw:rawToken, clean:stripOuterPunct(rawToken), norm:normalizeTokenForCount(rawToken), para, line:lineIndex, indexInLine, globalIndex:tokens.length});
    });
  });
  const paragraphs=tokens.length ? (Math.max(...tokens.map(t=>t.para))+1) : 0;
  return {tokens, lines, paragraphs};
}
function sentenceEdgesForCount(text){
  const parts=String(text||'').trim().split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean);
  if(parts.length) return {first:parts[0], last:parts[parts.length-1]};
  const trimmed=String(text||'').trim();
  return {first:trimmed||'—', last:trimmed||'—'};
}
function detectHeadingForCount(tokens, lines, taskText, taskTitle, genre){
  if(!tokens.length) return null;
  const firstLineNo=tokens[0].line;
  const firstLineTokens=tokens.filter(t=>t.line===firstLineNo);
  const rawLine=String(lines[firstLineNo]||'').trim();
  const len=firstLineTokens.length;
  if(!len || len>12) return null;
  if(/^\s*(Dear\b|To whom\b|Yours\b|Kind regards\b)/i.test(rawLine)) return null;
  if(/[.!?]\s*$/.test(rawLine)) return null;
  const headingNorm=normalizePlainForCount(rawLine);
  if(!headingNorm || headingNorm.length<2) return null;
  const taskNorm=normalizePlainForCount((taskText||'')+' '+(taskTitle||''));
  const copied=taskNorm && taskNorm.includes(headingNorm);
  const nextLine=lines[firstLineNo+1]||'';
  const followedByBlank=!String(nextLine).trim();
  const titleCaseCount=firstLineTokens.filter(t=>isCapitalizedCountWord(t.raw)).length;
  const likelyTitle = copied || followedByBlank || ['review','narration'].includes(genre||'') || (titleCaseCount>=2 && len<=8);
  if(!likelyTitle) return null;
  return {type:copied?'převzatý nadpis':'originální nadpis', copied, raw:rawLine, indices:firstLineTokens.map(t=>t.globalIndex)};
}
function addDeductToken(deductMap, idx, reason){
  if(idx==null || idx<0 || deductMap.has(idx)) return false;
  deductMap.set(idx, reason);
  return true;
}
function addDeductionReason(details, type, label, amount){
  if(amount<=0) return;
  let item=details.find(x=>x.type===type && x.label===label);
  if(item) item.amount+=amount; else details.push({type,label,amount});
}
function detectCopiedTaskPhrases(tokens, taskText, used, minLen=6, maxLen=12){
  const taskToks=tokenizeSpaces(taskText||'').map(normalizeTokenForCount).filter(Boolean);
  const sets={};
  for(let n=minLen;n<=maxLen;n++){
    const set=new Set();
    for(let i=0;i<=taskToks.length-n;i++) set.add(taskToks.slice(i,i+n).join(' '));
    sets[n]=set;
  }
  const found=[];
  for(let i=0;i<tokens.length;i++){
    if(used.has(i) || !tokens[i].norm) continue;
    for(let n=Math.min(maxLen,tokens.length-i);n>=minLen;n--){
      let ok=true, seq=[];
      for(let j=0;j<n;j++){ if(used.has(i+j) || !tokens[i+j].norm){ ok=false; break; } seq.push(tokens[i+j].norm); }
      if(!ok) continue;
      const key=seq.join(' ');
      if(sets[n] && sets[n].has(key)){
        found.push({indices:Array.from({length:n},(_,k)=>i+k), text:tokens.slice(i,i+n).map(t=>t.raw).join(' ')});
        for(let j=0;j<n;j++) used.add(i+j);
        break;
      }
    }
  }
  return found;
}
function detectProperNamePhrases(tokens, used){
  const occurrences=[];
  for(let i=0;i<tokens.length;i++){
    if(used.has(i) || !isCapitalizedCountWord(tokens[i].raw)) continue;
    const firstClean=stripOuterPunct(tokens[i].raw);
    if(WC_CAP_STOP.has(firstClean)) continue;
    let j=i, indices=[], capCount=0;
    while(j<tokens.length && !used.has(j)){
      const clean=stripOuterPunct(tokens[j].raw);
      const low=clean.toLowerCase();
      const cap=isCapitalizedCountWord(tokens[j].raw);
      const connector=WC_NAME_CONNECTORS.has(low);
      if(cap){ indices.push(j); capCount++; j++; continue; }
      if(connector && indices.length && j+1<tokens.length && !used.has(j+1) && isCapitalizedCountWord(tokens[j+1].raw)){ indices.push(j); j++; continue; }
      break;
    }
    while(indices.length && WC_NAME_CONNECTORS.has(stripOuterPunct(tokens[indices[indices.length-1]].raw).toLowerCase())) indices.pop();
    const significant=indices.filter(idx=>isCapitalizedCountWord(tokens[idx].raw)).length;
    if(indices.length>=2 && significant>=2){
      const text=tokens.slice(indices[0],indices[indices.length-1]+1).map(t=>t.raw).join(' ');
      const key=normalizePlainForCount(text.replace(/^(the|a|an)\s+/i,''));
      if(key) occurrences.push({key,text,indices});
      i=indices[indices.length-1];
    }
  }
  const byKey=new Map();
  occurrences.forEach(o=>{ if(!byKey.has(o.key)) byKey.set(o.key,[]); byKey.get(o.key).push(o); });
  return Array.from(byKey.values()).flatMap(list=>list);
}
function formatDeductionList(wc){
  if(!wc || !wc.details || !wc.details.length) return 'žádné automaticky detekované odečty';
  return wc.details.map(d=>`${d.type}: −${d.amount}${d.label?` (${d.label})`:''}`).join('; ');
}
function formatParagraphAudit(wc){
  if(!wc || !wc.paraCounts || !wc.paraCounts.length) return 'P1=0';
  return wc.paraCounts.map((n,i)=>{
    const raw=wc.paraRawCounts[i]||0, ded=wc.paraDeductions[i]||0;
    return `P${i+1}=${raw}${ded?`−${ded}`:''}=${n}`;
  }).join(', ');
}
function formatWordCountAuditForPrompt(wc){
  if(!wc || !wc.rawCount){
    return 'WORD_COUNT_AUDIT: Textové pole je prázdné nebo je práce pouze v příloze. Lokální aplikace nemůže deterministicky spočítat slova z obrázku/PDF; nejprve proveď přepis a potom počet slov uveď s upozorněním na čitelnost.';
  }
  return `WORD_COUNT_AUDIT:\nRAW COUNT (tokeny mezi mezerami) = ${wc.rawCount}\nODEČTENÉ POLOŽKY = −${wc.deductTotal} [${formatDeductionList(wc)}]\nFINÁLNÍ POČET SLOV = ${wc.rawCount} − ${wc.deductTotal} = ${wc.finalCount}\nKONTROLA PO ODSTAVCÍCH: ${formatParagraphAudit(wc)}; součet = ${wc.paraCounts.reduce((a,b)=>a+b,0)}\nRozsah – kontrola: Z = ${wc.finalCount}; <195? ${wc.finalCount<195?'ano':'ne'}; ≥300? ${wc.finalCount>=300?'ano':'ne'}; penalizace: ${wc.finalCount>=300?'ano':'ne'}\nPoznámka: Tento audit vytvořila aplikace deterministicky před odesláním. Použij ho jako výchozí závazný výpočet; pokud při kontrole textu najdeš zjevný rozpor, upozorni učitele a vysvětli ho.`;
}
function localWordCountReport(text, taskText='', taskTitle='', genre=''){
  const raw=String(text||'').trim();
  const built=buildCountTokens(raw);
  const tokens=built.tokens;
  const deductMap=new Map();
  const details=[];
  const paraRawCounts=Array.from({length:Math.max(1,built.paragraphs||0)},()=>0);
  tokens.forEach(t=>{ if(paraRawCounts[t.para]==null) paraRawCounts[t.para]=0; paraRawCounts[t.para]++; });

  tokens.forEach(t=>{
    if(isNumericCountToken(t.raw)){
      if(addDeductToken(deductMap,t.globalIndex,'číslovka psaná číslicemi')) addDeductionReason(details,'číslice',t.raw,1);
    }
  });

  const heading=detectHeadingForCount(tokens,built.lines,taskText,taskTitle,genre);
  if(heading){
    let amount=0;
    if(heading.copied){
      heading.indices.forEach(idx=>{ if(addDeductToken(deductMap,idx,'převzatý nadpis')) amount++; });
    }else{
      heading.indices.slice(1).forEach(idx=>{ if(addDeductToken(deductMap,idx,'originální nadpis počítaný jako 1 slovo')) amount++; });
    }
    addDeductionReason(details,heading.type,heading.raw,amount);
  }

  const usedForCopied=new Set(deductMap.keys());
  const copied=detectCopiedTaskPhrases(tokens,taskText,usedForCopied,6,12);
  copied.forEach(c=>{
    let amount=0;
    c.indices.forEach(idx=>{ if(addDeductToken(deductMap,idx,'převzatý text ze zadání')) amount++; });
    addDeductionReason(details,'převzatý text ze zadání',c.text,amount);
  });

  const usedForNames=new Set(deductMap.keys());
  const namesByKey=new Map();
  detectProperNamePhrases(tokens,usedForNames).forEach(o=>{ if(!namesByKey.has(o.key)) namesByKey.set(o.key,[]); namesByKey.get(o.key).push(o); });
  namesByKey.forEach((list,key)=>{
    list.forEach((o,occIdx)=>{
      let deductIndices=occIdx===0 ? o.indices.slice(1) : o.indices.slice();
      let amount=0;
      deductIndices.forEach(idx=>{ if(addDeductToken(deductMap,idx,occIdx===0?'víceslovné vlastní jméno/název počítané jako 1 slovo':'opakované vlastní jméno/název')) amount++; });
      addDeductionReason(details,occIdx===0?'víceslovná vlastní jména/názvy':'opakovaná vlastní jména/názvy',o.text,amount);
    });
  });

  const paraDeductions=Array.from({length:paraRawCounts.length},()=>0);
  deductMap.forEach((reason,idx)=>{ const p=tokens[idx]?.para||0; paraDeductions[p]=(paraDeductions[p]||0)+1; });
  const paraCounts=paraRawCounts.map((rawCount,i)=>Math.max(0,rawCount-(paraDeductions[i]||0)));
  const deductTotal=deductMap.size;
  const finalCount=Math.max(0,tokens.length-deductTotal);
  const edges=sentenceEdgesForCount(raw);
  return {rawCount:tokens.length,deduct:deductTotal,deductTotal,details,digitItems:details.filter(d=>d.type==='číslice').map(d=>d.label),finalCount,paragraphs:built.paragraphs||0,paraRawCounts,paraDeductions,paraCounts,firstSentence:edges.first,lastSentence:edges.last,heading};
}
function buildOfflineReport(studentOverride=null){
  const g=GENRES.find(x=>x.id===state.genre);
  const out=studentOverride ? getOutboundStudentTextFromValues(studentOverride.text||'', studentOverride.identity||'', studentOverride.code||'STUDENT_001', studentOverride.extraPii||'') : getOutboundStudentText();
  const files=studentOverride ? (studentOverride.files||[]) : attachedFiles;
  const sourceTextForCount = studentOverride ? (studentOverride.text||'') : (state.studentText||'');
  const wc=localWordCountReport(sourceTextForCount, state.taskText||'', state.taskTitle||currentTask().title||'', state.genre||'');
  const reqs=String(state.taskReqs||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const first=wc.firstSentence||'—';
  const last=wc.lastSentence||'—';
  const rangeFlags=`<195? ${wc.finalCount<195?'ano':'ne'}; ≥300? ${wc.finalCount>=300?'ano':'ne'}; penalizace za délku: ${wc.finalCount>=300?'ano':'ne'}`;
  const piiScan=studentOverride ? scanSensitiveText(out.text||'', studentOverride.identity||'', studentOverride.extraPii||'', out.code||'STUDENT') : (runPrivacyScan().blocking||[]);
  return `# Offline přípravný protokol\n\n**Kód studenta:** ${out.code}\n**Režim:** Offline příprava – bez odeslání do AI\n**Sada:** ${state.set==='exam'?'Ostrá maturitní verze':'Cvičná sada'}\n**Útvar:** ${g?.label||state.genre}\n**Zadání:** ${state.taskTitle||currentTask().title}\n\n## Co tento protokol umí a neumí\n- Vytvořeno pouze lokálně v prohlížeči.\n- Kontroluje přípravu, anonymizaci, deterministický word count podle lokálně zjistitelných pravidel a odstavce.\n- Nehodnotí gramatiku, slovní zásobu, splnění zadání ani výslednou známku – to vyžaduje AI nebo ruční učitelské hodnocení.\n\n## Kontrola vstupu\n**První věta / začátek:** ${first}\n\n**Poslední věta / konec:** ${last}\n\n## Deterministický word count – lokální audit\n1. RAW COUNT (tokeny mezi mezerami) = ${wc.rawCount}\n2. ODEČTENÉ POLOŽKY = −${wc.deductTotal} [${formatDeductionList(wc)}]\n3. FINÁLNÍ POČET SLOV = ${wc.rawCount} − ${wc.deductTotal} = ${wc.finalCount}\n4. KONTROLA PO ODSTAVCÍCH: ${formatParagraphAudit(wc)}; součet = ${wc.paraCounts.reduce((a,b)=>a+b,0)}\n\n**Rozsah – kontrola:** Z = ${wc.finalCount}; ${rangeFlags}\n\n## Povinné body zadání\n${reqs.length?reqs.map((r,i)=>`- R${i+1}: ${r.replace(/^R\d+\s*:\s*/i,'')}`).join('\n'):'- Povinné body nejsou vyplněné.'}\n\n## Přílohy\n${files.length?files.map((f,i)=>`- PŘÍLOHA_${i+1}: ${f.mime||'soubor'}; lokální velikost ${Math.round((f.size||0)/1024)} KB`).join('\n'):'- Bez příloh.'}\n\n## Kontrola citlivých údajů\n${piiScan.length?piiScan.map(x=>`- ${x.type}: ${x.value} – ${x.reason||'podezřelý údaj'}`).join('\n'):'- V pseudonymizované textové verzi nejsou aktuálně nalezené blokující nálezy.'}\n\n## Doporučený další krok\n${files.length?'U fotek/PDF ještě zkontroluj, že přímo v obrázku není viditelné jméno, podpis, třída nebo škola. ':'Textová část je připravená pro ruční AI režim nebo Gemini API režim. '}Pokud chceš jazykové hodnocení, pokračuj režimem **Ruční AI** nebo **Gemini API**.`;
}
function buildBatchOfflineReport(){
  const ready=batchStudents.filter(s=>String(s.text||'').trim() || (s.files||[]).length);
  if(!ready.length) return '# Offline příprava dávky\n\nV dávce zatím není žádný studentský vstup.';
  return '# Offline příprava dávky\n\n'+ready.map((s,i)=>`---\n\n## ${i+1}. ${s.code}\n\n${buildOfflineReport(s).replace(/^# Offline přípravný protokol\n\n/,'')}`).join('\n\n');
}
async function copyPromptWithPrivacyGate(){
  syncStateFromFields(); commitTaskFieldsToDb(false); updateStats();
  if(!hasTaskBasics()){toast('Doplň přesné zadání a povinné body R1–Rn.','err'); goTo(1); return;}
  if(!hasStudentInput()){toast('Vlož studentský text nebo přidej přílohu.','err'); goTo(2); return;}
  if(!(await privacyGateBeforeSend())) return;
  await copyText(buildPrompt(), 'Prompt pro ruční AI zkopírován.');
}
function importManualResult(){
  const val=$('manualResultInput')?.value||'';
  if(!val.trim()){toast('Nejdřív vlož hotové hodnocení z AI.','warn'); return;}
  state.result=val.trim(); batchResults=[]; renderResult(); saveState(); toast('Vložené hodnocení bylo použito jako výsledek.'); goTo(4);
}
function downloadPromptBundleTxt(){
  syncStateFromFields(); commitTaskFieldsToDb(false); updateStats();
  let content='';
  if(state.inputMode==='batch'){
    const ready=batchStudents.filter(s=>String(s.text||'').trim() || (s.files||[]).length);
    if(!ready.length){toast('V dávce není žádný připravený sloh.','warn'); return;}
    content=ready.map((s,i)=>`==================== PROMPT ${i+1}: ${s.code} ====================\n\n${buildPrompt(s)}`).join('\n\n');
  }else{
    content=buildPrompt();
  }
  const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${safeFileName(state.taskTitle||currentTask().title||'prompty')}_prompt${state.inputMode==='batch'?'y':''}.txt`; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); toast('Prompt(y) staženy jako TXT.');
}
