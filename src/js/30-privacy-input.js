
function tokenizeSpaces(text){ return String(text||'').trim()?String(text).trim().split(/\s+/).filter(Boolean):[]; }
function estimateTokens(s){ return Math.ceil(String(s||'').length/4); }

function escapeRegExp(s){ return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
const DIACRITIC_EQUIV={a:'aáàâäãåāăą',c:'cčćç',d:'dďđ',e:'eéěèêëēėę',i:'iíìîïīį',l:'lĺľł',n:'nňńñ',o:'oóòôöõøōő',r:'rřŕ',s:'sšśş',t:'tťţ',u:'uúůùûüūűų',y:'yýÿ',z:'zžźż'};
function diacriticInsensitiveSource(value){return [...String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')].map(ch=>{const chars=DIACRITIC_EQUIV[ch.toLowerCase()];return chars?`[${chars}]`:escapeRegExp(ch);}).join('');}
function getOutboundStudentText(){
  syncStateFromFields(false);
  return getOutboundStudentTextFromValues(state.studentText, state.studentIdentity, state.studentCode, state.extraPii);
}
function getOutboundStudentTextFromValues(rawText, identity, codeValue, extraPiiValue){
  const code=(codeValue||'STUDENT_001').trim()||'STUDENT_001';
  let text=rawText||''; const map=[];
  const add=(repl,label,wholeToken=false,foldDiacritics=false)=>{ if(!repl) return; const clean=String(repl).trim(); const source=foldDiacritics?diacriticInsensitiveSource(clean):escapeRegExp(clean); if(!source) return; const re=wholeToken?new RegExp(`(^|[^\\p{L}\\p{N}_])(${source})(?=$|[^\\p{L}\\p{N}_])`,'giu'):new RegExp(source,'giu'); if(re.test(text)){ re.lastIndex=0; text=wholeToken?text.replace(re,(_,prefix)=>prefix+label):text.replace(re,label); map.push(`${clean} → ${label}`); } };
  const identityTerms=Array.from(new Set([String(identity||'').trim(),...String(identity||'').trim().split(/[\s,;]+/).map(x=>x.trim()).filter(x=>x.length>=3)])).filter(Boolean).sort((a,b)=>b.length-a.length);
  identityTerms.forEach(term=>add(term,code,true,true));
  String(extraPiiValue||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).forEach((x,i)=>add(x,`[OSOBA_UDÁJ_${i+1}]`));
  let n=0; text=text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,m=>{map.push(`${m} → [EMAIL_${++n}]`); return `[EMAIL_${n}]`;});
  n=0; text=text.replace(/(^|[^\d])((?:(?:\+?420[\s.-]*)?\d{3}[\s.-]+\d{3}[\s.-]+\d{3}|\+?420\d{9}))(?!\d)/g,(_,prefix,m)=>{map.push(`${m} → [TELEFON_${++n}]`); return `${prefix}[TELEFON_${n}]`;});
  n=0; text=text.replace(/https?:\/\/\S+/gi,m=>{map.push(`${m} → [URL_${++n}]`); return `[URL_${n}]`;});
  n=0; text=text.replace(/\b\d{6}\/\d{3,4}\b/g,m=>{map.push(`${m} → [RODNÉ_ČÍSLO_${++n}]`); return `[RODNÉ_ČÍSLO_${n}]`;});
  return {text,map,code};
}
function applyPseudonymizationToField(){ const out=getOutboundStudentText(); if(!out.text.trim()){toast('Nejdřív vlož text.','warn');return;} $('studentText').value=out.text; state.studentText=out.text; renderAnonMap(out); updateStats(); updatePromptPreview(); saveState(); toast('Text v poli byl nahrazen pseudonymizovanou verzí.','warn'); }
function showAnonPreview(){ const out=getOutboundStudentText(); renderAnonMap(out); $('anonPreviewBox').classList.remove('hidden'); $('anonPreview').textContent=out.text||'[Žádný text – hodnotit se budou přílohy.]'; }
function renderAnonMap(out){ $('anonMapBox').classList.remove('hidden'); $('anonMap').textContent=out.map.length?out.map.join('\n'):'Zatím nebyly nalezeny/nahrazeny žádné údaje. Přidej jméno nebo údaje do polí výše.'; }

const PRIVACY_STOP_PHRASES = new Set(['Dear Sir','Dear Madam','Dear Sir or Madam','Yours Faithfully','Yours Sincerely','Kind Regards','Czech Republic','United Kingdom','United States','Present Perfect','Simple Past','Online Education','Public Transport','Music Festival','Adventure Park','Language School','Italian Restaurant','Shopping Centres','Young People','Austrian','Austria','Scotland','Dublin','Prague']);
const PRIVACY_LOCATION_WORDS = ['Ostrava','Praha','Prague','Brno','Olomouc','Plzeň','Pilsen','Liberec','Opava','Karviná','Havířov','Frýdek','Místek','České Budějovice','Hradec Králové','Pardubice','Zlín','Jihlava','Třebíč','Kroměříž','Vyškov'];
let privacyLastScan = null;
function privacyNormalizeValue(v){ return String(v||'').replace(/[.,;:!?()\[\]{}"“”'’]+$/,'').trim(); }
function privacyIsStopPhrase(v){ const x=privacyNormalizeValue(v); if(!x || x.length<2) return true; if(PRIVACY_STOP_PHRASES.has(x)) return true; if(/^STUDENT_\d+/i.test(x) || /^\[(EMAIL|TELEFON|URL|RODNÉ_ČÍSLO|OSOBA_UDÁJ)_\d+\]$/i.test(x)) return true; return false; }
function privacySnippet(text,value){ const t=String(text||''); const idx=t.toLowerCase().indexOf(String(value||'').toLowerCase()); if(idx<0) return ''; return t.slice(Math.max(0,idx-32), Math.min(t.length,idx+String(value).length+32)).replace(/\s+/g,' ').trim(); }
function privacyDedup(items){ const seen=new Set(); return items.filter(it=>{ const key=(it.scope||'')+'|'+(it.type||'')+'|'+privacyNormalizeValue(it.value).toLowerCase(); if(seen.has(key) || privacyIsStopPhrase(it.value)) return false; seen.add(key); it.value=privacyNormalizeValue(it.value); return true; }); }
function collectKnownPrivacyTerms(identity,extraPii){ return [identity, ...String(extraPii||'').split(/\n+/)].map(x=>String(x||'').trim()).filter(Boolean); }
function scanSensitiveText(text, identity='', extraPii='', scope='student'){
  const raw=String(text||''); const findings=[]; const known=collectKnownPrivacyTerms(identity,extraPii).map(x=>x.toLowerCase());
  const add=(type,value,reason,severity='warn',auto=false)=>{ value=privacyNormalizeValue(value); if(!value || value.length<2) return; const low=value.toLowerCase(); if(known.some(k=>k && low===k)) return; findings.push({scope,type,value,reason,severity,auto,selected:!auto,snippet:privacySnippet(raw,value)}); };
  const each=(re,type,reason,severity='warn',auto=false,group=0)=>{ let m; const r=new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'); while((m=r.exec(raw))){ add(type,m[group]||m[0],reason,severity,auto); if(m[0].length===0) r.lastIndex++; } };
  each(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'e-mail','e-mail se nahrazuje automaticky', 'ok', true);
  each(/(^|[^\d])((?:(?:\+?420[\s.-]*)?\d{3}[\s.-]+\d{3}[\s.-]+\d{3}|\+?420\d{9}))(?!\d)/g,'telefon','telefonní číslo se nahrazuje automaticky', 'ok', true, 2);
  each(/https?:\/\/\S+/gi,'URL','odkaz se nahrazuje automaticky', 'ok', true);
  each(/\b\d{9,10}\b/g,'číselný identifikátor','devítimístná sekvence může být telefon nebo jiný identifikátor; ověř ručně', 'warn', false);
  each(/\b\d{6}\/\d{3,4}\b/g,'rodné číslo','rodné číslo / podobný číselný identifikátor', 'ok', true);
  each(/\b\d{3}\s\d{2}\b/g,'PSČ','poštovní směrovací číslo může identifikovat adresu', 'warn', false);
  each(/\b[1-9]\.?\s?[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]\b/g,'třída','možné označení třídy', 'warn', false);
  each(/\b(?:Gymnázium|ZŠ|SŠ|SOŠ|SOU|Střední škola|Základní škola|school|college)\b[^\n.,;:!?]{0,70}/gi,'škola','možný název školy nebo instituce', 'warn', false);
  each(/\b(?:ulice|street|road|avenue|náměstí|namesti|č\.p\.|číslo popisné)\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽA-Za-zÁ-ž0-9 .-]{2,70}/gi,'adresa','možná adresa', 'warn', false);
  each(/(?:my name is|I am|I’m|jmenuji se|jsem)\s+([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][A-Za-zÁ-ž-]+(?:\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][A-Za-zÁ-ž-]+){0,2})/g,'jméno','možné představení jménem', 'warn', false, 1);
  each(/\b[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(?:[- ][A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+){1,2}\b/g,'jméno / název','možné osobní jméno nebo vlastní název', 'warn', false);
  PRIVACY_LOCATION_WORDS.forEach(loc=>{ const re=new RegExp('\\b'+escapeRegExp(loc)+'\\b','i'); if(re.test(raw)) add('lokace',loc,'možná konkrétní lokace; zvaž anonymizaci, pokud identifikuje studenta', 'warn', false); });
  return privacyDedup(findings).slice(0,80);
}
function privacyFingerprint(){
  syncStateFromFields(false);
  const base={mode:state.inputMode,studentText:state.studentText,identity:state.studentIdentity,code:state.studentCode,extraPii:state.extraPii,files:attachedFiles.map(f=>[f.name,f.size,f.mime]),batch:batchStudents.map(s=>({code:s.code,text:s.text,identity:s.identity,extraPii:s.extraPii,files:(s.files||[]).map(f=>[f.name,f.size,f.mime])}))};
  return simpleHash(JSON.stringify(base));
}
function simpleHash(str){ let h=2166136261; for(let i=0;i<String(str).length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return String(h>>>0); }
function runPrivacyScan(){
  syncStateFromFields(false);
  const scan={hash:privacyFingerprint(),mode:state.inputMode,items:[],attachmentWarnings:[],allFindings:[]};
  if(state.inputMode==='batch'){
    batchStudents.forEach((s,i)=>{
      const hasText=String(s.text||'').trim(); const hasFiles=(s.files||[]).length>0; const scope=s.code||('STUDENT_'+String(i+1).padStart(3,'0'));
      const findings=scanSensitiveText(s.text||'',s.identity||'',s.extraPii||'',scope);
      scan.allFindings.push(...findings);
      if(hasFiles) scan.attachmentWarnings.push({scope,message:`${scope}: má ${(s.files||[]).length} příloh(y), které nelze lokálně plně zkontrolovat. Ověř, že na fotce/PDF není jméno, třída ani podpis.`});
    });
  } else {
    const findings=scanSensitiveText(state.studentText||'',state.studentIdentity||'',state.extraPii||'',state.studentCode||'STUDENT_001');
    scan.allFindings.push(...findings);
    if(attachedFiles.length) scan.attachmentWarnings.push({scope:state.studentCode||'STUDENT_001',message:`Přiloženo ${attachedFiles.length} souborů. Obrázky/PDF nelze před odesláním spolehlivě lokálně začernit; potvrď, že neobsahují viditelné osobní údaje.`});
  }
  scan.blocking=scan.allFindings.filter(x=>!x.auto);
  scan.auto=scan.allFindings.filter(x=>x.auto);
  privacyLastScan=scan;
  return scan;
}
function renderPrivacyMode(){
  const strict=state.privacyMode!=='off';
  $('privacyPanel')?.classList.toggle('strict',strict); $('privacyPanel')?.classList.toggle('warn',!strict);
  if($('privacyModeStatus')){ $('privacyModeStatus').textContent=strict?'přísný režim zapnutý':'privacy režim vypnutý'; $('privacyModeStatus').className='privacy-status '+(strict?'ok':'warn'); }
  if($('togglePrivacyBtn')) $('togglePrivacyBtn').textContent=strict?'Privacy režim: zapnuto':'Privacy režim: vypnuto';
  renderSensitiveStorageMode();
}
function renderSensitiveStorageMode(){
  const enabled=sensitiveSaveEnabled();
  const btn=$('toggleSensitiveSaveBtn');
  if(btn){ btn.textContent=enabled?'Obnova citlivé relace: zapnuto':'Obnova citlivé relace: vypnuto'; btn.classList.toggle('active', enabled); }
  const note=$('sensitiveSaveNote');
  if(note){ note.innerHTML=enabled ? 'Citlivá obnova je <strong>zapnutá</strong>: studentský text, identita, anonymizační údaje, potvrzení kontroly a výsledek se mohou uložit do localStorage tohoto prohlížeče. Používej jen na vlastním zařízení.' : 'Bezpečné výchozí nastavení: studentské texty, identita, anonymizační údaje, potvrzení kontroly a výsledky se do trvalého úložiště prohlížeče neukládají. Obnovu citlivé relace zapínej jen na vlastním zařízení.'; }
}
async function toggleSensitiveStateSaving(){
  if(sensitiveSaveEnabled()){
    safeLocalRemove(SENSITIVE_SAVE_PREF_SK);
    purgeSensitiveSavedState();
    saveState();
    renderSensitiveStorageMode();
    toast('Obnova citlivé relace vypnuta. Uložené citlivé údaje byly odstraněny.','warn');
    return;
  }
  const ok=await uiConfirm('Zapnout obnovu citlivé relace?\n\nStudentský text, identita, anonymizační údaje, potvrzení privacy kontroly a výsledek se budou ukládat do localStorage tohoto prohlížeče. Zapínej pouze na vlastním zařízení, ne na sdíleném nebo školním počítači.','Obnova citlivé relace');
  if(!ok) return;
  safeLocalSet(SENSITIVE_SAVE_PREF_SK,'1');
  saveState();
  renderSensitiveStorageMode();
  toast('Obnova citlivé relace zapnuta pro toto zařízení.','warn');
}
function clearSensitiveSavedData(){
  safeLocalRemove(SENSITIVE_SAVE_PREF_SK);
  purgeSensitiveSavedState();
  saveState();
  renderSensitiveStorageMode();
  toast('Uložené citlivé údaje byly vymazány a obnova citlivé relace je vypnutá.','warn');
}
function togglePrivacyMode(){ state.privacyMode=state.privacyMode==='off'?'strict':'off'; state.privacyApprovedHash=''; renderPrivacyMode(); saveState(); toast(state.privacyMode==='off'?'Privacy režim vypnutý. Kontrola nebude blokovat odeslání.':'Privacy režim zapnutý. Odeslání se zastaví při podezřelých údajích.','warn'); }
function renderPrivacyReport(scan=runPrivacyScan(),scroll=true){
  renderPrivacyMode(); const box=$('privacyList'); if(!box) return; const parts=[];
  if(!scan.blocking.length && !scan.attachmentWarnings.length){ parts.push('<div class="ok-box" style="margin:0">✓ Kontrola nenašla nevyřešené podezřelé údaje v textu.</div>'); }
  if(scan.auto.length){ parts.push(`<div class="small-muted">Automaticky řešené vzory: ${scan.auto.length}× e-mail/telefon/URL/rodné číslo apod. Tyto položky se při odeslání nahradí kódy.</div>`); }
  if(scan.attachmentWarnings.length){ parts.push('<div class="warn-box" style="margin:0"><strong>Přílohy vyžadují ruční potvrzení:</strong><br>'+scan.attachmentWarnings.map(w=>escapeHtml(w.message)).join('<br>')+'</div>'); }
  if(scan.blocking.length){ parts.push('<div class="warn-box" style="margin:0"><strong>Nalezené podezřelé údaje:</strong> nech zaškrtnuté položky, které se mají nahradit kódem. Falešné nálezy můžeš odškrtnout a potom kontrolu potvrdit.</div>'); parts.push(scan.blocking.map((it,i)=>`<label class="privacy-item"><input type="checkbox" data-privacy-finding="${i}" checked><span><b>${escapeHtml(it.type)}</b> · <code>${escapeHtml(it.value)}</code><br><span class="small-muted">${escapeHtml(it.scope||'student')} · ${escapeHtml(it.reason||'')} ${it.snippet?'<br>Kontext: '+escapeHtml(it.snippet):''}</span></span></label>`).join('')); }
  box.innerHTML=parts.join('') || '<div class="small-muted">Kontrola zatím neproběhla.</div>';
  if(scroll){ goTo(2); setTimeout(()=>{$('privacyPanel')?.scrollIntoView({behavior:'smooth',block:'center'});},80); }
}
function selectedPrivacyFindings(){ if(!privacyLastScan) return []; return Array.from(document.querySelectorAll('[data-privacy-finding]')).map(ch=>({idx:Number(ch.dataset.privacyFinding),checked:ch.checked})).filter(x=>x.checked).map(x=>privacyLastScan.blocking[x.idx]).filter(Boolean); }
function applySelectedPrivacyFindings(){
  const selected=selectedPrivacyFindings(); if(!selected.length){ toast('Není vybrán žádný nález k nahrazení.','warn'); return; }
  if(state.inputMode==='batch'){
    selected.forEach(it=>{ const s=batchStudents.find(x=>(x.code||'')===it.scope); if(s && s.text){ s.text=replaceAllLiteral(s.text,it.value,`[OSOBA_UDÁJ]`); } });
    renderBatchList();
  } else {
    let txt=$('studentText').value||''; selected.forEach((it,i)=>{ txt=replaceAllLiteral(txt,it.value,`[OSOBA_UDÁJ_${i+1}]`); }); $('studentText').value=txt; syncStateFromFields(false);
  }
  state.privacyApprovedHash=''; updateStats(); updatePromptPreview(); saveState(); renderPrivacyReport(runPrivacyScan(),false); toast('Vybrané nálezy byly nahrazeny v textu.');
}
function replaceAllLiteral(text,value,label){ if(!value) return text; return String(text||'').replace(new RegExp(escapeRegExp(value),'gi'),label); }
function approvePrivacyCheck(){ const scan=privacyLastScan || runPrivacyScan(); state.privacyApprovedHash=scan.hash; saveState(); renderPrivacyReport(scan,false); toast('Kontrola potvrzena. Teď můžeš bezpečněji pokračovat k odeslání.'); goTo(3); }
async function privacyGateBeforeSend(){
  if(state.privacyMode==='off') return true;
  const fp=privacyFingerprint(); if(state.privacyApprovedHash && state.privacyApprovedHash===fp) return true;
  const scan=runPrivacyScan();
  if(scan.blocking.length || scan.attachmentWarnings.length){ renderPrivacyReport(scan,true); toast('Privacy režim zastavil odeslání. Zkontroluj nálezy a potvrď kontrolu.','warn'); return false; }
  state.privacyApprovedHash=scan.hash; saveState(); renderPrivacyReport(scan,false); return true;
}

function fileExt(name){ return String(name||'').split('.').pop().toLowerCase(); }
function assertPdfInlineSize(file){if((Number(file?.size)||0)>PDF_INLINE_MAX_BYTES)throw new Error('PDF je příliš velké pro inline odeslání (maximum 15 MB). Rozděl ho na menší PDF nebo jednotlivé obrázky.');}
function formatSize(n){ if(n<1024) return n+' B'; if(n<1024*1024) return Math.round(n/1024)+' KB'; return (n/1024/1024).toFixed(1)+' MB'; }
async function handleFiles(e){ await handleFileList(e.target.files); e.target.value=''; }
async function handleFileList(list){ const files=Array.from(list||[]); if(!files.length) return; for(const f of files){ await processFile(f); } renderFiles(); updateStats(); updatePromptPreview(); saveState(); }
async function processFile(f){
  const ext=fileExt(f.name);
  try{
    if(['txt','md','markdown','csv','tsv'].includes(ext) || /^text\//.test(f.type)){
      const text=await f.text(); appendStudentText(text); toast('Textový soubor načten.'); return;
    }
    if(ext==='docx'){
      const text=await extractDocxText(f); appendStudentText(text); toast('DOCX převeden na text.'); return;
    }
    if(/^image\//.test(f.type) || ['jpg','jpeg','png','webp','gif','heic','heif'].includes(ext)){
      const img=await prepareImageAttachment(f);
      attachedFiles.push(img); state.privacyApprovedHash='';
      const msg = img.wasDownscaled ? `${f.name}: fotka zmenšena ${formatSize(img.originalSize)} → ${formatSize(img.size)}` : `${f.name}: fotka přidána bez zmenšení`;
      toast(msg, img.wasDownscaled?'ok':'warn');
      return;
    }
    if(ext==='pdf' || f.type==='application/pdf'){
      assertPdfInlineSize(f); const dataUrl=await readAsDataUrl(f); attachedFiles.push({name:f.name,size:f.size,originalSize:f.size,mime:'application/pdf',dataUrl,wasDownscaled:false}); state.privacyApprovedHash=''; toast('PDF přidáno pro Gemini: '+f.name,'warn'); return;
    }
    toast('Nepodporovaný typ souboru: '+f.name,'err');
  }catch(e){ toast((e&&e.message)||String(e),'err'); }
}
function appendStudentText(text){state.privacyApprovedHash='';const current=$('studentText').value.trim();const clean=String(text||'').trim();$('studentText').value=current+(current&&clean?'\n\n':'')+clean;syncStateFromFields();}
function decodeDocxXmlText(value){
  return String(value||'')
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
    .replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(parseInt(n,10)))
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
}
function docxParagraphText(xml){
  let out='';
  const token=/<(?:[A-Za-z_][\w.-]*:)?t\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?t\s*>|<(?:[A-Za-z_][\w.-]*:)?tab\b[^>]*\/?\s*>|<(?:[A-Za-z_][\w.-]*:)?(?:br|cr)\b[^>]*\/?\s*>/gi;
  let match;
  while((match=token.exec(String(xml||'')))){
    if(match[1]!==undefined)out+=decodeDocxXmlText(match[1]);
    else if(/(?:^|:)tab\b/i.test(match[0].replace(/^</,'')))out+='\t';
    else out+='\n';
  }
  return out.replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trimEnd();
}
function docxXmlToText(xml,fileName='DOCX'){
  const source=String(xml||'');
  if(!/<(?:[A-Za-z_][\w.-]*:)?document\b/i.test(source)||!/<(?:[A-Za-z_][\w.-]*:)?body\b/i.test(source))throw new Error(fileName+': dokument.xml nemá platnou strukturu WordprocessingML.');
  const paragraphs=[];
  const pattern=/<(?:[A-Za-z_][\w.-]*:)?p\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?p\s*>/gi;
  let match;
  while((match=pattern.exec(source))){const text=docxParagraphText(match[1]);if(text.trim())paragraphs.push(text);}
  const text=paragraphs.join('\n').replace(/\n{3,}/g,'\n\n').trim();
  if(!text)throw new Error(fileName+': DOCX se podařilo otevřít, ale neobsahuje čitelný text.');
  return text;
}
async function extractDocxText(f){
  const JSZip=await ensureJSZip();
  const zip=await JSZip.loadAsync(await f.arrayBuffer());
  const documentPart=zip.file('word/document.xml');
  if(!documentPart)throw new Error(f.name+': soubor nemá platnou strukturu DOCX.');
  return docxXmlToText(await documentPart.async('string'),f.name);
}
function readAsDataUrl(f){ return new Promise((resolve,reject)=>{const r=new FileReader(); r.onload=()=>resolve(String(r.result||'')); r.onerror=()=>reject(r.error||new Error('Soubor se nepodařilo přečíst.')); r.readAsDataURL(f);}); }
function dataUrlToBase64(u){ const i=String(u||'').indexOf(','); return i>=0?String(u).slice(i+1):String(u||''); }
function base64ByteSize(b64){ const s=String(b64||''); const pad=(s.endsWith('==')?2:(s.endsWith('=')?1:0)); return Math.max(0, Math.floor(s.length*3/4)-pad); }
function dataUrlByteSize(u){ return base64ByteSize(dataUrlToBase64(u)); }
function apiMimeForFile(f){ const ext=fileExt(f?.name); if(ext==='pdf') return 'application/pdf'; if(f?.type) return f.type; return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',heic:'image/heic',heif:'image/heif'}[ext]||'application/octet-stream'); }
function canDownscaleImage(f){ const ext=fileExt(f?.name); const t=String(f?.type||'').toLowerCase(); return ['image/jpeg','image/png','image/webp','image/gif'].includes(t) || ['jpg','jpeg','png','webp','gif'].includes(ext); }
async function prepareImageAttachment(f){
  const originalSize=f.size||0; const originalMime=apiMimeForFile(f);
  if(!canDownscaleImage(f)){
    const dataUrl=await readAsDataUrl(f);
    return {name:f.name,size:originalSize,originalSize,mime:originalMime,dataUrl,wasDownscaled:false,resizeNote:'původní formát'};
  }
  const originalDataUrl=await readAsDataUrl(f);
  try{
    const img=await new Promise((resolve,reject)=>{ const im=new Image(); im.onload=()=>resolve(im); im.onerror=()=>reject(new Error('Obrázek se nepodařilo dekódovat.')); im.src=originalDataUrl; });
    const w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
    if(!w || !h) throw new Error('Obrázek nemá čitelné rozměry.');
    const scale=Math.min(1, IMAGE_MAX_DIM/Math.max(w,h));
    const tw=Math.max(1,Math.round(w*scale)), th=Math.max(1,Math.round(h*scale));
    const canvas=document.createElement('canvas'); canvas.width=tw; canvas.height=th;
    const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Canvas není dostupný.');
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,tw,th); ctx.drawImage(img,0,0,tw,th);
    const out=canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY);
    const newSize=dataUrlByteSize(out); const originalDataSize=dataUrlByteSize(originalDataUrl) || originalSize;
    if(out && newSize > 0 && newSize < originalDataSize){
      return {name:f.name.replace(/\.[^.]+$/, '') + '_zmenseno.jpg', originalName:f.name, size:newSize, originalSize, mime:'image/jpeg', dataUrl:out, wasDownscaled:true, width:tw, height:th, originalWidth:w, originalHeight:h, resizeNote:`${w}×${h} → ${tw}×${th}`};
    }
    return {name:f.name,size:originalSize,originalSize,mime:originalMime,dataUrl:originalDataUrl,wasDownscaled:false,width:w,height:h,resizeNote:'původní soubor byl menší'};
  }catch(_){
    return {name:f.name,size:originalSize,originalSize,mime:originalMime,dataUrl:originalDataUrl,wasDownscaled:false,resizeNote:'zmenšení se nepodařilo'};
  }
}
function renderFiles(){
  const list=$('fileList'), strip=$('imgStrip'); if(!list||!strip) return;
  $('transcribeSingleBtn')?.classList.toggle('hidden',attachedFiles.length===0);
  list.innerHTML=attachedFiles.map((f,i)=>{
    const isImg=/^image\//.test(f.mime); const sizeLabel=(f.originalSize&&f.originalSize!==f.size)?`${formatSize(f.originalSize)} → ${formatSize(f.size||0)}`:formatSize(f.size||0);
    const status=isImg?(f.wasDownscaled?'zmenšeno JPEG':'obrázek pro Gemini'):'příloha pro Gemini'; const cls=isImg?(f.wasDownscaled?'ok':'warn'):'';
    return `<div class="file-tag"><span class="fn">${escapeHtml(f.originalName||f.name)}</span><span class="fs">${sizeLabel}</span><span class="file-status ${cls}" title="${escapeHtml(f.resizeNote||'')}">${status}</span><button type="button" data-rm-file="${i}">×</button></div>`;
  }).join('');
  strip.innerHTML=attachedFiles.filter(f=>/^image\//.test(f.mime)).map(f=>`<img src="${f.dataUrl}" alt="${escapeHtml(f.originalName||f.name)}">`).join('');
  document.querySelectorAll('[data-rm-file]').forEach(b=>b.onclick=(ev)=>{ev.stopPropagation(); attachedFiles.splice(Number(b.dataset.rmFile),1); state.privacyApprovedHash=''; renderFiles(); updateStats(); updatePromptPreview();});
}
