function normalizeMatchText(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\.[^.]+$/,'').replace(/[^a-z0-9]+/g,' ').trim();
}
function rosterIdFor(name,email,index){
  return 'R_'+btoa(unescape(encodeURIComponent(`${name}|${email}|${index}`))).replace(/[^a-z0-9]/gi,'').slice(0,14);
}
function titleCaseNamePart(value){
  return String(value||'').split(/([ -])/).map(part=>/^[ -]$/.test(part)?part:(part?part.charAt(0).toUpperCase()+part.slice(1).toLowerCase():part)).join('');
}
function inferNameFromEmail(email){
  const local=String(email||'').split('@')[0]||'';
  return local.split(/[._-]+/).filter(Boolean).map(titleCaseNamePart).join(' ');
}
function isRosterHeaderLine(line){
  const low=String(line||'').toLowerCase();
  const hasHeader=/\b(jméno|prijmeni|příjmení|name|surname|student|žák|zak|e-?mail|třída|trida|skupina|class)\b/.test(low);
  const hasRealEmail=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line);
  return hasHeader&&!hasRealEmail;
}
function cleanRosterName(line,email){
  const withoutEmail=String(line||'').replace(email,' ');
  const cells=withoutEmail.split(/[\t;|,]+/).map(x=>x.trim()).filter(Boolean);
  const useful=cells.filter(cell=>{
    if(/^\d+$/.test(cell))return false;
    if(/^\d+\.?[A-Za-z]?$/.test(cell))return false;
    if(/^(student|žák|zak|aktivní|active)$/i.test(cell))return false;
    if(/^\d+\.[A-Za-z0-9-]+$/.test(cell))return false;
    return true;
  });
  return useful.join(' ').replace(/\s+/g,' ').replace(/^[\s;,|]+|[\s;,|]+$/g,'').trim();
}
function parseRosterText(raw){
  const lines=String(raw||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const out=[];
  const seen=new Set();
  for(const line of lines){
    if(isRosterHeaderLine(line))continue;
    const email=((line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||'').trim();
    let name=cleanRosterName(line,email);
    if(!name&&email)name=inferNameFromEmail(email);
    if(!name&&!email)continue;
    const dedupe=email.toLowerCase()||normalizeMatchText(name);
    if(!dedupe||seen.has(dedupe))continue;
    seen.add(dedupe);
    out.push({id:rosterIdFor(name,email,out.length),name,email,code:`STUDENT_${String(out.length+1).padStart(3,'0')}`});
    if(out.length>=SERIES_MAX_WORKS)break;
  }
  return out;
}
function importRosterFromText(){
  ensureWorkflowState();
  const parsed=parseRosterText($('rosterInput')?.value||'');
  if(!parsed.length){toast('Vložený seznam se nepodařilo rozpoznat. Použij jeden student na řádek, ideálně jméno; e-mail.','err');return;}
  state.roster=parsed;
  renderRosterTable();
  pairAllStudentsToRoster();
  saveState();
  toast(`Načteno ${parsed.length} studentů${parsed.length===SERIES_MAX_WORKS?' (dosažen limit série)':''}.`);
}
async function clearRoster(){
  if(!(await uiConfirm('Vymazat seznam studentů a všechna párování?','Vymazat skupinu')))return;
  state.roster=[];
  batchStudents.forEach(s=>{s.rosterId='';s.email='';s.pairingStatus='unpaired';});
  renderRosterTable();
  renderBatchList();
  saveState();
}
function rosterCandidateScore(student,person){
  const source=normalizeMatchText([student.identity,student.sourceName,...(student.sourceFiles||[])].join(' '));
  const target=normalizeMatchText(person.name);
  if(!source||!target)return 0;
  if(source===target)return 100;
  const parts=target.split(' ').filter(x=>x.length>2);
  let score=parts.reduce((n,p)=>n+(source.includes(p)?20:0),0);
  if(parts.length&&score===parts.length*20)score+=20;
  const emailLocal=normalizeMatchText(String(person.email||'').split('@')[0]);
  if(emailLocal&&source.includes(emailLocal))score+=40;
  return score;
}
function bestRosterMatch(student){
  let best=null;
  for(const person of state.roster||[]){
    const score=rosterCandidateScore(student,person);
    if(!best||score>best.score)best={person,score};
  }
  return best&&best.score>=20?best:null;
}
function syncStudentContactToResult(student){
  if(!student)return;
  const result=batchResults.find(r=>r&&r.code===student.code);
  if(!result)return;
  result.displayName=student.displayName||student.identity||'';
  result.identity=student.identity||student.displayName||'';
  result.email=student.email||'';
  result.rosterId=student.rosterId||'';
  result.approved=false;
  result.deliveryStatus='not-ready';
  student.approved=false;
}
function applyRosterPair(student,person){
  if(!student)return;
  student.rosterId=person?.id||'';
  student.displayName=person?.name||student.displayName||student.identity||'';
  student.identity=person?.name||student.identity||'';
  student.email=person?.email||'';
  student.pairingStatus=person?'paired':(student.email?'paired':'unpaired');
  student.approved=false;
  syncStudentContactToResult(student);
}
function pairAllStudentsToRoster(){
  ensureWorkflowState();
  const used=new Set(batchStudents.map(s=>s.rosterId).filter(Boolean));
  for(const s of batchStudents){
    if(s.rosterId)continue;
    const match=bestRosterMatch(s);
    if(match&&!used.has(match.person.id)){
      applyRosterPair(s,match.person);
      used.add(match.person.id);
    }
  }
  renderBatchList();
  renderRosterTable();
  updateWorkflowDashboard();
  saveState();
}
function setStudentRosterPair(index,rosterId){
  const s=batchStudents[index];
  const p=(state.roster||[]).find(x=>x.id===rosterId)||null;
  applyRosterPair(s,p);
  renderBatchList();
  renderRosterTable();
  saveState();
}
function renderRosterTable(){
  const box=$('rosterTable');
  if(!box)return;
  const rows=state.roster||[];
  if(!rows.length){box.innerHTML='<div class="empty-workflow">Skupina zatím není načtena.</div>';return;}
  box.innerHTML=`<div class="roster-head"><span>Kód</span><span>Jméno</span><span>E-mail</span><span>Práce</span></div>`+rows.map(p=>{
    const paired=batchStudents.find(s=>s.rosterId===p.id);
    return `<div class="roster-row"><span>${escapeHtml(p.code)}</span><strong>${escapeHtml(p.name||'—')}</strong><span>${escapeHtml(p.email||'bez e-mailu')}</span><span class="status-chip ${paired?'ok':'warn'}">${paired?escapeHtml(paired.code):'čeká'}</span></div>`;
  }).join('');
}
function fileStem(name){return String(name||'').replace(/\.[^.]+$/,'');}
function explicitPageStem(name){
  return fileStem(name).replace(/(?:[_\s-](?:page|strana|scan|foto|img|p))[_\s-]*\d{1,3}$/i,'').trim();
}
function genericNumberedStem(name){
  const stem=fileStem(name);
  const m=stem.match(/^(.*?)[_\s-](\d{1,2})$/);
  return m?{root:m[1].trim(),number:Number(m[2])}:null;
}
function stripPageSuffix(name){
  const explicit=explicitPageStem(name);
  return explicit||fileStem(name);
}
function parentPath(path){const parts=String(path||'').split('/').filter(Boolean);return parts.length>1?parts.slice(0,-1).join('/'):'';}
function parentLabel(path){const p=parentPath(path);return p?p.split('/').pop():'';}
function meaningfulParent(path,allPaths){
  const parent=parentPath(path);
  if(!parent)return '';
  const parents=allPaths.map(parentPath).filter(Boolean);
  if(new Set(parents).size<=1)return '';
  return parentLabel(path);
}
function canUseGenericPageGroup(path,allPaths){
  const name=String(path||'').split('/').pop();
  if(!/\.(jpe?g|png|webp|gif)$/i.test(name))return null;
  const parsed=genericNumberedStem(name);
  if(!parsed||!parsed.root)return null;
  if(/^(img|image|foto|scan|page|strana|student)$/i.test(parsed.root))return null;
  const peers=allPaths.map(p=>String(p).split('/').pop()).filter(n=>{
    const x=genericNumberedStem(n);
    return x&&normalizeMatchText(x.root)===normalizeMatchText(parsed.root)&&/\.(jpe?g|png|webp|gif)$/i.test(n);
  }).map(n=>genericNumberedStem(n).number);
  if(peers.length<2||!peers.includes(1))return null;
  return parsed.root;
}
function importGroupDescriptor(path,allPaths){
  const name=String(path||'').split('/').pop();
  const parent=meaningfulParent(path,allPaths);
  if(parent)return {key:'folder:'+normalizeMatchText(parent),label:parent};
  const explicit=explicitPageStem(name);
  if(explicit!==fileStem(name))return {key:'page:'+normalizeMatchText(explicit),label:explicit};
  const generic=canUseGenericPageGroup(path,allPaths);
  if(generic)return {key:'page:'+normalizeMatchText(generic),label:generic};
  const label=fileStem(name);
  return {key:'file:'+normalizeMatchText(label)+':'+normalizeMatchText(name),label};
}
function importGroupKey(path,allPaths=[]){return importGroupDescriptor(path,allPaths.length?allPaths:[path]).key;}
async function handleZipImport(e){
  const f=e.target.files?.[0];
  e.target.value='';
  if(!f)return;
  try{await importWorksZip(f);}catch(err){toast(err.message||String(err),'err');}
}
async function importWorksZip(file){
  if(file.size>100*1024*1024)throw new Error('ZIP je větší než 100 MB.');
  const JSZip=await ensureJSZip();
  const zip=await JSZip.loadAsync(file);
  const entries=Object.values(zip.files).filter(x=>!x.dir&&!x.name.startsWith('__MACOSX/'));
  if(entries.length>100)throw new Error('ZIP obsahuje více než 100 souborů.');
  const supported=entries.filter(e=>/\.(txt|md|csv|tsv|docx|pdf|jpe?g|png|webp|gif)$/i.test(e.name));
  if(!supported.length)throw new Error('ZIP neobsahuje podporované soubory.');
  const allPaths=supported.map(e=>e.name);
  const groups=new Map();
  for(const entry of supported){
    const descriptor=importGroupDescriptor(entry.name,allPaths);
    if(!groups.has(descriptor.key))groups.set(descriptor.key,{label:descriptor.label,items:[]});
    groups.get(descriptor.key).items.push(entry);
  }
  if(batchStudents.length+groups.size>SERIES_MAX_WORKS)throw new Error(`Po importu by série překročila limit ${SERIES_MAX_WORKS} prací.`);
  for(const group of groups.values()){
    const items=group.items.sort((a,b)=>a.name.localeCompare(b.name,'cs',{numeric:true}));
    const student={
      code:nextBatchCode(),identity:group.label,displayName:'',email:'',rosterId:'',extraPii:'',text:'',files:[],
      sourceFiles:items.map(x=>x.name),sourceName:items.map(x=>x.name).join(', '),status:'čeká',transcriptConfirmed:false,
      transcriptStatus:'needs-review',pairingStatus:'unpaired'
    };
    for(const entry of items){
      const blob=await entry.async('blob');
      const name=entry.name.split('/').pop();
      const f=new File([blob],name,{type:mimeFromExtension(name)});
      const ext=fileExt(name);
      if(['txt','md','csv','tsv'].includes(ext))student.text+=(student.text?'\n\n':'')+await f.text();
      else if(ext==='docx')student.text+=(student.text?'\n\n':'')+await extractDocxText(f);
      else if(/^image\//.test(f.type))student.files.push(await prepareImageAttachment(f));
      else if(ext==='pdf')student.files.push({name:`PŘÍLOHA_${student.files.length+1}.pdf`,originalName:name,size:f.size,originalSize:f.size,mime:'application/pdf',dataUrl:await readAsDataUrl(f),wasDownscaled:false});
    }
    student.transcriptConfirmed=!student.files.length&&Boolean(student.text.trim());
    student.transcriptStatus=student.transcriptConfirmed?'ready':'needs-review';
    batchStudents.push(ensureBatchStudentShape(student,batchStudents.length));
  }
  pairAllStudentsToRoster();
  state.inputMode='batch';
  renderInputMode();
  renderBatchList();
  updateWorkflowDashboard();
  saveBatchProgress();
  toast(`ZIP načten: ${groups.size} studentských prací.`);
}
function mimeFromExtension(name){
  const ext=fileExt(name);
  return {txt:'text/plain',md:'text/markdown',csv:'text/csv',tsv:'text/tab-separated-values',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif'}[ext]||'application/octet-stream';
}
function exportPairingCsv(){
  ensureWorkflowState();
  const rows=[['kod','jmeno','email','soubory','stav']];
  for(const s of batchStudents)rows.push([s.code,s.displayName||s.identity||'',s.email||'',(s.sourceFiles||[s.sourceName]).filter(Boolean).join(' | '),s.pairingStatus||'unpaired']);
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\n');
  downloadBlob(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),`${safeFileName(seriesDisplayName())}_parovani.csv`);
}
