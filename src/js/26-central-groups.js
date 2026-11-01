/* AI Studio Moje skupiny / Hodnotitel 1.5.x. Consumer-only, same-origin. */
const ESSAY_GROUPS_ID='essay-evaluator';
let essayGroupsClient=null,essayGroupsPreview=null,essayGroupsGeneration=0;
function essayGroupError(code){const e=new Error(code);e.code=code;return e;}
function essayGroupNorm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs-CZ').replace(/[^a-z0-9]+/g,' ').trim();}
function essayGroupEmail(v){return String(v||'').trim().toLowerCase();}
function essayGroupElt(tag,value='',css=''){const e=document.createElement(tag);if(value)e.textContent=value;if(css)e.className=css;return e;}
function essayGroupButton(label,callback){const b=essayGroupElt('button',label,'btn-mini');b.type='button';b.addEventListener('click',callback);return b;}
function essayGroupHolds(){if(!state.centralGroupHolds||typeof state.centralGroupHolds!=='object'||Array.isArray(state.centralGroupHolds))state.centralGroupHolds={};return state.centralGroupHolds;}
function isCentralDeliveryHeld(code){return !!essayGroupHolds()[code];}
function essayHold(code,reason){if(code)essayGroupHolds()[code]={code,reason};}
function essayHoldPaired(reason){for(const s of batchStudents)if(s.rosterId)essayHold(s.code,reason);}
function essayClearHold(code){delete essayGroupHolds()[code];essayRenderHolds();}
function essayGroupValidateMeta(group){
  if(!group||group.schema!=='ghrab-teaching-group-v1'||!/^grp_[a-zA-Z0-9-]{12,}$/.test(group.groupId)||
    !Number.isSafeInteger(group.revision)||group.revision<1||!['active','archived'].includes(group.status)||
    typeof group.displayName!=='string'||!group.displayName.trim()||group.displayName.length>120||
    /[<>\u0000-\u001f]/.test(group.displayName)||!/^\d{4}\/\d{2,4}$/.test(group.schoolYear||'')||
    Object.keys(group).some(k=>!['schema','groupId','revision','displayName','schoolYear','subject','grade','status','updatedAt'].includes(k)))
    throw essayGroupError('CENTRAL_METADATA_INVALID');
  return group;
}
function essayGroupValidateRoster(value,id){
  if(!value||value.contract!=='ghrab-roster-projection-v1'||value.consumerAppId!==ESSAY_GROUPS_ID||
     Object.keys(value).some(k=>!['contract','consumerAppId','group','members'].includes(k)))
     throw essayGroupError('CENTRAL_CONTRACT_INVALID');
  const group=essayGroupValidateMeta(value.group);
  if(group.groupId!==id||group.status!=='active'||!Array.isArray(value.members)||value.members.length>500||
     JSON.stringify(value).length>300000)throw essayGroupError('CENTRAL_ROSTER_INVALID');
  const ids=new Set(),emails=new Set();
  for(const m of value.members){
    if(!m||!/^mem_[a-zA-Z0-9-]{12,}$/.test(m.memberId)||ids.has(m.memberId)||
       typeof m.name!=='string'||!m.name.trim()||m.name.length>120||/[<>\u0000-\u001f]/.test(m.name)||
       Object.keys(m).some(k=>!['memberId','name','schoolEmail'].includes(k)))throw essayGroupError('CENTRAL_MEMBER_INVALID');
    const email=essayGroupEmail(m.schoolEmail);
    if(email&&(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>254||emails.has(email)))
       throw essayGroupError('CENTRAL_EMAIL_INVALID');
    ids.add(m.memberId);if(email)emails.add(email);
  }
  return value;
}
async function essayGroupService(){
  if(document.documentElement.dataset.ghrabAccess!=='granted')throw essayGroupError('CENTRAL_ACCESS_DENIED');
  if(essayGroupsClient)return essayGroupsClient;
  essayGroupsClient=(async()=>{
    const config=globalThis.__GHRAB_DEPLOYMENT_CONFIG__?.studioBaseUrl||globalThis.__GHRAB_STUDIO_URL__||'/AI-Studio-GHRAB/';
    const base=new URL(config,location.href);
    if(base.origin!==location.origin||!['http:','https:'].includes(base.protocol)||
       base.username||base.password||base.search||base.hash)throw essayGroupError('CENTRAL_ORIGIN_DENIED');
    if(!base.pathname.endsWith('/'))base.pathname+='/';
    const moduleUrl=new URL('groups/verified-client.js',base);
    if(moduleUrl.origin!==location.origin||!moduleUrl.pathname.startsWith(base.pathname))
      throw essayGroupError('CENTRAL_SERVICE_PATH_DENIED');
    const module=await import(moduleUrl.href);
    if(typeof module.openVerifiedGroupsV2!=='function')throw essayGroupError('CENTRAL_V2_REQUIRED');
    const verified=await module.openVerifiedGroupsV2('essay-evaluator');
    if(document.documentElement.dataset.ghrabAccess!=='granted')throw essayGroupError('CENTRAL_ACCESS_DENIED');
    if(verified?.schema!=='ghrab-groups-verified-consumer-v2'||
       verified.consumerAppId!==ESSAY_GROUPS_ID||
       typeof verified.legacyStorePresent!=='boolean')throw essayGroupError('CENTRAL_V2_CONTRACT_INVALID');
    const service=verified.service;
    if(service?.schema!=='ghrab-groups-service-v1'||service.contractVersion!==1||
       typeof service.listGroupMetadata!=='function'||typeof service.getRosterProjection!=='function')
       throw essayGroupError('CENTRAL_SERVICE_CONTRACT_OLD');
    return {
      list:()=>{
        const list=service.listGroupMetadata(ESSAY_GROUPS_ID,{status:'active'});
        if(!Array.isArray(list)||list.length>200)throw essayGroupError('CENTRAL_LIST_INVALID');
        if(!list.length&&verified.legacyStorePresent)throw essayGroupError('CENTRAL_LEGACY_MIGRATION_REQUIRED');
        const seen=new Set();
        return list.map(g=>{essayGroupValidateMeta(g);if(seen.has(g.groupId))throw essayGroupError('CENTRAL_DUPLICATE_GROUP');seen.add(g.groupId);return g;});
      },
      roster:id=>essayGroupValidateRoster(service.getRosterProjection(id,ESSAY_GROUPS_ID),id)
    };
  })().catch(error=>{essayGroupsClient=null;throw error;});
  return essayGroupsClient;
}
function essayGroupSnapshot(){
  return JSON.stringify({roster:state.roster||[],link:state.centralGroupLink||null,
    students:batchStudents.map(s=>[s.code,s.rosterId,s.displayName,s.email]),
    results:batchResults.map(r=>[r.code,r.approved,r.email,r.deliveryStatus])});
}
function essayPlanProjection(projection){
  const group=projection.group,link=state.centralGroupLink;
  if(link&&link.groupId!==group.groupId)throw essayGroupError('CENTRAL_GROUP_SWITCH');
  if(link&&group.revision<link.revision)throw essayGroupError('CENTRAL_REVISION_ROLLBACK');
  const current=state.roster||[],oldById=new Map(current.map(x=>[x.id,x]));
  if(oldById.size!==current.length)throw essayGroupError('LOCAL_DUPLICATE_MEMBER');
  const next=[],active=new Set(),changes=[];
  for(const member of projection.members){
    const previous=oldById.get(member.memberId);
    const email=essayGroupEmail(member.schoolEmail);
    next.push({id:member.memberId,memberId:member.memberId,name:member.name,email,
      status:'active',origin:'central',code:previous?.code||''});
    active.add(member.memberId);
    if(!previous||previous.name!==member.name||essayGroupEmail(previous.email)!==email||previous.status==='archived')
      changes.push({name:member.name,action:previous?'Upravit':'Přidat'});
  }
  for(const previous of current){
    if(active.has(previous.id))continue;
    if(previous.status!=='archived')changes.push({name:previous.name,action:'Archivovat'});
    next.push({...previous,status:'archived'});
  }
  if(link&&link.revision===group.revision&&changes.length)throw essayGroupError('CENTRAL_REVISION_CONTENT_CONFLICT');
  const byId=new Map(next.map(m=>[m.id,m])),holds=[];
  for(const s of batchStudents){
    if(!s.rosterId)continue;
    const person=byId.get(s.rosterId);
    if(!person||person.status==='archived'||essayGroupEmail(s.email)!==essayGroupEmail(person.email)||
       String(s.displayName||s.identity||'').trim()!==person.name)
       holds.push({code:s.code,reason:!person||person.status==='archived'?'archivovaný/neznámý člen':'změna identity nebo e-mailu'});
  }
  return {group,next,changes,holds,activeCount:projection.members.length};
}
function essayGroupStatus(){
  const status=$('centralGroupStatus');if(!status)return;
  const link=state.centralGroupLink;
  status.textContent=link?.groupId?'Napojeno: '+link.displayName+' · revize '+link.revision+
    ' · '+(state.roster||[]).filter(m=>m.origin==='central'&&m.status!=='archived').length+' členů.':
    'Centrální skupina není napojena. Ruční import z IS zůstává dostupný.';
}
function essayRenderHolds(){
  const host=$('centralGroupHolds');if(!host)return;host.replaceChildren();
  for(const hold of Object.values(essayGroupHolds())){
    const line=essayGroupElt('div','','central-group-hold');
    const s=batchStudents.find(x=>x.code===hold.code);
    const person=(state.roster||[]).find(x=>x.id===s?.rosterId&&x.status!=='archived');
    line.append(essayGroupElt('span',hold.code+' · '+hold.reason));
    const button=essayGroupButton('Zkontrolovat příjemce',async()=>{
      if(!s||!person){toast('Nejprve spáruj práci s aktivním studentem.','warn');return;}
      const result=batchResults.find(r=>r.code===s.code);
      const sent=['sent','draft-created','submitted-unconfirmed'].includes(result?.deliveryStatus);
      const msg='Potvrdit nového příjemce '+person.name+' ('+(person.email||'bez e-mailu')+') pro '+s.code+
        '? Hodnocení ani body se nezmění. Výsledek bude nutné znovu schválit.'+
        (sent?' Před případným opakováním distribuce nejprve zkontroluj Gmail.':'');
      if(!(await uiConfirm(msg,'Kontrola příjemce')))return;
      s.displayName=person.name;s.identity=person.name;s.email=person.email;s.pairingStatus='paired';
      syncStudentContactToResult(s);
      delete essayGroupHolds()[s.code];
      renderRosterTable();renderBatchList();renderBatchReviewDashboard();essayRenderHolds();
      updateWorkflowDashboard();saveState(false);saveBatchProgress();
    });
    button.disabled=!person;line.append(button);host.append(line);
  }
}
function essayGroupDialog(){
  let dialog=$('centralGroupDialog');
  if(dialog)return dialog;
  dialog=essayGroupElt('dialog');dialog.id='centralGroupDialog';dialog.setAttribute('aria-label','Výběr Moje skupiny');
  dialog.append(essayGroupElt('h3','Moje skupiny – synchronizace'));
  const label=essayGroupElt('label','Skupina');const select=essayGroupElt('select');select.id='centralGroupSelect';
  select.setAttribute('aria-label','Výběr skupiny');label.append(select);dialog.append(label);
  const summary=essayGroupElt('div');summary.id='centralGroupPreview';summary.setAttribute('aria-live','polite');dialog.append(summary);
  const actions=essayGroupElt('div','','split-actions');
  const refresh=essayGroupButton('Obnovit náhled',()=>void essayGroupPreviewSelected());
  const apply=essayGroupButton('Potvrdit synchronizaci',()=>void essayGroupApply());apply.id='centralGroupApply';apply.disabled=true;
  actions.append(refresh,apply,essayGroupButton('Zavřít',()=>dialog.close()));
  dialog.append(actions);document.body.append(dialog);
  select.addEventListener('change',()=>void essayGroupPreviewSelected());
  return dialog;
}
async function essayGroupOpen(){
  const dialog=essayGroupDialog(),select=$('centralGroupSelect');
  essayGroupsPreview=null;$('centralGroupApply').disabled=true;dialog.showModal();
  $('centralGroupPreview').replaceChildren(essayGroupElt('p','Načítám názvy skupin bez studentských údajů…'));
  try{
    const client=await essayGroupService(),groups=client.list();
    select.replaceChildren();
    for(const g of groups){const option=essayGroupElt('option',g.displayName+' · revize '+g.revision);option.value=g.groupId;select.append(option);}
    if(state.centralGroupLink&&groups.some(g=>g.groupId===state.centralGroupLink.groupId))select.value=state.centralGroupLink.groupId;
    if(!groups.length){$('centralGroupPreview').replaceChildren(essayGroupElt('p','Žádné dostupné skupiny. Použij ruční import z IS.'));return;}
    await essayGroupPreviewSelected();
  }catch(error){$('centralGroupPreview').replaceChildren(essayGroupElt('p',
    error?.code==='CENTRAL_LEGACY_MIGRATION_REQUIRED'
      ? 'Původní společné skupiny nejsou ověřeně přiřazeny k vašemu účtu. Požádejte o kontrolovaný převod; seznamy se nepřenášejí automaticky.'
      : 'Centrální skupiny nejsou bezpečně dostupné. Ruční import funguje dál.'));}
}
async function essayGroupPreviewSelected(){
  const ticket=++essayGroupsGeneration,id=$('centralGroupSelect')?.value;
  essayGroupsPreview=null;$('centralGroupApply').disabled=true;
  if(!id)return;
  try{
    const client=await essayGroupService(),projection=client.roster(id);
    if(ticket!==essayGroupsGeneration||$('centralGroupSelect').value!==id)return;
    const plan=essayPlanProjection(projection);
    const summary=$('centralGroupPreview');summary.replaceChildren();
    summary.append(essayGroupElt('p',plan.group.displayName+' · revize '+plan.group.revision+
      ' · aktivních členů '+plan.activeCount+' · změn '+plan.changes.length+' · kontrol příjemců '+plan.holds.length));
    if((state.roster||[]).some(x=>!/^mem_[A-Za-z0-9-]{12,}$/.test(x.id)))
      summary.append(essayGroupElt('p','Staré lokální vazby zůstanou archivované. Po importu je u existujících prací ručně přepáruj na členy s kanonickou identitou.'));
    const ul=essayGroupElt('ul');for(const x of plan.changes.slice(0,20))ul.append(essayGroupElt('li',x.action+': '+x.name));
    if(plan.changes.length>20)ul.append(essayGroupElt('li','Dalších změn: '+(plan.changes.length-20)));
    summary.append(ul);
    if(plan.holds.length)summary.append(essayGroupElt('p','U dotčených prací se distribuce pozastaví, hodnocení zůstane nedotčené.'));
    essayGroupsPreview={projection,plan,snapshot:essayGroupSnapshot()};
    $('centralGroupApply').disabled=false;
  }catch(error){$('centralGroupPreview').replaceChildren(essayGroupElt('p','Nelze bezpečně vytvořit náhled. Ověř skupinu a případné změny.'));}
}
async function essayGroupApply(){
  const draft=essayGroupsPreview;
  if(!draft?.plan||draft.snapshot!==essayGroupSnapshot()||$('centralGroupSelect').value!==draft.plan.group.groupId){
    $('centralGroupApply').disabled=true;toast('Lokální data se změnila. Znovu vytvoř náhled.','warn');return;
  }
  try{
    const client=await essayGroupService(),fresh=client.roster(draft.plan.group.groupId);
    if(JSON.stringify(fresh)!==JSON.stringify(draft.projection)){await essayGroupPreviewSelected();toast('Skupina se změnila. Zkontroluj nový náhled.','warn');return;}
    const plan=essayPlanProjection(fresh);
    if(!(await uiConfirm('Potvrdit synchronizaci skupiny '+plan.group.displayName+'? Dřívější práce ani výsledky nebudou změněny.','Synchronizace skupiny')))return;
    state.roster=plan.next;
    state.centralGroupLink={groupId:plan.group.groupId,revision:plan.group.revision,displayName:plan.group.displayName,schoolYear:plan.group.schoolYear};
    for(const h of plan.holds)essayHold(h.code,h.reason);
    if(!batchResults.length&&!batchStudents.some(s=>s.approved))pairAllStudentsToRoster();
    essayGroupsPreview=null;$('centralGroupDialog').close();
    renderRosterTable();renderBatchList();renderBatchReviewDashboard();essayRenderHolds();essayGroupStatus();
    updateWorkflowDashboard();saveState(false);saveBatchProgress();
    toast('Moje skupiny synchronizovány. Zkontroluj párování a pozastavené příjemce.');
  }catch(error){toast('Synchronizace nebyla provedena. Obnov náhled a zkontroluj data.','err');}
}
function initCentralGroupsWorkflow(){
  const input=$('rosterInput');if(!input)return;
  const panel=essayGroupElt('section','','central-group-panel');
  panel.append(essayGroupElt('h3','Moje skupiny – AI Studio'));
  panel.append(essayGroupElt('p','Načti až 500 studentů. V jedné sérii se nadále hodnotí nejvýše 20 prací.'));
  panel.append(essayGroupButton('Načíst z Moje skupiny / Aktualizovat',()=>void essayGroupOpen()));
  const info=essayGroupElt('p');info.id='centralGroupStatus';info.setAttribute('aria-live','polite');panel.append(info);
  const holds=essayGroupElt('div');holds.id='centralGroupHolds';panel.append(holds);
  input.parentElement.insertBefore(panel,input);
  essayGroupStatus();essayRenderHolds();
}
