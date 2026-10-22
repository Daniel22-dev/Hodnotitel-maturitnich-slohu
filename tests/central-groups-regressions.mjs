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
  const rubric=readFileSync(new URL('../src/js/00-release-rubric.js',import.meta.url),'utf8');
  const review=readFileSync(new URL('../src/js/75-distribution.js',import.meta.url),'utf8');
  assert.match(rubric,/'centralGroupLink','centralGroupHolds'/);
  assert.match(review,/distributionReadyResults\(\).*isCentralDeliveryHeld/);
  assert.match(review,/approveAllValidResults\(\).*isCentralDeliveryHeld/);
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
