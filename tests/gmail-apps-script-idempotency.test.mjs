import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import vm from 'node:vm';
const code=readFileSync(new URL('../integrations/gmail-apps-script/Code.gs',import.meta.url),'utf8');
const SECRET='synthetic-test-only-secret';
function request({id='a',student='S001',action='send',body='Synthetic feedback'}={}){
  return {schema:'ghrab-essay-feedback-v1',secret:SECRET,requestId:'req_'+id.repeat(32),
    action,senderName:'Synthetic Teacher',series:{id:'series-001'},
    items:[{code:student,email:student.toLowerCase()+'@example.invalid',subject:'Synthetic',
      plainBody:body,approved:true}]};
}
function mock({failAt=0,busy=false}={}){
  const props=new Map([['SHARED_SECRET',SECRET]]);
  const seen={sent:[],drafts:[],released:0};
  const api={
    getProperty:k=>props.has(k)?props.get(k):null,
    setProperty:(k,v)=>{props.set(k,v)},
    setProperties:o=>{for(const [k,v] of Object.entries(o))props.set(k,v)}
  };
  const ctx={
    PropertiesService:{getScriptProperties:()=>api},
    LockService:{getScriptLock:()=>({tryLock(){return !busy},releaseLock(){seen.released++}})},
    Utilities:{computeHmacSha256Signature(v,k){return [...createHmac('sha256',k).update(v).digest()].map(b=>b>127?b-256:b)}},
    GmailApp:{
      sendEmail(...a){seen.sent.push(a);if(failAt===seen.sent.length)throw Error('synthetic failure')},
      createDraft(...a){seen.drafts.push(a);if(failAt===seen.drafts.length)throw Error('synthetic failure')}
    },
    ContentService:{MimeType:{JSON:'json'},createTextOutput(s){return{value:s,setMimeType(){return this}}}}
  };
  vm.createContext(ctx);vm.runInContext(code,ctx);
  return{post:p=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(p)}}).value),props,seen};
}
test('first send records one action and hashed ledger without student data',()=>{
  const h=mock();const r=h.post(request());
  assert.equal(r.ok,true);assert.equal(r.count,1);assert.equal(h.seen.sent.length,1);
  assert.equal(h.seen.released,1);
  assert.doesNotMatch([...h.props.values()].join('|'),/example.invalid|Synthetic feedback|synthetic-test-only-secret/);
});
test('same request ID cannot repeat send',()=>{
  const h=mock();assert.equal(h.post(request()).ok,true);
  assert.equal(h.post(request()).code,'DELIVERY_DUPLICATE_REQUEST');assert.equal(h.seen.sent.length,1);
});
test('fresh request ID cannot resend same series and student',()=>{
  const h=mock();h.post(request());
  assert.equal(h.post(request({id:'b'})).code,'DELIVERY_DUPLICATE_ITEM');assert.equal(h.seen.sent.length,1);
});
test('payload alteration under existing request ID is blocked',()=>{
  const h=mock();h.post(request());
  assert.equal(h.post(request({body:'Altered synthetic text'})).code,'DELIVERY_LEDGER_CONFLICT');
});
test('draft followed by send is blocked for same student series',()=>{
  const h=mock();assert.equal(h.post(request({action:'createDrafts'})).ok,true);
  assert.equal(h.post(request({id:'b',action:'send'})).code,'DELIVERY_DUPLICATE_ITEM');
  assert.equal(h.seen.drafts.length,1);assert.equal(h.seen.sent.length,0);
});
test('ambiguous failure holds reservation and denies retries',()=>{
  const h=mock({failAt:1});
  assert.equal(h.post(request()).code,'DELIVERY_UNCONFIRMED');
  assert.equal(h.post(request()).code,'DELIVERY_DUPLICATE_REQUEST');
  assert.equal(h.seen.sent.length,1);
});
test('unattempted entries after partial batch failure remain reserved',()=>{
  const h=mock({failAt:2});const p=request();
  p.items.push({code:'S002',email:'s002@example.invalid',subject:'Synthetic',plainBody:'Second',approved:true});
  p.items.push({code:'S003',email:'s003@example.invalid',subject:'Synthetic',plainBody:'Third',approved:true});
  assert.equal(h.post(p).code,'DELIVERY_UNCONFIRMED');
  assert.equal(h.post(request({id:'b',student:'S003'})).code,'DELIVERY_DUPLICATE_ITEM');
  assert.equal(h.seen.sent.length,2);
});
test('invalid identity and duplicate items never send',()=>{
  const h=mock();const invalid=request();delete invalid.requestId;
  assert.equal(h.post(invalid).code,'DELIVERY_INVALID_REQUEST');
  const secret=request();secret.secret='wrong';
  assert.equal(h.post(secret).code,'DELIVERY_UNAUTHORIZED');
  const duplicate=request();duplicate.items.push({...duplicate.items[0]});
  assert.equal(h.post(duplicate).code,'DELIVERY_DUPLICATE_ITEM');
  assert.equal(h.seen.sent.length,0);
});
test('lock contention causes no action or ledger write',()=>{
  const h=mock({busy:true});
  assert.equal(h.post(request()).code,'DELIVERY_LOCK_BUSY');
  assert.equal(h.seen.sent.length,0);assert.equal(h.props.size,1);
});
