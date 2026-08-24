import {readFileSync,readdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(join(ROOT,path),'utf8');
let passed=0,failed=0;
function check(condition,label){if(condition){passed++;console.log('PASS '+label);}else{failed++;console.error('FAIL '+label);}}

const deploymentSource=read('src/access/deployment-config.js');
check(/profile:\s*"configuration-unavailable"/.test(deploymentSource),'výpadek deploymentu používá uzamčený profil');
check(/allowLocalProviderKeys:\s*false/.test(deploymentSource),'uzamčený fallback nepovolí lokální provider klíč');
check(!/p0-fallback|používám bezpečný GitHub fallback/.test(deploymentSource),'starý otevřenější fallback byl odstraněn');

globalThis.location=new URL('https://daniel22-dev.github.io/Hodnotitel-maturitnich-slohu/');
globalThis.document={documentElement:{dataset:{}},querySelectorAll:()=>[]};
globalThis.HTMLAnchorElement=class HTMLAnchorElement{};
globalThis.fetch=async()=>{throw new Error('simulovaný výpadek');};
const deploymentModule=await import(pathToFileURL(join(ROOT,'src/access/deployment-config.js')).href+'?security-regression='+Date.now());
const fallback=await deploymentModule.loadDeploymentConfig({appId:'essay-evaluator',timeoutMs:250,forceReload:true});
check(fallback.profile==='configuration-unavailable'&&fallback.authMode==='unavailable','výpadek konfigurace se funkčně uzamkne');
check(fallback.features.allowLocalProviderKeys===false,'výpadek konfigurace funkčně nezpřístupní API klíče');

const githubDeployment=JSON.parse(read('src/config/deployment.json'));
const schoolDeployment=JSON.parse(read('src/config/deployment.school-server.json'));
const accessVersion='access-p1-20260824175535Z-k_wtm7Zj';
check(githubDeployment.sharedAccessVersion===accessVersion&&schoolDeployment.sharedAccessVersion===accessVersion,'oba aktivní profily používají aktuální access bundle');
check(read('src/index.template.html').includes('access/deployment-baked.js')&&read('src/manual/index.html').includes('../access/deployment-baked.js'),'aplikace i manuál načítají zapečený deployment profil');
check(read('scripts/build.mjs').includes('deployment-baked.js')&&read('scripts/build-school-profile.mjs').includes('deployment-baked.js'),'oba build profily vytvářejí vlastní zapečenou konfiguraci');

const releaseSource=read('src/js/00-release-rubric.js');
const csvSource=releaseSource.slice(releaseSource.indexOf('function csvFormulaSafeValue'),releaseSource.indexOf('const GENRES'));
const csvContext=vm.createContext({});vm.runInContext(csvSource,csvContext);
check(vm.runInContext("csvFormulaSafeValue('=HYPERLINK(1)')",csvContext)==="'=HYPERLINK(1)",'CSV neutralizuje vzorec začínající rovnítkem');
check(vm.runInContext("csvFormulaSafeValue('  @SUM(A1)')",csvContext)==="'  @SUM(A1)",'CSV neutralizuje vzorec i po úvodních mezerách');
check(vm.runInContext("csvFormulaSafeValue('bezpečný text')",csvContext)==='bezpečný text','CSV nemění běžný text');
for(const file of ['src/js/25-roster-import.js','src/js/70-results-exports-init.js','src/js/72-report-enhancements.js','src/js/75-distribution.js'])check(read(file).includes('csvCell'),'CSV export používá společnou ochranu: '+file);

const taskDb=read('src/js/10-task-database.js');
const stateUi=read('src/js/20-state-ui.js');
const placeholderSource=taskDb.slice(taskDb.indexOf('function placeholderTask'),taskDb.indexOf('function makeDefaultTasks'));
const normalizeSource=stateUi.slice(stateUi.indexOf('function normalizeImportedTask'),stateUi.indexOf('function mergeTasks'));
const taskContext=vm.createContext({GENRES:[{id:'opinion',label:'Opinion'}]});vm.runInContext(placeholderSource+normalizeSource,taskContext);
taskContext.malicious=JSON.parse('{"id":"x","title":"T","taskText":"Text","__proto__":{"evil":true},"unknown":"drop"}');
const normalized=vm.runInContext("normalizeImportedTask('practice','opinion',malicious,0)",taskContext);
check(normalized.evil===undefined&&!Object.prototype.hasOwnProperty.call(normalized,'unknown'),'import zadání zahodí prototyp i neznámá pole');

const privacySource=read('src/js/30-privacy-input.js');
const archiveHelpers=privacySource.slice(privacySource.indexOf('function zipEntryUncompressedSize'),privacySource.indexOf('function formatSize'));
const archiveContext=vm.createContext({});vm.runInContext(archiveHelpers,archiveContext);
let traversalRejected=false;try{vm.runInContext("assertSafeArchivePath({name:'../tajne.txt'})",archiveContext);}catch(_){traversalRejected=true;}
check(traversalRejected,'ZIP import funkčně odmítne cestu mimo archiv');
check(vm.runInContext("zipEntryUncompressedSize({_data:{uncompressedSize:25000000}})",archiveContext)===25000000,'ZIP limit používá rozbalenou velikost');
check(/ZIP_TOTAL_UNCOMPRESSED_MAX_BYTES/.test(read('src/js/25-roster-import.js'))&&/DOCX_XML_MAX_BYTES/.test(privacySource),'ZIP i DOCX mají rozbalovací limity');

const aiSource=read('src/js/61-ai-core-integration.js');
const privacyMetaSource=aiSource.slice(aiSource.indexOf('function hodPrivacyMetadata'),aiSource.indexOf('async function hodCoreGenerate'));
const aiContext=vm.createContext({state:{privacyMode:'strict',privacyApprovedHash:'ok'},privacyFingerprint:()=> 'ok'});vm.runInContext(privacyMetaSource,aiContext);
const attachmentMeta=vm.runInContext("hodPrivacyMetadata({files:[{name:'scan.pdf'}],transcription:true})",aiContext);
const textMeta=vm.runInContext("hodPrivacyMetadata({files:[]})",aiContext);
check(attachmentMeta.clientAnonymized===false&&attachmentMeta.preflightPassed===false,'přepis přílohy se neoznačí falešně jako anonymizovaný');
check(textMeta.clientAnonymized===true&&textMeta.preflightPassed===true,'zkontrolovaný pseudonymizovaný text nese pravdivá privacy metadata');

const headers=JSON.parse(read('src/config/security-headers.json'));
check(!headers.staticProfile.contentSecurityPolicy.includes("script-src 'self' 'unsafe-inline'")&&!headers.schoolServerProfile.headers['Content-Security-Policy'].includes("script-src 'self' 'unsafe-inline'"),'CSP nepovoluje inline JavaScript');
check(Boolean(headers.schoolServerProfile.headers['Strict-Transport-Security']),'školní server deklaruje HSTS');
for(const file of ['src/index.template.html','src/manual/index.html']){
  const html=read(file);
  const metaPolicy=html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1]||'';
  check(metaPolicy.includes("script-src 'self'")&&!metaPolicy.includes("script-src 'self' 'unsafe-inline'")&&metaPolicy.includes("form-action 'self' https://script.google.com"),'stránka vynucuje meta CSP i na statickém hostingu: '+file);
  const executableInline=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match=>!/^\s*$/.test(match[2])&&!/\bsrc\s*=/.test(match[1]));
  check(executableInline.length===0,'stránka neobsahuje spustitelný inline skript: '+file);
}
check(!/\sonclick\s*=/.test(read('src/body.html'))&&!/\sonclick\s*=/.test(read('src/manual/index.html')),'HTML neobsahuje inline onclick handlery');

const workflowFiles=readdirSync(join(ROOT,'.github/workflows')).filter(name=>/\.ya?ml$/i.test(name));
const workflowSources=workflowFiles.map(name=>({name,source:read('.github/workflows/'+name)}));
const remoteActions=workflowSources.flatMap(({name,source})=>[...source.matchAll(/\buses:\s*([^\s#]+)/g)].map(match=>({name,reference:match[1]})).filter(item=>!item.reference.startsWith('./')));
check(remoteActions.length>0&&remoteActions.every(item=>/@[0-9a-f]{40}$/i.test(item.reference)),'všechny vzdálené GitHub Actions jsou připnuté na neměnný SHA-1');
const checkoutSteps=workflowSources.flatMap(({name,source})=>[...source.matchAll(/uses:\s*actions\/checkout@[0-9a-f]{40}[^\n]*\n([\s\S]{0,180}?)(?=\n\s*-\s+(?:uses|name):)/gi)].map(match=>({name,body:match[1]})));
check(checkoutSteps.length===workflowFiles.length&&checkoutSteps.every(step=>/persist-credentials:\s*false/.test(step.body)),'checkout neponechává GitHub token dostupný dalším krokům');
const syncWorkflow=read('.github/workflows/sync-ghrab-ai-core.yml');
check(/npm ci --ignore-scripts --no-audit --no-fund/.test(syncWorkflow),'synchronizace jádra nespouští instalační skripty závislostí');
check(/--max-redirs 0/.test(syncWorkflow)&&!/curl[^\n]*--location/.test(syncWorkflow),'manifest AI jádra nepovoluje přesměrování mimo ověřenou URL');

console.log(`\n${passed} PASS / ${failed} FAIL`);
if(failed)process.exit(1);
