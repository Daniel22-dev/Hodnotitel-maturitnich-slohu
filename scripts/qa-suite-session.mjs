#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const root = path.resolve('.');
const dist = path.join(root, 'dist');
const consumer = JSON.parse(await fsp.readFile(path.join(root, 'ghrab-platform.consumer.json'), 'utf8'));
const vendorPlatformSource = await fsp.readFile(path.join(root, 'vendor', `ghrab-platform-${consumer.platform.version}`, 'ghrab-platform.js'), 'utf8');
// about:blank has no hierarchical base URL. This is the same browser-harness-only
// bootstrap shim used by qa-p3-browser; the session implementation itself is unmodified.
const platformSource = vendorPlatformSource.replace("new URL('./ghrab/ghrab-platform.js', location.href)", "new URL('https://example.test/app/ghrab/ghrab-platform.js')");
const cleanupPath = path.join(root, 'src', 'access', 'suite-session-cleanup.js');
const cleanupSource = await fsp.readFile(cleanupPath, 'utf8');
const { CLEAR_ON_END_WORK } = await import(pathToFileURL(cleanupPath).href + `?qa=${Date.now()}`);
const cleanupClassic = cleanupSource
  .replace('export const CLEAR_ON_END_WORK', 'const CLEAR_ON_END_WORK')
  .replace('export function createSuiteSessionLifecycle', 'function createSuiteSessionLifecycle')
  + '\nwindow.__CLEAR_ON_END_WORK__=CLEAR_ON_END_WORK; window.__createSuiteSessionLifecycle__=createSuiteSessionLifecycle;\n';

const reportPath = path.join(dist, 'qa-suite-session-report.json');
const checks = [];
const check = (id, ok, detail = '') => checks.push({ id, ok: Boolean(ok), detail: String(detail || '') });
const auditId = crypto.randomBytes(8).toString('hex').toUpperCase();
const studentCanary = `GARP-STUDENT-CANARY-${auditId}`;
const canaryEmail = `garp.student.canary.${auditId.toLowerCase()}@example.invalid`;
const canary = JSON.stringify({ marker: studentCanary, email: canaryEmail });
const generationKey = 'ghrab.platform.suite-session-generation.v1';
const seenKey = 'ghrab.essay-evaluator.suite-session-seen.v1';
const observedKey = 'ghrab.essay-evaluator.suite-session-observed.v1';
const completeKey = 'ghrab.essay-evaluator.suite-session-cleanup-complete.v1';
const executablePath = [process.env.CHROMIUM_PATH, '/usr/lib/chromium/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
if (!executablePath) throw new Error('Chromium není dostupné pro suite-session QA.');

const config = {
  appId: consumer.appId,
  appName: consumer.appName,
  appVersion: consumer.appVersion,
  requiredPlatformRange: consumer.platform.requiredRange,
  platformContract: consumer.platform.contract,
  autoFooter: false,
  theme: consumer.theme,
  storageMigration: consumer.storageMigration,
  bridgeMaxBytes: consumer.bridge.maxBytes,
  artifactContract: consumer.artifact.schema,
  quality: consumer.quality,
};

function escScript(source) { return source.replace(/<\/script/gi, '<\\/script'); }
const harnessHtml = `<!doctype html><html lang="cs" data-ghrab-app-id="essay-evaluator" data-ghrab-app-version="${consumer.appVersion}"><head><meta charset="utf-8"><title>Suite QA</title>
<script>(()=>{
class M { constructor(){this.m=new Map()} get length(){return this.m.size} key(i){return [...this.m.keys()][i]??null} getItem(k){k=String(k);return this.m.has(k)?this.m.get(k):null} setItem(k,v){this.m.set(String(k),String(v))} removeItem(k){this.m.delete(String(k))} clear(){this.m.clear()} }
Object.defineProperty(window,'Storage',{value:M,configurable:true});
Object.defineProperty(window,'localStorage',{value:new M(),configurable:true});
Object.defineProperty(window,'sessionStorage',{value:new M(),configurable:true});
window.GHRAB_PLATFORM_CONFIG=${JSON.stringify(config).replaceAll('<','\\u003c')};
window.matchMedia=window.matchMedia||(()=>({matches:false,addEventListener(){},removeEventListener(){}}));
window.__qaMemoryStorage=M;
})();<\/script>
<script>${escScript(platformSource)}<\/script>
<script>${escScript(cleanupClassic)}<\/script>
</head><body><main>synthetic suite QA</main><script>
(()=>{
const C=${JSON.stringify(canary)};
const G=${JSON.stringify(generationKey)}, S=${JSON.stringify(seenKey)}, O=${JSON.stringify(observedKey)}, D=${JSON.stringify(completeKey)};
const contexts=[];
function storeHas(store,target){return target.keys.some(k=>{try{return store.getItem(k)!==null}catch{return true}})}
function makeContext(store){
  const sessionStore=store||sessionStorage; const runtime={value:'',scrubs:0,reloads:0,failure:null};
  const life=window.__createSuiteSessionLifecycle__({platform:window.GHRAB_PLATFORM,localStorage,sessionStorage:sessionStore,beforeCleanup:async()=>{},afterCleanup:async()=>{runtime.value='';runtime.scrubs+=1},onFailure:r=>{runtime.failure=r},reload:()=>{runtime.reloads+=1}});
  const ctx={life,store:sessionStore,runtime}; contexts.push(ctx); return ctx;
}
function seed(ctx,{local=true,session=true}={}){
  if(local) for(const t of window.__CLEAR_ON_END_WORK__.localStorage) localStorage.setItem(t.keys[0],C+':local:'+t.id);
  if(session) for(const t of window.__CLEAR_ON_END_WORK__.sessionStorage){const key=ctx.store===sessionStorage?t.keys[0]:t.keys[t.keys.length-1];ctx.store.setItem(key,C+':session:'+t.id)}
  ctx.runtime.value=C; return true;
}
function inspect(ctx){
  return {local:window.__CLEAR_ON_END_WORK__.localStorage.filter(t=>storeHas(localStorage,t)).map(t=>t.id),session:window.__CLEAR_ON_END_WORK__.sessionStorage.filter(t=>storeHas(ctx.store,t)).map(t=>t.id),memory:ctx.runtime.value,scrubs:ctx.runtime.scrubs,reloads:ctx.runtime.reloads,failure:ctx.runtime.failure,blocked:ctx.life.isPersistenceBlocked(),handled:ctx.life.handledGeneration(),generation:window.GHRAB_PLATFORM.session.generation(),seen:window.GHRAB_PLATFORM.session.seen(),observed:localStorage.getItem(O),complete:localStorage.getItem(D),status:document.documentElement.dataset.ghrabSuiteCleanup||''};
}
function guardedPersist(ctx){if(ctx.life.isPersistenceBlocked())return false;localStorage.setItem('maturitniHodnotitelStateV130',ctx.runtime.value||C);return true}
window.__qa={C,G,S,O,D,contexts,makeStore:()=>new window.__qaMemoryStorage(),makeContext,seed,inspect,guardedPersist};
window.__qaReady=true;
})();<\/script></body></html>`;

const debugPort = 9800 + (process.pid % 500);
const profile = `/tmp/ghrab-suite-browser-${process.pid}`;
fs.rmSync(profile, { recursive: true, force: true });
const chrome = spawn(executablePath, ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'], { stdio: 'ignore', detached: true });

async function waitJson(url){for(let i=0;i<180;i++){try{const r=await fetch(url);if(r.ok)return await r.json()}catch{}await sleep(50)}throw new Error('Chromium debug timeout')}
class Cdp {
  constructor(info){this.id=info.id;this.ws=new WebSocket(info.webSocketDebuggerUrl);this.seq=0;this.pending=new Map();this.ready=new Promise((res,rej)=>{this.ws.onopen=res;this.ws.onerror=rej});this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&this.pending.has(m.id)){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)}}}
  async call(method,params={}){await this.ready;return new Promise((resolve,reject)=>{const id=++this.seq;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
  async eval(expression){const r=await this.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value}
  close(){try{this.ws.close()}catch{}}
}
async function newHarness(){
  const info=await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json();
  const c=new Cdp(info); await c.call('Runtime.enable'); await c.call('Page.enable'); const tree=await c.call('Page.getFrameTree'); await c.call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html:harnessHtml});
  for(let i=0;i<120;i++){if(await c.eval("Boolean(window.__qaReady&&window.GHRAB_PLATFORM?.session?.contract==='ghrab-suite-session-v1')"))return c;await sleep(30)}
  const debug=await c.eval("({ready:window.__qaReady||false,platform:window.GHRAB_PLATFORM?.version||null,contract:window.GHRAB_PLATFORM?.session?.contract||null,body:document.body?.innerText?.slice(0,200)||''})");
  throw new Error('Suite harness timeout: '+JSON.stringify(debug));
}
async function closeHarness(c){try{await fetch(`http://127.0.0.1:${debugPort}/json/close/${c.id}`)}catch{}c.close()}
async function waitFor(c,expr,timeout=5000){const end=Date.now()+timeout;while(Date.now()<end){try{if(await c.eval(`Boolean(${expr})`))return true}catch{}await sleep(30)}throw new Error('waitFor timeout: '+expr)}

const pages=[];
try {
  await waitJson(`http://127.0.0.1:${debugPort}/json/version`);

  // 1) Open child: exact Platform 1.1.2 end() -> registered production handler.
  let c=await newHarness(); pages.push(c);
  let r=await c.eval(`(async()=>{const q=__qa,ctx=q.makeContext();await ctx.life.start();q.seed(ctx);const end=GHRAB_PLATFORM.session.end({reason:'qa-open-child',clearApplicationData:true});for(let i=0;i<100&&ctx.runtime.scrubs<1;i++)await new Promise(x=>setTimeout(x,10));return {end,state:q.inspect(ctx)}})()`);
  let observed=JSON.parse(r.state.observed||'{}'), complete=JSON.parse(r.state.complete||'{}');
  check('open-child.cleanup',r.state.local.length===0&&r.state.session.length===0&&r.state.memory==='',JSON.stringify(r));
  check('open-child.ack-after-cleanup',r.state.seen===r.end.generation&&observed.generation===r.end.generation&&observed.phase==='observed'&&complete.generation===r.end.generation&&complete.phase==='cleanup-complete','same generation has observed, cleanup-complete and ACK evidence');
  await closeHarness(c); pages.pop();

  // 2) Delayed-open replay: tombstone exists before child registers its handler.
  c=await newHarness(); pages.push(c);
  r=await c.eval(`(async()=>{const q=__qa,pre=q.makeContext();q.seed(pre,{session:false});const end=GHRAB_PLATFORM.session.end({reason:'qa-delayed-open',clearApplicationData:true});const before={seen:GHRAB_PLATFORM.session.seen(),local:q.inspect(pre).local};const ctx=q.makeContext();const start=await ctx.life.start();const state=q.inspect(ctx);const evidence=state.complete;const reloadCtx=q.makeContext();const start2=await reloadCtx.life.start();return {end,before,start,state,evidence,start2,state2:q.inspect(reloadCtx)}})()`);
  check('delayed-open.replay',r.before.seen!==r.end.generation&&r.start.startupCleanup===true&&r.state.local.length===0&&r.state.seen===r.end.generation,JSON.stringify(r));
  check('delayed-open.idempotent-reload',r.start2.alreadyAcknowledged===true&&r.state2.complete===r.evidence&&r.state2.local.length===0&&r.state2.session.length===0,JSON.stringify(r.state2));
  await closeHarness(c); pages.pop();

  // 3) Multi-tab model: shared localStorage + distinct tab-local session stores/runtime memory.
  c=await newHarness(); pages.push(c);
  r=await c.eval(`(async()=>{const q=__qa,a=q.makeContext(q.makeStore()),b=q.makeContext(q.makeStore());await a.life.start();await b.life.start();q.seed(a);q.seed(b,{local:false});const end=GHRAB_PLATFORM.session.end({reason:'qa-multi-tab',clearApplicationData:true});for(let i=0;i<100&&(a.runtime.scrubs<1||b.runtime.scrubs<1);i++)await new Promise(x=>setTimeout(x,10));const sa=q.inspect(a),sb=q.inspect(b);const pa=q.guardedPersist(a),pb=q.guardedPersist(b);return {end,sa,sb,pa,pb,residual:localStorage.getItem('ghrab.essay-evaluator.state.v1')}})()`);
  check('multi-tab.scrub-all-contexts',r.sa.local.length===0&&r.sa.session.length===0&&r.sa.memory===''&&r.sb.session.length===0&&r.sb.memory==='',JSON.stringify(r));
  check('multi-tab.autosave-no-resurrection',r.pa===false&&r.pb===false&&r.residual===null,JSON.stringify({pa:r.pa,pb:r.pb,residual:r.residual}));
  await closeHarness(c); pages.pop();

  // Shared ACK race: Platform's built-in listener would skip, child guard must still scrub both contexts.
  c=await newHarness(); pages.push(c);
  r=await c.eval(`(async()=>{const q=__qa,a=q.makeContext(q.makeStore()),b=q.makeContext(q.makeStore());await a.life.start();await b.life.start();q.seed(a);q.seed(b,{local:false});const generation='qa-race-'+Date.now();localStorage.setItem(q.G,generation);localStorage.setItem(q.S,generation);dispatchEvent(new StorageEvent('storage',{key:q.G,newValue:generation}));for(let i=0;i<100&&(a.runtime.scrubs<1||b.runtime.scrubs<1);i++)await new Promise(x=>setTimeout(x,10));return {generation,a:q.inspect(a),b:q.inspect(b)}})()`);
  check('multi-tab.shared-ack-race-guard',r.a.session.length===0&&r.a.memory===''&&r.b.session.length===0&&r.b.memory===''&&r.a.handled===r.generation&&r.b.handled===r.generation,JSON.stringify(r));
  await closeHarness(c); pages.pop();

  // 4) Back/Forward/BFCache model: stale context misses signal while another context ACKs.
  c=await newHarness(); pages.push(c);
  r=await c.eval(`(async()=>{const q=__qa,staleStore=q.makeStore(),stale=q.makeContext(staleStore);await stale.life.start();q.seed(stale);const generation='qa-history-'+Date.now();localStorage.setItem(q.G,generation);const helper=q.makeContext(q.makeStore());const helperStart=await helper.life.start();const before=q.inspect(stale);history.pushState({qa:1},'', '#away');history.back();dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));for(let i=0;i<100&&stale.runtime.scrubs<1;i++)await new Promise(x=>setTimeout(x,10));const after=q.inspect(stale);const persisted=q.guardedPersist(stale);const reloadStore=q.makeStore();for(const t of __CLEAR_ON_END_WORK__.sessionStorage)reloadStore.setItem(t.keys[t.keys.length-1],q.C+':stale-reload:'+t.id);const reload=q.makeContext(reloadStore);const reloadStart=await reload.life.start();return {generation,helperStart,before,after,persisted,reloadStart,reload:q.inspect(reload)}})()`);
  check('history.bfcache-reconcile',r.before.session.length>0&&r.before.seen===r.generation&&r.after.session.length===0&&r.after.memory===''&&r.after.handled===r.generation&&r.persisted===false,JSON.stringify(r));
  check('history.reload-stale-session',r.reloadStart.startupCleanup===true&&r.reload.session.length===0&&r.reload.handled===r.generation,JSON.stringify(r.reload));
  await closeHarness(c); pages.pop();

  // 5) Fail-closed: deletion failure must prevent app ACK and cleanup-complete evidence.
  c=await newHarness(); pages.push(c);
  r=await c.eval(`(async()=>{const q=__qa,ctx=q.makeContext();await ctx.life.start();q.seed(ctx);const original=localStorage.removeItem.bind(localStorage);localStorage.removeItem=function(key){if(key==='maturitniHodnotitelStateV130'||key==='ghrab.essay-evaluator.state.v1')throw new Error('synthetic-delete-failure');return original(key)};const end=GHRAB_PLATFORM.session.end({reason:'qa-fail-closed',clearApplicationData:true});for(let i=0;i<100&&document.documentElement.dataset.ghrabSuiteCleanup!=='failed';i++)await new Promise(x=>setTimeout(x,10));return {end,state:q.inspect(ctx)}})()`);
  check('fail-closed.no-false-ack',r.state.status==='failed'&&r.state.seen!==r.end.generation&&r.state.local.includes('state')&&!(r.state.complete||'').includes(r.end.generation),JSON.stringify(r));
  await closeHarness(c); pages.pop();

  // 6) Mandatory negative control: no lifecycle handler => same security assertion must fail.
  c=await newHarness(); pages.push(c);
  r=await c.eval(`(async()=>{const q=__qa,ctx=q.makeContext();q.seed(ctx);const end=GHRAB_PLATFORM.session.end({reason:'qa-negative-control',clearApplicationData:true});await new Promise(x=>setTimeout(x,80));return {end,state:q.inspect(ctx)}})()`);
  const negativeWouldPass=r.state.local.length===0&&r.state.session.length===0&&r.state.memory===''&&r.state.seen===r.end.generation;
  check('negative-control.expected-fail',negativeWouldPass===false&&r.state.local.length>0&&r.state.session.length>0&&r.state.seen!==r.end.generation,JSON.stringify(r));
  await closeHarness(c); pages.pop();

  // Clean path re-run after disposable negative control.
  c=await newHarness(); pages.push(c);
  r=await c.eval(`(async()=>{const q=__qa,ctx=q.makeContext();await ctx.life.start();q.seed(ctx);const end=GHRAB_PLATFORM.session.end({reason:'qa-post-negative-clean',clearApplicationData:true});for(let i=0;i<100&&ctx.runtime.scrubs<1;i++)await new Promise(x=>setTimeout(x,10));return {end,state:q.inspect(ctx)}})()`);
  check('negative-control.clean-restored-pass',r.state.local.length===0&&r.state.session.length===0&&r.state.memory===''&&r.state.seen===r.end.generation,JSON.stringify(r));
  await closeHarness(c); pages.pop();
} finally {
  for (const c of pages) await closeHarness(c);
  if (chrome.exitCode===null){try{process.kill(-chrome.pid,'SIGTERM')}catch{}}
  await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),sleep(1500)]);
  if (chrome.exitCode===null){try{process.kill(-chrome.pid,'SIGKILL')}catch{}}
  await sleep(100); fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}

const failed=checks.filter(x=>!x.ok);
const report={schema:'ghrab-suite-session-qa-v1',appId:consumer.appId,appVersion:consumer.appVersion,platformVersion:consumer.platform.version,syntheticDataOnly:true,syntheticCanary:{marker:studentCanary,email:canaryEmail},chromium:'system',harness:{transport:'Page.setDocumentContent',storage:'MemoryStorage with shared-local/distinct-session multi-context model',platformSource:'vendor 1.1.2 with fallback script URL bootstrap shim only',navigationLimitation:'true local-http/file navigation is blocked by sandbox browser policy; Back/Forward is exercised by history/pageshow stale-context model'},checks,summary:{total:checks.length,passed:checks.length-failed.length,failed:failed.length},status:failed.length?'failed':'passed'};
await fsp.mkdir(dist,{recursive:true}); await fsp.writeFile(reportPath,JSON.stringify(report,null,2)+'\n'); console.log(JSON.stringify(report,null,2)); if(failed.length)process.exitCode=1;
