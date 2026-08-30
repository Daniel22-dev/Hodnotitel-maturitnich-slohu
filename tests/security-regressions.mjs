import {readFileSync,readdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {runPromptBoundaryChecks} from '../qa/prompt-boundary-harness.mjs';
import {containsConfidentialExamJson} from '../scripts/lib/confidential-exam-json.mjs';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const promptBoundary=runPromptBoundaryChecks(ROOT);
const read=path=>readFileSync(join(ROOT,path),'utf8');
let passed=0,failed=0;
function check(condition,label){if(condition){passed++;console.log('PASS '+label);}else{failed++;console.error('FAIL '+label);}}

check(promptBoundary.ok&&promptBoundary.corpusCount===28&&promptBoundary.attempts===196,'funkční AI prompt boundary izoluje 28 variant ve všech 7 nedůvěryhodných promptových kanálech (196/196)');

const workflowUi=read('src/js/95-workflow-ui.js');
const promptContractSource=read('src/js/45-evaluation-contract.js');
check(/data\.genre=normalizeGenreId\(data\.genre\)/.test(workflowUi)&&/data\.state\.genre=normalizeGenreId\(data\.state\.genre\)/.test(workflowUi),'obnova běžného i Batch stavu whitelistuje genre před Object.assign');
check(/trustedGenreLabel=genreLabel\(genreId\)/.test(promptContractSource)&&!/g\?\.label\|\|state\.genre/.test(promptContractSource),'prompt používá pouze whitelistovaný label žánru bez raw fallbacku');
check(/REPAIR_VALIDATION_JSON_START/.test(promptContractSource)&&/buildRepairPrompt/.test(promptContractSource)&&/evaluation\.validation\.issues\)/.test(read('src/js/65-evaluation-workflow.js')),'validační retry kóduje předchozí AI výstup jako nedůvěryhodný JSON blok');

const reporterModule=await import(pathToFileURL(join(ROOT,'src/access/error-reporter.js')).href+'?privacy-regression='+Date.now());
const reporterCases=[
  ['GARP-STUDENT-CANARY-SECURITY','javascript','[canary odstraněn]'],
  ['Novakova_Jana_4A_sloh.docx','javascript','[název souboru odstraněn]'],
  ['+420 777 123 456','javascript','[telefon odstraněn]'],
];
check(reporterCases.every(([value,type,expected])=>reporterModule.sanitizeTechnicalMessage(value,type)===expected),'error reporter rediguje canary, název souboru a telefon i bez labelu');
check(reporterModule.sanitizeTechnicalMessage('Parse error na vstupu: Travelling is important for young people because…','javascript')==='[technická zpráva redigována]','error reporter nepřenáší nelabelovaný lidský obsah technické chyby');
check(!/new Error\((?:fileName|f\.name)\+/.test(read('src/js/30-privacy-input.js')),'DOCX parser nevkládá původní název souboru do chybové zprávy');

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
check(!/"exam"\s*:\s*\{[\s\S]*?"taskText"\s*:\s*"[^"]+/m.test(taskDb)&&!/exam-(?:opinion|for_against|review|narration|complaint|motivation)-[12]/.test(taskDb),'D-08: veřejný zdroj neobsahuje text ani identifikátory důvěrných ostrých maturitních zadání');
check(/TASK_SESSION_STORAGE_KEY/.test(read('src/js/00-release-rubric.js'))&&/safeSessionSet\(TASK_SESSION_STORAGE_KEY,JSON\.stringify\(tasks\)\)/.test(stateUi),'důvěrná databáze zadání se ukládá do sessionStorage aktuální relace');
check(/snapshot\.exam=cloneTaskData\(makeDefaultTasks\(\)\.exam\)/.test(stateUi)&&/safeLocalSet\(TASK_STORAGE_KEY,JSON\.stringify\(buildPersistentTaskSnapshot\(tasks\)\)\)/.test(stateUi),'persistentní localStorage rediguje ostrou sadu na prázdné placeholdery');
check(/safeSessionRemove\(TASK_SESSION_STORAGE_KEY\)/.test(stateUi),'ukončení citlivé práce maže session kopii důvěrných zadání');
const placeholderSource=taskDb.slice(taskDb.indexOf('function placeholderTask'),taskDb.indexOf('function makeDefaultTasks'));
const normalizeSource=stateUi.slice(stateUi.indexOf('function normalizeImportedTask'),stateUi.indexOf('function mergeTasks'));
const taskContext=vm.createContext({GENRES:[{id:'opinion',label:'Opinion'}]});vm.runInContext(placeholderSource+normalizeSource,taskContext);
taskContext.malicious=JSON.parse('{"id":"x","title":"T","taskText":"Text","__proto__":{"evil":true},"unknown":"drop"}');
const normalized=vm.runInContext("normalizeImportedTask('practice','opinion',malicious,0)",taskContext);
check(normalized.evil===undefined&&!Object.prototype.hasOwnProperty.call(normalized,'unknown'),'import zadání zahodí prototyp i neznámá pole');
const taskDbContext=vm.createContext({GENRES:[{id:'opinion',label:'Opinion'},{id:'for_against',label:'ForAgainst'},{id:'review',label:'Review'},{id:'narration',label:'Narration'},{id:'complaint',label:'Complaint'},{id:'motivation',label:'Motivation'}]});
vm.runInContext(taskDb,taskDbContext,{timeout:1500});
const sessionOnlyTasks=vm.runInContext('makeDefaultTasks()',taskDbContext);
sessionOnlyTasks.exam.opinion[0].taskText='GARP-CONFIDENTIAL-EXAM-CANARY';
sessionOnlyTasks.exam.opinion[0].title='Důvěrné ostré zadání';
const persistentFn=stateUi.match(/function buildPersistentTaskSnapshot\(sourceTasks=tasks\)\{[\s\S]*?\n\}/)?.[0]||'';
taskDbContext.tasks=sessionOnlyTasks;
vm.runInContext(persistentFn,taskDbContext,{timeout:1000});
taskDbContext.sessionOnlyTasks=sessionOnlyTasks;
const persistentSnapshot=vm.runInContext('buildPersistentTaskSnapshot(sessionOnlyTasks)',taskDbContext,{timeout:1000});
check(JSON.stringify(sessionOnlyTasks).includes('GARP-CONFIDENTIAL-EXAM-CANARY')&&!JSON.stringify(persistentSnapshot).includes('GARP-CONFIDENTIAL-EXAM-CANARY'),'D-08 funkčně: persistentní task snapshot odstraní důvěrný obsah ostré sady');
const saveTasksFn=stateUi.match(/function saveTasks\(\)\{[\s\S]*?\n\}/)?.[0]||'';
const taskWrites={local:null,session:null};
taskDbContext.TASK_SESSION_STORAGE_KEY='task-session';taskDbContext.TASK_STORAGE_KEY='task-local';taskDbContext.safeSessionSet=(k,v)=>{taskWrites.session=v;return true;};taskDbContext.safeLocalSet=(k,v)=>{taskWrites.local=v;return true;};taskDbContext.JSON=JSON;
vm.runInContext(saveTasksFn,taskDbContext,{timeout:1000});
vm.runInContext('saveTasks()',taskDbContext,{timeout:1000});
check(String(taskWrites.session).includes('GARP-CONFIDENTIAL-EXAM-CANARY')&&!String(taskWrites.local).includes('GARP-CONFIDENTIAL-EXAM-CANARY'),'D-08 funkčně: úplná ostrá sada jde pouze do sessionStorage, persistentní zápis je redigovaný');

const workflowPersistenceSource=workflowUi.slice(workflowUi.indexOf('function serializableBatchJob'),workflowUi.indexOf('function tryRestoreBatchProgress'));
const examPersistenceContext=vm.createContext({
  APP_VERSION:'1.5.18',
  SENSITIVE_STATE_FIELDS:[],
  state:{set:'exam',genre:'opinion',taskIndex:0,taskTitle:'GARP-EXAM-TITLE-CANARY',taskText:'GARP-EXAM-TEXT-CANARY',taskReqs:'GARP-EXAM-REQ-CANARY',result:'',batchJob:null,series:null,inputMode:'batch',evalMode:'api',outputStyle:'standard',resultView:'final',workMode:'api',roster:[],processingMode:'queue',queueRpm:1,usage:{},distribution:{sharedSecret:'SECRET'},backend:{accessToken:'TOKEN'}},
  batchStudents:[],batchResults:[],normalizeGenreId:v=>v,sensitiveSaveEnabled:()=>true,sensitiveSnapshotExpired:()=>false,ensureWorkflowState:()=>{},safeLocalGet:()=>null,safeLocalSet:()=>true
});
vm.runInContext(workflowPersistenceSource,examPersistenceContext,{timeout:1000});
const persistentStateSnapshot=vm.runInContext('buildStateForStorage()',examPersistenceContext,{timeout:1000});
const sessionBatchSnapshot=vm.runInContext('buildBatchProgressSnapshot()',examPersistenceContext,{timeout:1000});
const persistentBatchSnapshot=vm.runInContext('buildBatchProgressSnapshot({persistent:true})',examPersistenceContext,{timeout:1000});
check(!JSON.stringify(persistentStateSnapshot).includes('GARP-EXAM-')&&persistentStateSnapshot.taskTitle===''&&persistentStateSnapshot.taskText===''&&persistentStateSnapshot.taskReqs==='','D-08 funkčně: obecný persistentní state vždy rediguje obsah ostrého zadání i při opt-in citlivém ukládání');
check(JSON.stringify(sessionBatchSnapshot).includes('GARP-EXAM-TEXT-CANARY')&&!JSON.stringify(persistentBatchSnapshot).includes('GARP-EXAM-'),'D-08 funkčně: Batch session může držet ostré zadání, persistentní Batch snapshot jej vždy rediguje');
check(/hadPersistentExamContext=.*data\?\.set==='exam'/.test(workflowUi)&&/redactPersistentExamTaskContext\(data\);[\s\S]*Object\.assign\(state,data\)/.test(workflowUi),'D-08 migrace odstraňuje starší persistentní ostrý task context ještě před obnovou state');
check(/buildBatchProgressSnapshot\(\{persistent:true\}\)/.test(stateUi),'D-08 local Batch zápis používá explicitně persistentně redigovaný snapshot');

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
const evaluationWorkflow=read('src/js/65-evaluation-workflow.js');
check(/HOD_AI_UNTRUSTED_INPUT_POLICY/.test(aiSource)&&/instructions:hodTrustedInstructionsForOperation\(operation\)/.test(aiSource),'běžná AI cesta odděluje trusted instructions od nedůvěryhodných inputParts');
check(/systemInstruction:\{parts:\[\{text:hodTrustedInstructionsForOperation\('essay-series-evaluation'\)\}\]\}/.test(evaluationWorkflow),'přímý Gemini Batch používá stejnou systemInstruction trust boundary');
check(/instructions:hodTrustedInstructionsForOperation\('essay-series-evaluation'\)/.test(aiSource),'školní Batch gateway používá stejnou trusted instrukční politiku');
const hodPartsSource=aiSource.slice(aiSource.indexOf('function hodParts'),aiSource.indexOf('function hodEnsureAiCore'));
const partsContext=vm.createContext({});vm.runInContext(hodPartsSource,partsContext,{timeout:1000});
const minimizedParts=vm.runInContext("hodParts('text',[{mime:'application/pdf',name:'GARP_FILENAME_CANARY_Alice_4A.pdf',data:'QUJD'}])",partsContext,{timeout:1000});
check(!JSON.stringify(minimizedParts).includes('GARP_FILENAME_CANARY')&&!Object.prototype.hasOwnProperty.call(minimizedParts[1]||{},'name'),'AI Core/school-gateway inputParts neposílají původní název přílohy');
check(!/__HODNOTITEL_USE_LEGACY_AI__|hodLegacyCallGemini/.test(aiSource),'runtime neobsahuje přepínatelný legacy AI bypass');
const legacyGeminiSource=read('src/js/60-evaluation-gemini.js');
check(!/:generateContent/.test(legacyGeminiSource)&&/AI Core transkripční adaptér ještě není inicializovaný/.test(legacyGeminiSource),'legacy transkripční modul nemá přímý provider POST a před AI Core fail-closed');

// GARP 2.3: deployment-controlled school profile must be fail-closed even when the
// bundled platform does not expose optional convenience helpers.
const deploymentHelpersSource=aiSource.slice(aiSource.indexOf('function hodDeployment'),aiSource.indexOf('function hodParts'));
const removedKeys=[];
const schoolContext=vm.createContext({
  URL,
  location:new URL('https://school.example.invalid/apps/hodnotitel/'),
  window:{GHRAB_PLATFORM:{}},
  GEMINI_KEY_SK:'local-key',GEMINI_KEY_SESSION_SK:'session-key',
  safeLocalRemove:key=>{removedKeys.push('L:'+key);return true;},
  safeSessionRemove:key=>{removedKeys.push('S:'+key);return true;},
  resolveGeminiModel:()=> 'gemini-3.6-flash',
  fetch:async()=>({ok:true})
});
schoolContext.__GHRAB_DEPLOYMENT_CONFIG__={profile:'school-server',authMode:'server-session',aiTransport:'school-gateway',apiBaseUrl:'/api/v1/',endpoints:{aiGenerate:'ai/generate',aiHealth:'ai/health'}};
vm.runInContext(deploymentHelpersSource,schoolContext,{timeout:1500});
check(vm.runInContext('hodSchoolMode()',schoolContext)===true,'school profile se určuje z deployment konfigurace, ne z chybějící platform helper metody');
const schoolRuntime=vm.runInContext('hodCreateAiRuntimeConfig()',schoolContext);
check(schoolRuntime.ai.selectedMode==='school-gateway'&&schoolRuntime.ai.allowedModes.length===1&&schoolRuntime.ai.gatewayUrl==='https://school.example.invalid/api/v1/ai/generate','school profil povolí pouze same-origin gateway transport');
let crossOriginRejected=false;
schoolContext.__GHRAB_DEPLOYMENT_CONFIG__={profile:'school-server',authMode:'server-session',aiTransport:'school-gateway',apiBaseUrl:'https://evil.example.invalid/api/'};
try{vm.runInContext("hodApiUrl('ai/generate')",schoolContext);}catch(_){crossOriginRejected=true;}
check(crossOriginRejected,'school gateway odmítne cross-origin API base');
schoolContext.__GHRAB_DEPLOYMENT_CONFIG__={profile:'github-pages',authMode:'signed-permit',aiTransport:'direct-gemini',apiBaseUrl:'/api/v1/'};
const directRuntime=vm.runInContext('hodCreateAiRuntimeConfig()',schoolContext);
check(directRuntime.ai.selectedMode==='direct-gemini'&&directRuntime.ai.allowedModes.length===1,'GitHub profil nemůže automaticky fallbacknout do school gateway');
vm.runInContext('hodEnforceLocalKeyPolicy()',schoolContext);
check(removedKeys.includes('L:local-key')&&removedKeys.includes('S:session-key'),'fallback key policy skutečně odstraní lokální i session provider klíč');

const stateUiSource=read('src/js/20-state-ui.js');
const retentionFn=stateUiSource.match(/function sensitiveSnapshotExpired\(savedAt\)\{[^}]+\}/)?.[0]||'';
const retentionContext=vm.createContext({SENSITIVE_RETENTION_MS:30*24*60*60*1000,Date});
vm.runInContext(retentionFn,retentionContext);
const nowIso=new Date().toISOString(),oldIso=new Date(Date.now()-31*24*60*60*1000).toISOString();
retentionContext.nowIso=nowIso;retentionContext.oldIso=oldIso;
check(vm.runInContext('sensitiveSnapshotExpired(nowIso)',retentionContext)===false&&vm.runInContext('sensitiveSnapshotExpired(oldIso)',retentionContext)===true&&vm.runInContext("sensitiveSnapshotExpired('')",retentionContext)===true,'citlivé lokální snapshoty expirují po 30 dnech a bez timestampu fail-closed');
check(/function endSensitiveWork\(\)/.test(stateUiSource)&&/safeSessionRemove\(GEMINI_KEY_SESSION_SK\)/.test(stateUiSource)&&/safeLocalRemove\(GEMINI_KEY_SK\)/.test(stateUiSource),'ukončení citlivé práce maže uložený stav i provider klíče');
check(read('src/body.html').includes('id="endSensitiveWorkBtn"'),'UI nabízí explicitní ukončení citlivé relace');
const storageConsumer=JSON.parse(read('ghrab-platform.consumer.json'));
const srcStorageConsumer=JSON.parse(read('src/ghrab-platform.consumer.json'));
const dataManifest=JSON.parse(read('src/config/data-manifest.json'));
check(storageConsumer.storageMigration?.backup!=='full'&&srcStorageConsumer.storageMigration?.backup!=='full'&&dataManifest.storageNamespace?.backup!=='full','storage migrace nikdy nevytváří full-value backup citlivých hodnot');
check(/PLATFORM_MIGRATION_BACKUP_SK/.test(releaseSource)&&/purgeLegacySensitiveStorage\(\)\{[^}]*safeLocalRemove\(PLATFORM_MIGRATION_BACKUP_SK\)/.test(stateUiSource),'ukončení/start aplikace odstraňuje historický full-value migration backup');
check(/SENSITIVE_MIGRATION_BACKUP_KEY/.test(read('src/access-bootstrap.js'))&&/localStorage\.removeItem\(SENSITIVE_MIGRATION_BACKUP_KEY\)/.test(read('src/access-bootstrap.js')),'historický migration backup se maže už před autorizačním guardem');

const backendSource=read('src/js/85-backend-adapter.js');
check(!/evaluation-series|Authorization/.test(backendSource),'legacy backend nemá latentní raw-series egress ani vlastní bearer token');
check(/hodSchoolMode\(\)/.test(backendSource)&&/url\.origin!==location\.origin/.test(backendSource)&&/credentials:'include'/.test(backendSource),'legacy health adapter je deployment-controlled, same-origin a používá serverovou relaci');

const privacyOutboundSource=read('src/js/30-privacy-input.js');
check(/identityTerms\.forEach\(term=>add\(term,'STUDENT',true,true\)\)/.test(privacyOutboundSource),'outbound pseudonymizace nepoužívá interní studentský kód jako náhradu identity');
const contractSource=read('src/js/45-evaluation-contract.js');
check(!/KÓD STUDENTA:\s*\$\{out\.code\}/.test(contractSource)&&/student_code:String\(student\?\.code\|\|'STUDENT_001'\)/.test(contractSource),'interní studentský kód se neposílá modelu a autoritu drží lokální aplikace');
check(/function newBatchRequestRef\(\)/.test(evaluationWorkflow)&&/metadata:\{key:requestRef\}/.test(evaluationWorkflow)&&/requestMap/.test(evaluationWorkflow),'přímý Batch používá kryptograficky generovaný opaque request ref a lokální mapu výsledků');
check(!/metadata:\{key:student\.code\}/.test(evaluationWorkflow)&&!/key:student\.code/.test(aiSource)&&/return\{key:ref,operation:'essay-series-evaluation'/.test(aiSource),'provider Batch payload neobsahuje interní studentský kód v transportním metadata klíči');
const distributionSource=read('src/js/75-distribution.js');
check(/const exportPayload=\{\.\.\.payload,secret:''\}/.test(distributionSource)&&/JSON\.stringify\(exportPayload,null,2\)/.test(distributionSource),'stažený distribuční JSON neexportuje sdílené tajemství');
check(distributionSource.includes("/^https:\\/\\/script\\.google\\.com\\/macros\\/s\\/")&&distributionSource.includes('function validAppsScriptUrl()'),'Apps Script egress má explicitní allowlist URL');


const headers=JSON.parse(read('src/config/security-headers.json'));
check(!headers.staticProfile.contentSecurityPolicy.includes("script-src 'self' 'unsafe-inline'")&&!headers.schoolServerProfile.headers['Content-Security-Policy'].includes("script-src 'self' 'unsafe-inline'"),'CSP nepovoluje inline JavaScript');
check(Boolean(headers.schoolServerProfile.headers['Strict-Transport-Security']),'školní server deklaruje HSTS');
const schoolIndex=read('dist-school-server/index.html');
const schoolMetaCsp=schoolIndex.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content="([^"]*)"/i)?.[1]||'';
check(schoolMetaCsp===headers.schoolServerProfile.headers['Content-Security-Policy']&&!/generativelanguage\.googleapis\.com|script\.google\.com|script\.googleusercontent\.com/.test(schoolMetaCsp),'school-server build aplikuje deklarovanou same-origin meta CSP a nezdědí veřejné egress domény');
check(/schoolServerProfile/.test(read('scripts/build-school-profile.mjs'))&&/applyMetaCsp/.test(read('scripts/build-school-profile.mjs')),'school-server build explicitně převádí schoolServerProfile CSP do HTML artefaktu');
for(const file of ['src/index.template.html','src/manual/index.html']){
  const html=read(file);
  const metaPolicy=html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1]||'';
  check(metaPolicy.includes("script-src 'self'")&&!metaPolicy.includes("script-src 'self' 'unsafe-inline'")&&metaPolicy.includes("form-action 'self' https://script.google.com"),'stránka vynucuje meta CSP i na statickém hostingu: '+file);
  const executableInline=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match=>!/^\s*$/.test(match[2])&&!/\bsrc\s*=/.test(match[1]));
  check(executableInline.length===0,'stránka neobsahuje spustitelný inline skript: '+file);
}
check(!/\sonclick\s*=/.test(read('src/body.html'))&&!/\sonclick\s*=/.test(read('src/manual/index.html')),'HTML neobsahuje inline onclick handlery');

const deployWorkflow=read('.github/workflows/deploy.yml');
check(!/push:\s*\n\s*branches:\s*\[main\]/.test(deployWorkflow)&&/workflow_dispatch:/.test(deployWorkflow),'veřejný Pages deploy není automaticky spuštěn pushnutím do aktuálně nechráněné main větve');
check((deployWorkflow.match(/github\.event_name == 'workflow_dispatch'/g)||[]).length>=4,'public artifact a deploy kroky jsou omezené na explicitní workflow_dispatch');
check(/qa:secrets/.test(deployWorkflow)&&/qa:secrets/.test(read('.github/workflows/p5-release-gate.yml')),'CI a deploy spouštějí repository secret scan');
const exportedExamJson=JSON.stringify({practice:{opinion:[]},exam:{opinion:[{id:'exam-opinion-private',title:'Syntetické ostré zadání',taskText:'SYNTETICKÝ DŮVĚRNÝ TEXT',requirements:['R1']}]}},null,2);
check(containsConfidentialExamJson(exportedExamJson),'CI scanner funkčně detekuje skutečný top-level exam JSON formát produkovaný exportTasksBtn');
check(containsConfidentialExamJson(JSON.stringify({set:'exam',taskText:'SYNTETIKA'}))&&/\*\.exam-private\.json/.test(read('.gitignore')),'CI zachovává detekci legacy set=exam tvaru a gitignore první vrstvu');
check(/containsConfidentialExamJson/.test(read('scripts/qa-secret-scan.mjs')),'repository secret scan používá funkční JSON detekci důvěrné ostré sady');
check(/const ROOT=fileURLToPath\(new URL\('\.\.',import\.meta\.url\)\)/.test(read('scripts/qa-secret-scan.mjs')),'repository secret scan je striktně omezen na kořen aplikace a neskenuje sourozenecké cesty');
const governanceIndex=deployWorkflow.indexOf('npm run qa:github-governance');
check(governanceIndex>=0&&governanceIndex<deployWorkflow.indexOf('npm run prepare:pages')&&/branch\?\.protected!==true/.test(read('scripts/verify-github-deployment-governance.mjs')),'Pages deploy fail-closed ověřuje ochranu main před vytvořením veřejného artefaktu');
const p5Index=deployWorkflow.indexOf('npm run qa:p5:ci'), cleanIndex=deployWorkflow.indexOf('npm run prepare:pages'), uploadIndex=deployWorkflow.indexOf('actions/upload-pages-artifact@');
check(p5Index>=0&&cleanIndex>p5Index&&uploadIndex>cleanIndex,'Pages workflow čistí QA-only artefakty až po QA a před veřejným uploadem');
const pagesPrep=read('scripts/prepare-pages-artifact.mjs');
check(/qa-\[\^\/\]\*\\\.json|qa-/.test(pagesPrep)&&/quality-report|quality-manifest/.test(pagesPrep),'Pages cleanup blokuje QA reporty a quality metadata ve veřejném dist');

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
