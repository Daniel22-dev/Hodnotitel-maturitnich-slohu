import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source=readFileSync(new URL('../src/js/26-central-groups.js',import.meta.url),'utf8');
const gid='grp_000000000001';
const m1='mem_000000000001';
const m2='mem_000000000002';
function member(memberId,name,schoolEmail){return{memberId,name,schoolEmail};}
function projection(revision,members,status='active'){
  return{contract:'ghrab-roster-projection-v1',consumerAppId:'essay-evaluator',
    group:{schema:'ghrab-teaching-group-v1',groupId:gid,revision,displayName:'3A4 - AJ',
      schoolYear:'2026/27',subject:'AJ',grade:'3',status,updatedAt:'2026-10-22T08:00:00Z'},
    members};
}
function harness(){
  const ctx={state:{roster:[],centralGroupLink:null,centralGroupHolds:{}},batchStudents:[],batchResults:[],
    console,URL,document:{documentElement:{dataset:{ghrabAccess:'granted'}}}};
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(source+
    '\n;globalThis.__qa={essayGroupValidateMeta,essayGroupValidateRoster,essayPlanProjection,essayHold,isCentralDeliveryHeld,essayGroupHolds};',
    ctx,{filename:'26-central-groups.js'});
  return{ctx,api:ctx.__qa};
}
test('canonical contract accepts stable IDs and optional school e-mail',()=>{
  const{api}=harness();
  const result=api.essayGroupValidateRoster(projection(5,[member(m1,'Anna Nova','anna@example.school'),member(m2,'Boris Novy',null)]),gid);
  assert.equal(result.members.length,2);
  assert.equal(result.group.revision,5);
});
test('unknown consumer, extra fields and HTML-like names fail closed',()=>{
  const{api}=harness();
  assert.throws(()=>api.essayGroupValidateRoster({...projection(1,[]),consumerAppId:'sortio'},gid),/CENTRAL_CONTRACT_INVALID/);
  assert.throws(()=>api.essayGroupValidateRoster(projection(1,[{...member(m1,'Anna Nova','a@example.school'),status:'active'}]),gid),/CENTRAL_MEMBER_INVALID/);
  assert.throws(()=>api.essayGroupValidateRoster(projection(1,[member(m1,'<img onerror=alert(1)>',null)]),gid),/CENTRAL_MEMBER_INVALID/);
});
test('duplicate member IDs, duplicate emails and wrong group are rejected',()=>{
  const{api}=harness();
  assert.throws(()=>api.essayGroupValidateRoster(projection(1,[member(m1,'Anna',null),member(m1,'Anna 2',null)]),gid),/CENTRAL_MEMBER_INVALID/);
  assert.throws(()=>api.essayGroupValidateRoster(projection(1,[member(m1,'Anna','a@example.school'),member(m2,'Boris','a@example.school')]),gid),/CENTRAL_EMAIL_INVALID/);
  assert.throws(()=>api.essayGroupValidateRoster(projection(1,[member(m1,'Anna',null)]),'grp_999999999999'),/CENTRAL_ROSTER_INVALID/);
});
test('archived source cannot be imported as active and list limit is 500',()=>{
  const{api}=harness();
  assert.throws(()=>api.essayGroupValidateRoster(projection(1,[],'archived'),gid),/CENTRAL_ROSTER_INVALID/);
  const many=Array.from({length:500},(_,i)=>member('mem_'+String(i+1).padStart(12,'0'),'Student '+(i+1),null));
  assert.equal(api.essayGroupValidateRoster(projection(1,many),gid).members.length,500);
  assert.throws(()=>api.essayGroupValidateRoster(projection(1,[...many,member('mem_999999999999','Beyond',null)]),gid),/CENTRAL_ROSTER_INVALID/);
});
test('legacy roster is archived; existing approved result is not mutated',()=>{
  const{api,ctx}=harness();
  ctx.state.roster=[{id:'local-legacy',name:'Anna Nova',email:'anna@example.school',status:'active',code:'STUDENT_001'}];
  ctx.batchStudents=[{code:'STUDENT_001',rosterId:'local-legacy',displayName:'Anna Nova',email:'anna@example.school',approved:true}];
  ctx.batchResults=[{code:'STUDENT_001',approved:true,score:23,grade:1,email:'anna@example.school'}];
  const before=JSON.stringify(ctx.batchResults);
  const plan=api.essayPlanProjection(projection(2,[member(m1,'Anna Nova','anna@example.school')]));
  assert.equal(plan.next.length,2);
  assert.equal(plan.next.find(x=>x.id==='local-legacy').status,'archived');
  assert.equal(plan.holds.length,1);
  assert.equal(JSON.stringify(ctx.batchResults),before);
  assert.equal(ctx.batchStudents[0].rosterId,'local-legacy');
});
test('recipient change produces hold, never silently replaces approved email',()=>{
  const{api,ctx}=harness();
  ctx.state.roster=[{id:m1,memberId:m1,name:'Anna Nova',email:'anna@example.school',origin:'central',status:'active'}];
  ctx.state.centralGroupLink={groupId:gid,revision:5};
  ctx.batchStudents=[{code:'STUDENT_001',rosterId:m1,displayName:'Anna Nova',email:'anna@example.school'}];
  ctx.batchResults=[{code:'STUDENT_001',approved:true,email:'anna@example.school',grade:2}];
  const before=JSON.stringify(ctx.batchResults);
  const plan=api.essayPlanProjection(projection(6,[member(m1,'Anna Nova','changed@example.school')]));
  assert.equal(plan.holds.length,1);
  assert.equal(plan.holds[0].code,'STUDENT_001');
  assert.equal(ctx.batchResults[0].approved,true);
  assert.equal(JSON.stringify(ctx.batchResults),before);
  api.essayHold('STUDENT_001','new contact');
  assert.equal(api.isCentralDeliveryHeld('STUDENT_001'),true);
});
test('stale or inconsistent revision fails closed',()=>{
  const{api,ctx}=harness();
  ctx.state.roster=[{id:m1,name:'Anna Nova',email:'anna@example.school',status:'active'}];
  ctx.state.centralGroupLink={groupId:gid,revision:5};
  assert.throws(()=>api.essayPlanProjection(projection(4,[member(m1,'Anna Nova','anna@example.school')])),/CENTRAL_REVISION_ROLLBACK/);
  assert.throws(()=>api.essayPlanProjection(projection(5,[member(m1,'Anna Nova','changed@example.school')])),/CENTRAL_REVISION_CONTENT_CONFLICT/);
  assert.throws(()=>api.essayPlanProjection({...projection(6,[]),group:{...projection(6,[]).group,groupId:'grp_999999999999'}}),/CENTRAL_GROUP_SWITCH/);
});
test('read-only official consumer boundary and sensitive lifecycle remain wired',()=>{
  assert.match(source,/getRosterProjection\(id,ESSAY_GROUPS_ID\)/);
  assert.match(source,/listGroupMetadata\(ESSAY_GROUPS_ID/);
  assert.doesNotMatch(source,/localStorage|getItem\(|setItem\(/);
  assert.doesNotMatch(source,/service\.importRoster\(|service\.createGroup\(|service\.deleteGroup\(/);
  assert.match(source,/groups\/verified-client\.js/);
  assert.match(source,/openVerifiedGroupsV2\('essay-evaluator'\)/);
  assert.doesNotMatch(source,/groups\/group-service\.js/);
  assert.doesNotMatch(source,/module\.createGroupsService/);
  assert.match(source,/CENTRAL_LEGACY_MIGRATION_REQUIRED/);

  const rubric=readFileSync(new URL('../src/js/00-release-rubric.js',import.meta.url),'utf8');
  const review=readFileSync(new URL('../src/js/75-distribution.js',import.meta.url),'utf8');
  assert.match(rubric,/'centralGroupLink','centralGroupHolds'/);
  assert.match(review,/distributionReadyResults\(\).*isCentralDeliveryHeld/);
  assert.match(review,/approveAllValidResults\(\).*isCentralDeliveryHeld/);
});

function verifiedClientHarness({access='granted',studioUrl='/AI-Studio-GHRAB/',loader}={}){
  const dynamic='const module=await import(moduleUrl.href);';
  assert.equal(source.split(dynamic).length-1,1);
  const instrumented=source.replace(dynamic,'const module=await globalThis.__loadV2(moduleUrl.href);');
  const context={
    state:{roster:[],centralGroupLink:null,centralGroupHolds:{}},
    batchStudents:[],batchResults:[],console,URL,
    document:{documentElement:{dataset:{ghrabAccess:access}}},
    location:{href:'https://school.example/Hodnotitel/',origin:'https://school.example'},
    __GHRAB_STUDIO_URL__:studioUrl,
    __loadV2:loader||(()=>{throw Error('Loader must not run')}),
  };
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(instrumented+
    '\n;globalThis.__v2={essayGroupService};',context,{filename:'26-central-groups-v2-test.js'});
  return context;
}
test('v2 verified essay-evaluator consumer preserves full roster projection and stable member IDs',async()=>{
  let calls=0,lists=0,projections=0;
  const ctx=verifiedClientHarness({loader:async url=>{
    calls++;
    assert.equal(url,'https://school.example/AI-Studio-GHRAB/groups/verified-client.js');
    return {async openVerifiedGroupsV2(appId) {
      assert.equal(appId,'essay-evaluator');
      return {schema:'ghrab-groups-verified-consumer-v2',consumerAppId:appId,
        legacyStorePresent:false,service:{
          schema:'ghrab-groups-service-v1',contractVersion:1,
          listGroupMetadata(consumer){lists++;assert.equal(consumer,'essay-evaluator');return [projection(7,[]).group];},
          getRosterProjection(id,consumer){
            projections++;assert.equal(id,gid);assert.equal(consumer,'essay-evaluator');
            return projection(7,[member(m1,'Synthetic Student','synthetic@example.invalid')]);
          },
        }};
    }};
  }});
  const client=await ctx.__v2.essayGroupService();
  const list=client.list();
  assert.equal(list.length,1);assert.equal(list[0].groupId,gid);
  assert.equal(Object.hasOwn(list[0],'members'),false);
  const roster=client.roster(gid);
  assert.equal(roster.members[0].memberId,m1);
  assert.equal(roster.members[0].schoolEmail,'synthetic@example.invalid');
  assert.equal(calls,1);assert.equal(lists,1);assert.equal(projections,1);
});
test('v2 essay group reader fails closed without signed verified consumer or foreign origin',async()=>{
  const missing=verifiedClientHarness({loader:async()=>({createGroupsService(){
    throw Error('legacy must never be loaded');}})});
  await assert.rejects(missing.__v2.essayGroupService(),/CENTRAL_V2_REQUIRED/);

  const foreign=verifiedClientHarness({studioUrl:'https://evil.example/AI-Studio-GHRAB/',loader:async()=>{
    throw Error('foreign loader should not be invoked');
  }});
  await assert.rejects(foreign.__v2.essayGroupService(),/CENTRAL_ORIGIN_DENIED/);

  const revoked=verifiedClientHarness({loader:async()=>{
    revoked.document.documentElement.dataset.ghrabAccess='denied';
    return {openVerifiedGroupsV2:async()=>({schema:'ghrab-groups-verified-consumer-v2',
      consumerAppId:'essay-evaluator',legacyStorePresent:false,
      service:{schema:'ghrab-groups-service-v1',contractVersion:1,
        listGroupMetadata(){return[]},getRosterProjection(){return null}}})};
  }});
  await assert.rejects(revoked.__v2.essayGroupService(),/CENTRAL_ACCESS_DENIED/);
});
test('v2 essay evaluator refuses unowned legacy group storage and invalid app binding',async()=>{
  const legacy=verifiedClientHarness({loader:async()=>({
    openVerifiedGroupsV2:async()=>({schema:'ghrab-groups-verified-consumer-v2',
      consumerAppId:'essay-evaluator',legacyStorePresent:true,
      service:{schema:'ghrab-groups-service-v1',contractVersion:1,
        listGroupMetadata(){return[]},getRosterProjection(){return null}}}),
  })});
  const client=await legacy.__v2.essayGroupService();
  assert.throws(()=>client.list(),/CENTRAL_LEGACY_MIGRATION_REQUIRED/);
  const wrong=verifiedClientHarness({loader:async()=>({
    openVerifiedGroupsV2:async()=>({schema:'ghrab-groups-verified-consumer-v2',
      consumerAppId:'sortio',legacyStorePresent:false,
      service:{schema:'ghrab-groups-service-v1',contractVersion:1,
        listGroupMetadata(){return[]},getRosterProjection(){return null}}}),
  })});
  await assert.rejects(wrong.__v2.essayGroupService(),/CENTRAL_V2_CONTRACT_INVALID/);
});

test('distributed JSZip notice uses complete MIT permission and disclaimer',()=>{
  const license=new URL('../dist/vendor/JSZIP-LICENSE.md',import.meta.url);
  assert.equal(existsSync(license),true);
  const content=readFileSync(license,'utf8');
  assert.match(content,/Copyright \(c\) 2009-2016/);
  assert.match(content,/Permission is hereby granted/);
  assert.match(content,/THE SOFTWARE IS PROVIDED/);
  assert.doesNotMatch(content,/GNU GENERAL PUBLIC LICENSE/);
});


// R17: confirmation is an asynchronous UI boundary. Simulate changes *during*
// teacher approval using synthetic student identities, never real school data.
function confirmationHarness(){
  const stats={saves:0,paired:0,contacts:0,notifications:[]};
  const controls={
    centralGroupSelect:{value:gid},
    centralGroupApply:{disabled:false},
    centralGroupDialog:{open:true,close(){this.open=false}},
    centralGroupHolds:{children:[],replaceChildren(...items){this.children=[...items]},append(...items){this.children.push(...items)}},
    centralGroupStatus:{textContent:''},
  };
  const buttons=[];
  const makeElement=tag=>{
    const element={tagName:tag.toUpperCase(),textContent:'',children:[],events:{},
      append(...nodes){this.children.push(...nodes)},
      replaceChildren(...nodes){this.children=[...nodes]},
      addEventListener(type,callback){this.events[type]=callback},
      setAttribute(){}};
    if(tag==='button')buttons.push(element);
    return element;
  };
  const ctx={
    state:{roster:[],centralGroupLink:null,centralGroupHolds:{}},batchStudents:[],batchResults:[],
    console,URL,
    document:{documentElement:{dataset:{ghrabAccess:'granted'}},createElement:makeElement},
    $:id=>controls[id]||null,
    toast:(msg,kind)=>stats.notifications.push([msg,kind]),
    uiConfirm:async()=>true,
    pairAllStudentsToRoster:()=>{stats.paired++},
    syncStudentContactToResult:()=>{stats.contacts++},
    renderRosterTable(){},renderBatchList(){},renderBatchReviewDashboard(){},
    updateWorkflowDashboard(){},saveState(){stats.saves++},saveBatchProgress(){},
  };
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(source+
    '\n;globalThis.__confirmationQa={setClient(client){essayGroupsClient=Promise.resolve(client)},setDraft(value){essayGroupsPreview={projection:value,plan:essayPlanProjection(value),snapshot:essayGroupSnapshot()}},apply:essayGroupApply,renderHolds:essayRenderHolds};',
    ctx,{filename:'26-central-groups-r17.js'});
  return {ctx,controls,buttons,stats,qa:ctx.__confirmationQa};
}
function approvedPreview({remote}={}){
  const h=confirmationHarness();
  let current=remote||projection(5,[member(m1,'Synthetic Student','synthetic@example.invalid')]);
  h.qa.setClient({roster:()=>current});
  h.qa.setDraft(current);
  return {...h,setRemote:value=>{current=value}};
}
test('R17 stable authorized group confirmation commits one verified roster',async()=>{
  const {ctx,qa,stats,controls}=approvedPreview();
  await qa.apply();
  assert.equal(ctx.state.roster.length,1);
  assert.equal(ctx.state.roster[0].id,m1);
  assert.equal(ctx.state.centralGroupLink.revision,5);
  assert.equal(stats.saves,1);
  assert.equal(controls.centralGroupDialog.open,false);
});
test('R17 central group change during confirmation cannot replace local roster',async()=>{
  const h=approvedPreview();
  h.ctx.uiConfirm=async()=>{
    h.setRemote(projection(6,[member(m1,'Synthetic Student','new@example.invalid')]));
    return true;
  };
  await h.qa.apply();
  assert.equal(h.ctx.state.roster.length,0);
  assert.equal(h.stats.saves,0);
  assert.equal(h.controls.centralGroupApply.disabled,true);
  assert.equal(h.ctx.state.centralGroupLink,null);
});
test('R17 changed local evidence during confirmation cannot be overwritten',async()=>{
  const h=approvedPreview();
  h.ctx.uiConfirm=async()=>{
    h.ctx.state.roster.push({id:'synthetic-local',name:'Untouched local',email:'local@example.invalid',status:'active'});
    return true;
  };
  await h.qa.apply();
  assert.equal(h.ctx.state.roster[0].id,'synthetic-local');
  assert.equal(h.stats.saves,0);
  assert.equal(h.ctx.state.centralGroupLink,null);
});
test('R17 revoked access or closed central dialog invalidates pending approval',async()=>{
  for(const change of ['revoked','closed','selection']){
    const h=approvedPreview();
    h.ctx.uiConfirm=async()=>{
      if(change==='revoked')h.ctx.document.documentElement.dataset.ghrabAccess='denied';
      if(change==='closed')h.controls.centralGroupDialog.open=false;
      if(change==='selection')h.controls.centralGroupSelect.value='grp_999999999999';
      return true;
    };
    await h.qa.apply();
    assert.equal(h.stats.saves,0,change);
    assert.equal(h.ctx.state.roster.length,0,change);
  }
});
function holdHarness(){
  const h=confirmationHarness();
  h.ctx.state.roster=[{id:m1,memberId:m1,name:'Synthetic Student',email:'synthetic@example.invalid',status:'active'}];
  h.ctx.state.centralGroupLink={groupId:gid,revision:5};
  h.ctx.batchStudents=[{code:'CASE001',rosterId:m1,displayName:'Former Contact',identity:'Former Contact',email:'old@example.invalid',pairingStatus:'paired'}];
  h.ctx.batchResults=[{code:'CASE001',email:'old@example.invalid',deliveryStatus:'pending',approved:true}];
  h.ctx.state.centralGroupHolds.CASE001={code:'CASE001',reason:'recipient changed'};
  h.qa.renderHolds();
  const button=h.buttons.find(x=>x.textContent==='Zkontrolovat příjemce');
  assert.ok(button?.events.click,'recipient review action should exist');
  return {...h,button};
}
test('R17 unchanged recipient approval updates contact but not the grade',async()=>{
  const h=holdHarness();
  const before=JSON.stringify(h.ctx.batchResults);
  await h.button.events.click();
  assert.equal(h.ctx.batchStudents[0].email,'synthetic@example.invalid');
  assert.equal(h.stats.contacts,1);
  assert.equal(h.ctx.state.centralGroupHolds.CASE001,undefined);
  assert.equal(JSON.stringify(h.ctx.batchResults),before,'existing results are never overwritten');
});
test('R17 contact change during confirmation leaves HOLD and original recipient intact',async()=>{
  const h=holdHarness();
  h.ctx.uiConfirm=async()=>{
    h.ctx.state.roster[0].email='changed@example.invalid';
    return true;
  };
  await h.button.events.click();
  assert.equal(h.ctx.batchStudents[0].email,'old@example.invalid');
  assert.equal(h.stats.contacts,0);
  assert.ok(h.ctx.state.centralGroupHolds.CASE001);
});
test('R17 revocation, HOLD replacement and batch-result changes deny stale recipient approval',async()=>{
  for(const mode of ['revoked','hold-replaced','result-changed','student-replaced']){
    const h=holdHarness();
    h.ctx.uiConfirm=async()=>{
      if(mode==='revoked')h.ctx.document.documentElement.dataset.ghrabAccess='denied';
      if(mode==='hold-replaced')h.ctx.state.centralGroupHolds.CASE001={code:'CASE001',reason:'another review'};
      if(mode==='result-changed')h.ctx.batchResults[0].deliveryStatus='sent';
      if(mode==='student-replaced')h.ctx.batchStudents=[{...h.ctx.batchStudents[0]}];
      return true;
    };
    await h.button.events.click();
    assert.equal(h.stats.contacts,0,mode);
    assert.equal(h.ctx.batchStudents[0].email,'old@example.invalid',mode);
    assert.ok(h.ctx.state.centralGroupHolds.CASE001,mode);
  }
});


// R18: Gmail operations are synthetic. No real network call, student or school
// account is used. Delivery attempts must never become silently repeatable.
const distributionSource=readFileSync(new URL('../src/js/75-distribution.js',import.meta.url),'utf8');
const rosterSource=readFileSync(new URL('../src/js/25-roster-import.js',import.meta.url),'utf8');
const contactStart=rosterSource.indexOf('function syncStudentContactToResult(student){');
const contactEnd=rosterSource.indexOf('\nfunction applyRosterPair(',contactStart);
assert.ok(contactStart>=0&&contactEnd>contactStart,'real roster-contact function boundary');
const realContactFunction=rosterSource.slice(contactStart,contactEnd);

function deliveryHarness({status='not-ready',action='send'}={}){
  const stats={fetches:0,formSubmits:0,saves:0,notifications:[],statusAtFetch:null,statusAtForm:null};
  const form={
    style:{},appendChild(){},remove(){},
    submit(){stats.formSubmits++;stats.statusAtForm=ctx.batchResults[0].deliveryStatus},
  };
  const controls={
    appsScriptUrl:{value:'https://script.google.com/macros/s/SYNTHETIC123/exec'},
    appsScriptSecret:{value:'synthetic-secret-only'},
    emailSubjectTemplate:{value:'Result {student}'},
    emailSenderName:{value:'Synthetic teacher'},
    emailIncludeScore:{checked:true},emailIncludeOriginal:{checked:false},
  };
  const ctx={
    state:{series:{id:'synthetic-series',name:'Synthetic lesson',className:'Synthetic class',teacherName:'Synthetic teacher'},
      distribution:{appsScriptUrl:controls.appsScriptUrl.value,sharedSecret:controls.appsScriptSecret.value,
        subjectTemplate:controls.emailSubjectTemplate.value,senderName:'Synthetic teacher',
        mode:action,includeScore:true,includeOriginal:false}},
    batchStudents:[{code:'CASE001',rosterId:m1,displayName:'Synthetic Student',identity:'Synthetic Student',email:'synthetic@example.invalid',approved:true}],
    batchResults:[{code:'CASE001',rosterId:m1,displayName:'Synthetic Student',identity:'Synthetic Student',email:'synthetic@example.invalid',
      approved:true,validation:{ok:true},deliveryStatus:status,finalEvaluation:{},score:21,grade:2}],
    console:{error(){},log(){}},URL,
    $:id=>controls[id]||null,
    document:{querySelector:()=>({value:action}),querySelectorAll:()=>[],
      createElement:tag=>tag==='form'?form:{style:{},value:'',name:'',type:'',},
      body:{appendChild(){}}},
    toast:(msg,kind)=>stats.notifications.push([msg,kind]),
    uiConfirm:async()=>true,
    ensureWorkflowState(){},saveState(){stats.saves++},saveBatchProgress(){stats.saves++},
    updateWorkflowDashboard(){},
    isCentralDeliveryHeld(){return false},
    seriesDisplayName(){return'Synthetic lesson'},
    evaluationMachineSummary(){return{score_total:21,grade:2}},
    generatedStudentFeedback(){return'Synthetic feedback only'},
    escapeHtml:s=>String(s||''),
    markdownToPlainText:s=>String(s||''),
    fetch:async(url,options)=>{
      stats.fetches++;
      stats.statusAtFetch=ctx.batchResults[0].deliveryStatus;
      assert.equal(url,controls.appsScriptUrl.value);
      assert.equal(JSON.parse(options.body).items[0].code,'CASE001');
      return{ok:true,status:200,json:async()=>({ok:true})};
    },
  };
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(realContactFunction+'\n'+distributionSource+
    '\n;globalThis.__deliveryQA={contact:syncStudentContactToResult,validate:validateDistribution,send:sendDistributionToAppsScript,viaForm:submitDistributionViaForm};',
    ctx,{filename:'distribution-r18-synthetic.js'});
  return{ctx,stats,controls,qa:ctx.__deliveryQA};
}

test('R18 editing a sent recipient preserves delivery evidence and revokes approval',()=>{
  const h=deliveryHarness({status:'sent'});
  h.ctx.batchStudents[0].email='corrected@example.invalid';
  h.qa.contact(h.ctx.batchStudents[0]);
  const r=h.ctx.batchResults[0];
  assert.equal(r.deliveryStatus,'sent');
  assert.equal(r.deliveryRecipientChangedSinceAttempt,true);
  assert.equal(r.approved,false);
  assert.equal(h.ctx.batchStudents[0].approved,false);
  assert.equal(r.grade,2);
  r.approved=true;assert.equal(h.qa.validate().ok,false,'reapproval alone must never bypass prior Gmail evidence');
});
test('R18 every prior Gmail attempt blocks repeat delivery of an approved result',()=>{
  for(const status of ['sent','draft-created','submitted-unconfirmed']){
    const h=deliveryHarness({status});
    const check=h.qa.validate();
    assert.equal(check.ok,false,status);
    assert.equal(check.items.length,0,status);
    assert.match(check.issues.join(' '),/Gmail/i,status);
  }
});
test('R18 direct delivery persists uncertain state before any network request',async()=>{
  const h=deliveryHarness();
  await h.qa.send('send');
  assert.equal(h.stats.fetches,1);
  assert.equal(h.stats.statusAtFetch,'submitted-unconfirmed');
  assert.equal(h.ctx.batchResults[0].deliveryStatus,'sent');
  assert.ok(h.stats.saves>=2);
  await h.qa.send('send');
  assert.equal(h.stats.fetches,1,'a second click cannot send again');
});
test('R18 network exception remains unconfirmed and cannot be retried blindly',async()=>{
  const h=deliveryHarness();
  h.ctx.fetch=async()=>{h.stats.fetches++;h.stats.statusAtFetch=h.ctx.batchResults[0].deliveryStatus;throw Error('synthetic network failure');};
  await h.qa.send('send');
  assert.equal(h.stats.fetches,1);
  assert.equal(h.stats.statusAtFetch,'submitted-unconfirmed');
  assert.equal(h.ctx.batchResults[0].deliveryStatus,'submitted-unconfirmed');
  await h.qa.send('send');
  assert.equal(h.stats.fetches,1);
  assert.equal(h.qa.validate().ok,false);
});
test('R18 mutated recipient during confirmation prevents any Gmail attempt',async()=>{
  const h=deliveryHarness();
  h.ctx.uiConfirm=async()=>{h.ctx.batchResults[0].email='changed@example.invalid';return true;};
  await h.qa.send('send');
  assert.equal(h.stats.fetches,0);
  assert.equal(h.ctx.batchResults[0].deliveryStatus,'not-ready');
});
test('R18 cancelled approval has no write or network side effect',async()=>{
  const h=deliveryHarness();
  h.ctx.uiConfirm=async()=>false;
  await h.qa.send('send');
  assert.equal(h.stats.fetches,0);
  assert.equal(h.ctx.batchResults[0].deliveryStatus,'not-ready');
});
test('R18 compatible form records uncertain delivery before calling submit',async()=>{
  const h=deliveryHarness({action:'send'});
  await h.qa.viaForm();
  assert.equal(h.stats.formSubmits,1);
  assert.equal(h.stats.statusAtForm,'submitted-unconfirmed');
  assert.equal(h.ctx.batchResults[0].deliveryStatus,'submitted-unconfirmed');
  assert.equal(h.stats.fetches,0);
});
