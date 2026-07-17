#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const SRC=join(ROOT,'src');
let pass=0;
let fail=0;
function check(ok,message){
  if(ok){pass++;console.log('PASS',message);}
  else{fail++;console.error('FAIL',message);}
}
function text(path){return readFileSync(join(ROOT,path),'utf8');}
function exists(path){return existsSync(join(ROOT,path));}
function contains(haystack,needle){return haystack.includes(needle);}

const jsFiles=readdirSync(join(SRC,'js')).filter(x=>x.endsWith('.js')).sort();
const cssFiles=readdirSync(join(SRC,'styles')).filter(x=>x.endsWith('.css')).sort();
const js=jsFiles.map(f=>readFileSync(join(SRC,'js',f),'utf8')).join('\n');
const body=text('src/body.html');
const template=text('src/index.template.html');
const release=text('src/js/00-release-rubric.js');
const rubricSpec=text('src/js/05-rubric-spec.js');
const seriesDomain=text('src/js/15-series-domain.js');
const roster=text('src/js/25-roster-import.js');
const privacyInput=text('src/js/30-privacy-input.js');
const transcription=text('src/js/35-transcription.js');
const promptModel=text('src/js/40-prompt-model.js');
const wordcount=text('src/js/50-wordcount-offline.js');
const contract=text('src/js/45-evaluation-contract.js');
const gemini=text('src/js/60-evaluation-gemini.js');
const results=text('src/js/70-results-exports-init.js');
const reportEnhancements=text('src/js/72-report-enhancements.js');
const stateUi=text('src/js/20-state-ui.js');
const workflow=text('src/js/65-evaluation-workflow.js');
const distribution=text('src/js/75-distribution.js');
const backend=text('src/js/85-backend-adapter.js');
const ui=text('src/js/95-workflow-ui.js');
const bootstrap=text('src/js/99-bootstrap.js');
const access=text('src/access-bootstrap.js');
const sw=text('src/sw.js');
const build=text('scripts/build.mjs');
const appsScript=text('integrations/gmail-apps-script/Code.gs');
const openapi=text('integrations/backend-contract/openapi.yaml');
const manifest=JSON.parse(text('src/studio-manifest.template.json'));
const studioRegistration=JSON.parse(text('src/studio-integration/essay-evaluator-registration.json'));
const rubric=JSON.parse(text('src/rubric/rubric-v2026.04.27-r1.json'));
const pkg=JSON.parse(text('package.json'));
const deployWorkflow=exists('.github/workflows/deploy.yml')?text('.github/workflows/deploy.yml'):'';

check(pkg.version==='1.5.1','package verze 1.5.1');
check(contains(text('README.md'),pkg.version),'README obsahuje aktuální verzi');
check(contains(text('CHANGELOG.md'),`## ${pkg.version}`),'CHANGELOG obsahuje aktuální verzi');
check(contains(release,"version:'__APP_VERSION__'"),'release přebírá verzi z build tokenu');
check(contains(sw,"APP_VERSION='__APP_VERSION__'"),'service worker přebírá verzi z build tokenu');
check(contains(sw,'c.addAll(CORE)')&&!/\.add\([^)]*\)\.catch\s*\(/.test(sw),'service worker má atomický precache bez tichého ignorování chyb');
check(/c\.put\(event\.request,copy\)/.test(sw),'service worker cacheuje skutečnou navigační URL');
check(contains(body,'v__APP_VERSION__'),'UI přebírá verzi z build tokenu');
check(contains(build,"const pkg=JSON.parse")&&contains(build,"replaceAll('__APP_VERSION__',version)"),'package.json je jediný zdroj verze buildu');
check(jsFiles.length>=18,`nejméně 18 JS modulů (${jsFiles.length})`);
check(cssFiles.length>=4,`nejméně 4 CSS moduly (${cssFiles.length})`);

for(const file of jsFiles){
  try{
    execFileSync(process.execPath,['--check',join(SRC,'js',file)],{stdio:'pipe'});
    check(true,`syntaxe ${file}`);
  }catch(error){
    check(false,`syntaxe ${file}: ${String(error.stderr||error.message)}`);
  }
}

const requiredIds=[
  'btnTheme','btnFs','privacyIntroBtn','changesBtn','progressArea','step0','step1','step2','step3','step4','runBtn','resultBox','teacherReviewPanel','reportStudioPanel','reportSignature','reportShowChart','reportShowPriorities','reportIncludeRevision','classAnalyticsBtn','saveHistoryBtn','openHistoryBtn','commentBankSelect','insertCommentBtn','addCommentBtn','deleteCommentBtn',
  'seriesName','seriesClass','seriesDate','seriesTeacher','rubricVersionLabel','rosterInput','rosterParseStatus','importRosterBtn','clearRosterBtn','rosterTable','zipInput','pickZipBtn','exportPairingBtn',
  'workflowDashboard','queueRpm','seriesBudget','todayUsage','batchJobPanel','batchJobState','checkBatchJobBtn','batchReviewDashboard','approveAllValidBtn',
  'appsScriptUrl','appsScriptSecret','emailSubjectTemplate','emailSenderName','emailIncludeScore','emailIncludeOriginal','openAppsScriptBridgeBtn','createDraftsBtn','sendApprovedBtn','downloadDistributionJsonBtn','downloadDistributionCsvBtn',
  'backendMode','backendBaseUrl','backendAccessToken','backendHealthBtn','backendStatus','transcribeSingleBtn'
];
for(const id of requiredIds)check(contains(body,`id="${id}"`),`povinné UI ID ${id}`);
check(contains(body,'typicky 15 · max. 20'),'UI komunikuje reálnou velikost série');
check(contains(body+ui+distribution,'Schváleno učitelem'),'UI obsahuje učitelské schválení');
check(contains(body,'Gmail koncepty'),'UI obsahuje Gmail workflow');
check(contains(body,'assets/ghrab-logo.png'),'záhlaví používá kanonické logo školy');
check(exists('src/assets/ghrab-logo.png')&&!exists('src/assets/ghrab-logo-white-20260711.png')&&!exists('src/assets/ghrab-logo-black-20260711.png'),'existuje jediný kanonický asset školního loga');
check(contains(text('src/styles/90-product-shell.css'),'.product-header h1 em{font-weight:400;color:inherit'), 'hero název používá jednotnou barvu');
const shellCss=text('src/styles/90-product-shell.css');
const pwaManifestText=text('src/manifest.webmanifest');
const pwaManifest=JSON.parse(pwaManifestText);
check(contains(shellCss,'.school-logo-box{display:flex')&&contains(shellCss,'background:#fff'), 'školní logo používá společnou bílou dlaždici');
check(contains(shellCss,'.school-logo{display:block!important')&&contains(shellCss,'filter:none!important'), 'logo není barevně invertováno');
check(contains(template,'manifest.webmanifest')&&!contains(template,'manifest-v1.')&&contains(template,'icons/hodnotitel-shield-20260711-192.png')&&contains(template,'icons/hodnotitel-shield-20260711-180.png'), 'HTML používá stabilní manifest a aktuální ikony');
check(contains(pwaManifestText,'hodnotitel-shield-20260711-512.png')&&contains(pwaManifestText,'hodnotitel-shield-20260711-maskable-512.png'), 'manifest používá nové běžné i maskable ikony');
check(exists('src/icons/icon-source.svg'),'zdroj nové vycentrované PWA ikony');
check(pwaManifest.icons.some(icon=>icon.purpose==='any')&&pwaManifest.icons.some(icon=>icon.purpose==='maskable'),'PWA manifest odděluje běžnou a maskable ikonu');
check(pwaManifest.id==='/Hodnotitel-maturitnich-slohu/'&&pwaManifest.start_url==='./','PWA manifest má stabilní identitu a start URL');
check(!exists('src/manifest-v1.3.3.webmanifest')&&!exists('src/manifest-v1.3.4.webmanifest')&&!exists('src/manifest-v1.3.5.webmanifest'),'staré verzované manifesty jsou odstraněny');
check(!exists('src/icons/icon-192.png')&&!exists('src/icons/icon-512.png')&&!exists('src/icons/apple-touch-icon.png'),'duplicitní legacy ikony jsou odstraněny');
check(contains(body,'<strong>Vlastník aplikace:</strong> Daniel Baláž · Gymnázium, Ostrava-Hrabůvka')&&contains(body,'© 2026 Daniel Baláž. Všechna práva vyhrazena.'),'sjednocené autorství v zápatí');
check(contains(body,'role="dialog"')&&contains(body,'aria-modal="true"'),'modální dialog má přístupnou sémantiku');
check(contains(ui,'<button type="button" class="progress-seg')&&contains(ui,'<button type="button" class="prog-label'),'kroky workflow jsou ovladatelná tlačítka');
check(contains(reportEnhancements,'report-letterhead')&&contains(reportEnhancements,"assets/ghrab-logo.png"),'výsledný report má školní hlavičku a kanonické logo');
check(contains(reportEnhancements,'renderReportDocument')&&contains(reportEnhancements,'report-meta-item'),'profesionální report má strukturovaná metadata');
check(contains(reportEnhancements,'report-preview-a4')||contains(text('src/styles/85-report-studio.css'),'report-preview-a4'),'A4 režim náhledu');
check(contains(reportEnhancements,'report-theme-friendly'),'dva vizuální režimy reportu');
check(contains(reportEnhancements,'reportCategoryMapHtml'),'bodová mapa osmi kategorií');
check(contains(reportEnhancements,'reportPriorityCardsHtml'),'karty tří priorit');
check(contains(reportEnhancements,'reportRevisionTaskHtml'),'revizní miniúkol');
check(contains(reportEnhancements,'REPORT_COMMENT_PRESETS')&&contains(reportEnhancements,'addCustomComment'),'komentářová banka učitele');
check(contains(reportEnhancements,'classifyEvaluationErrors'),'prioritizace kritických, opakujících se a jednorázových chyb');
check(contains(reportEnhancements,'scoreCommentConsistencyIssues'),'kontrola souladu komentáře s body');
check(contains(reportEnhancements,'classAnalyticsData'),'anonymní třídní analytika');
check(contains(reportEnhancements,'REPORT_HISTORY_SK')&&contains(reportEnhancements,'saveCurrentProgressHistory'),'pseudonymní historie pokroku');
check(contains(reportEnhancements,'word/media/ghrab-logo.png')||contains(reportEnhancements,"folder('media').file('ghrab-logo.png'"),'DOCX obsahuje vložené školní logo');
check(contains(reportEnhancements,'word/styles.xml')||contains(reportEnhancements,"file('styles.xml'"),'DOCX obsahuje Word styly');
check(exists('src/vendor/jszip.min.js'),'lokální JSZip je součástí balíku');
check(exists('src/vendor/JSZIP-LICENSE.md'),'licence lokálního JSZip');
check(!contains(js,'cdn.jsdelivr.net/npm/jszip'),'JSZip nemá CDN fallback');
check(!contains(js,'ensureMammoth')&&!contains(js,'window.mammoth'),'DOCX import nepoužívá externí Mammoth');
check(contains(stateUi,"signature:'',customComments:[]")&&contains(ui,"signature:'',customComments:[]"),'citlivé reportové údaje se bez opt-in neukládají');
check(contains(reportEnhancements,'r?.approved&&r?.validation?.ok!==false'),'analytika používá jen schválené validní výsledky');
check(contains(reportEnhancements,'singleEffective?.verified'),'historie jednotlivce vyžaduje finální kontrolu učitele');
check(contains(sw,"./vendor/jszip.min.js"),'service worker cacheuje lokální JSZip');
check(contains(sw,"event.request.mode==='navigate'")&&contains(sw,"caches.match('./index.html')"),'HTML fallback service workeru je omezen na navigaci');
check((sw.match(/caches\.match\('\.\/index\.html'\)/g)||[]).length===1,'index.html fallback existuje pouze v navigační větvi');
check(release.length<12000,'analytická rubrika je výrazně kratší než původní chatový prompt');
check(!contains(release,'Můžu rovnou vložit konkrétní slohovou práci')&&!contains(release,'V závěru napíšeš získaný počet bodů')&&!contains(release,'Napravo od slohové práce'),'prompt neobsahuje chatovou archeologii ani instrukce k ruční anotaci');
check(contains(release,'Konečné body, FAIL podmínky, počet slov, penalizace, součet a známku vždy vypočítá aplikace'),'prompt jasně odděluje analytickou a deterministickou vrstvu');
check(!contains(js,'RESULT_SUMMARY_INSTRUCTIONS'),'odstraněna mrtvá instrukce starého ručního výstupu');
check(!contains(js,'(?<'),'zdroj neobsahuje regex lookbehind');
check(contains(contract,'includeSchema=false')&&contains(contract,'VÝSTUPNÍ JSON SCHÉMA'),'ruční prompt umí vložit úplné JSON schéma');
check(contains(contract,'Obsah mezi značkami STUDENT_TEXT_START'),'prompt obsahuje pojistku proti instrukcím ve studentském textu');
check(contains(sw,'c.put(event.request,copy)'),'service worker cacheuje skutečnou navigační URL');
check(contains(ui,'files:[]')&&contains(ui,'attachmentRestoreRequired')&&!contains(ui,'files:(s.files||[]).map(f=>({...f}))'),'snapshot dávky neukládá binární payload příloh');
check(contains(stateUi,'scheduleBatchProgressSave(delay=550)')&&contains(stateUi,'warnBatchPersistenceFailure'),'ukládání dávky je debounced a hlásí selhání');
check(contains(results,"register(`./sw.js?v=${encodeURIComponent(APP_VERSION)}`"),'registrace service workeru používá aktuální verzi aplikace');
check(contains(build,"'manifest.webmanifest'")&&!contains(build,'manifest-v1.'),'build publikuje jediný stabilní manifest');
check(contains(bootstrap,'initReportEnhancements();'),'bootstrap inicializuje Report Studio');
check(contains(reportEnhancements,'resultContextForText')&&contains(reportEnhancements,'useTeacherReview:!batchContext'),'učitelská korekce je izolovaná od dávkových reportů');

const criticalFunctions=[
  'runPrivacyScan','buildPrompt','localWordCountReport','runEvaluation','callGemini','extractResultMetadata','renderTeacherReviewPanel','downloadBatchZip',
  'parseRosterText','importWorksZip','pairAllStudentsToRoster','requiresTranscriptReview','transcribeBatchStudent','finalizeEvaluation','validateFinalEvaluation',
  'runImmediateBatchQueue','submitGeminiBatchJob','checkGeminiBatchJob','renderBatchReviewDashboard','sendDistributionToAppsScript','submitDistributionViaForm','checkBackendHealth'
];
for(const fn of criticalFunctions){
  check(new RegExp(`(?:async\\s+)?function\\s+${fn}\\s*\\(`).test(js),`kritická funkce ${fn}`);
}

check(contains(seriesDomain,'const SERIES_MAX_WORKS=20'),'pevný limit 20 prací');
check(contains(seriesDomain,'const SERIES_TYPICAL_WORKS=15'),'typická velikost 15 prací');
check(contains(roster,'out.length>=SERIES_MAX_WORKS'),'roster respektuje limit');
check(contains(roster,'batchStudents.length+groups.size>SERIES_MAX_WORKS'),'ZIP import respektuje limit');
check(contains(roster,'pairAllStudentsToRoster'),'automatické párování po importu');
check(contains(roster,"['txt','md','csv','tsv']"),'textové formáty ZIP importu');
check(contains(roster,"ext==='docx'"),'DOCX import');
check(contains(roster,"ext==='pdf'"),'PDF import');
check(contains(privacyInput,'PDF_INLINE_MAX_BYTES')&&contains(roster,'assertPdfInlineSize(f)'),'PDF je omezeno i v single, dávce a ZIP importu');
check(contains(promptModel,'Nejdřív vlož API klíč')&&!contains(promptModel,"if(!key){ geminiKeyScope='permanent'"),'prázdné pole nemůže bez potvrzení přepnout trvalé ukládání klíče');
check(contains(roster,'prepareImageAttachment'),'obrázkový import');
check(contains(roster,'stripPageSuffix'),'seskupení vícestránkových prací');

// Funkční jednotkové kontroly parseru skupiny a seskupování vícestránkových prací.
const rosterContext=vm.createContext({
  SERIES_MAX_WORKS:20,
  btoa:value=>Buffer.from(String(value),'binary').toString('base64'),
  unescape,
  encodeURIComponent,
  console
});
vm.runInContext(roster,rosterContext,{timeout:1500});
function rosterEval(expression){return vm.runInContext(expression,rosterContext,{timeout:1000});}
function parsedRoster(input){return JSON.parse(rosterEval(`JSON.stringify(parseRosterText(${JSON.stringify(input)}))`));}
const rosterSample=parsedRoster('Jméno;E-mail;Třída\nNovák Jan;jan.novak@school.cz;4.A\npetra.mala@school.cz\nNovák Jan;jan.novak@school.cz;4.A');
check(rosterSample.length===2,'parser skupiny přeskočí hlavičku a odstraní duplicitu');
check(rosterSample[0]?.name==='Novák Jan'&&rosterSample[0]?.email==='jan.novak@school.cz','parser skupiny načte jméno a e-mail');
check(rosterSample[1]?.name==='Petra Mala','parser skupiny odvodí jméno z e-mailu');
const isCommaList=Array.from({length:16},(_,i)=>`student${String(i+1).padStart(2,'0')}@example.edu`).join(',')+',';
const commaRoster=parsedRoster(isCommaList);
check(commaRoster.length===16,'parser rozdělí čárkový export z IS na 16 studentů');
check(commaRoster[0]?.email==='student01@example.edu'&&commaRoster[15]?.email==='student16@example.edu','parser zachová první a poslední e-mail z čárkového exportu IS');
check(commaRoster[0]?.name==='Student01','parser odvodí čitelné jméno z e-mailu v exportu IS');
const rosterOverLimit=parsedRoster(Array.from({length:25},(_,i)=>`Student ${i+1};student${i+1}@school.cz`).join('\n'));
check(rosterOverLimit.length===20,'parser skupiny funkčně dodrží maximum 20 studentů');
rosterContext.state={roster:[{id:'R1',name:'Jan Novák',email:'jan@example.cz'},{id:'R2',name:'Petr Novák',email:'petr@example.cz'}]};
rosterContext.__ambiguousStudent={identity:'',sourceName:'novak sloh.docx',sourceFiles:[]};
check(rosterEval('bestRosterMatch(__ambiguousStudent)')===null,'dva jmenovci se stejným skóre se automaticky nespárují');
const pagePaths=['Novak_1.jpg','Novak_2.jpg','Mala_1.jpg','Mala_2.jpg'];
check(rosterEval(`importGroupKey('Novak_1.jpg',${JSON.stringify(pagePaths)})`)===rosterEval(`importGroupKey('Novak_2.jpg',${JSON.stringify(pagePaths)})`),'vícestránkové obrázky stejného studenta se seskupí');
check(rosterEval(`importGroupKey('Novak_1.jpg',${JSON.stringify(pagePaths)})`)!==rosterEval(`importGroupKey('Mala_1.jpg',${JSON.stringify(pagePaths)})`),'práce různých studentů se nesmíchají');
const cameraPaths=['IMG_1234.jpg','IMG_1235.jpg'];
check(rosterEval(`importGroupKey('IMG_1234.jpg',${JSON.stringify(cameraPaths)})`)!==rosterEval(`importGroupKey('IMG_1235.jpg',${JSON.stringify(cameraPaths)})`),'obecné názvy fotografií se automaticky nesmíchají');
const docPaths=['Student_001.docx','Student_002.docx'];
check(rosterEval(`importGroupKey('Student_001.docx',${JSON.stringify(docPaths)})`)!==rosterEval(`importGroupKey('Student_002.docx',${JSON.stringify(docPaths)})`),'číslované DOCX práce se automaticky nesmíchají');

const docxParserSource=privacyInput.slice(privacyInput.indexOf('function decodeDocxXmlText'),privacyInput.indexOf('async function extractDocxText'));
const docxParserContext=vm.createContext({console});
vm.runInContext(docxParserSource,docxParserContext,{timeout:1500});
const sampleDocxXml='<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>První &amp; druhý</w:t></w:r></w:p><w:p><w:r><w:t>Řádek</w:t><w:tab/><w:t>dva</w:t><w:br/><w:t>pokračování</w:t></w:r></w:p></w:body></w:document>';
const parsedDocxText=vm.runInContext(`docxXmlToText(${JSON.stringify(sampleDocxXml)},'test.docx')`,docxParserContext,{timeout:1000});
check(parsedDocxText==='První & druhý\nŘádek\tdva\npokračování','lokální DOCX parser zachová odstavce, entity, tabulátory a zalomení');
let invalidDocxRejected=false;
try{vm.runInContext("docxXmlToText('<xml/>','vadny.docx')",docxParserContext,{timeout:1000});}catch(_){invalidDocxRejected=true;}
check(invalidDocxRejected,'lokální DOCX parser odmítne neplatnou strukturu');

// Funkční kontrola školní převodní tabulky bodů na známku.
const rubricContext=vm.createContext({console});
vm.runInContext(rubricSpec,rubricContext,{timeout:1500});
for(const [score,grade] of [[24,1],[21,1],[20,2],[18,2],[17,3],[14,3],[13,4],[11,4],[10,5],[0,5]]){
  check(vm.runInContext(`gradeFromTotal(${score})`,rubricContext)===grade,`převod ${score} bodů na známku ${grade}`);
}



// Funkční kontrola pseudonymizace identity a telefonu.
const privacyCoreSource=privacyInput.slice(privacyInput.indexOf('function escapeRegExp'),privacyInput.indexOf('function applyPseudonymizationToField'));
const privacyCoreContext=vm.createContext({console});
vm.runInContext(privacyCoreSource,privacyCoreContext,{timeout:1500});
privacyCoreContext.__privacyText='Jan Novák napsal text. Jan přišel v January. Novák odešel. Telefon 123 456 789, kód 123456789.';
const privacyOut=JSON.parse(vm.runInContext("JSON.stringify(getOutboundStudentTextFromValues(__privacyText,'Jan Novák','STUDENT_001',''))",privacyCoreContext,{timeout:1000}));
check(!privacyOut.text.includes('Jan Novák')&&!privacyOut.text.includes(' Novák')&&!privacyOut.text.includes('Jan přišel'),'pseudonymizace nahrazuje celé jméno i samostatné části');
check(privacyOut.text.includes('January'),'pseudonymizace nenahrazuje jméno uvnitř delšího slova');
check(privacyOut.text.includes('[TELEFON_1]')&&privacyOut.text.includes('123456789'),'telefon se separátory se anonymizuje, prostá devítimístná sekvence zůstává k ruční kontrole');
privacyCoreContext.__privacyText='Novak odevzdal práci a NOVÁK ji podepsal.';
const privacyFolded=JSON.parse(vm.runInContext("JSON.stringify(getOutboundStudentTextFromValues(__privacyText,'Novák','STUDENT_002',''))",privacyCoreContext,{timeout:1000}));
check(!/novak|novák/i.test(privacyFolded.text),'anonymizace jména funguje i bez diakritiky');

// Funkční zlaté vzorky lokálního word-count enginu.
const wcContext=vm.createContext({console,WC_MONTHS:new Set(['january','february','march','april','may','june','july','august','september','october','november','december']),WC_NAME_CONNECTORS:new Set(['of','and','the','de','del','la','le','van','von','nad','upon']),WC_CAP_STOP:new Set(['I','The','A','An','In','On','At','To','From','For','And','But','Or','If','When','While','Because','Although','However','Therefore','Firstly','Secondly','Finally','It','This','That','These','Those','There','Nowadays','Dear','Yours','Sir','Madam','Mr','Mrs','Ms','Miss','Kind','Regards']),tokenizeSpaces:text=>String(text||'').trim()?String(text).trim().split(/\s+/).filter(Boolean):[]});
vm.runInContext(wordcount,wcContext,{timeout:2500});
function wcEval(textValue,task='',title='',genre=''){wcContext.__text=textValue;wcContext.__task=task;wcContext.__title=title;wcContext.__genre=genre;return JSON.parse(vm.runInContext('JSON.stringify(localWordCountReport(__text,__task,__title,__genre))',wcContext,{timeout:1000}));}
for(const sample of [
  {name:'prostý text',text:'hello world',expected:2},
  {name:'číslovka číslicemi',text:'In 1982 life was different.',expected:4},
  {name:'originální nadpis',text:'My Great Adventure\n\nIt started very suddenly.',genre:'narration',expected:5},
  {name:'převzatý nadpis',text:'Public Transport\n\nIt is useful.',task:'Write an essay about Public Transport',title:'Public Transport',genre:'opinion',expected:3},
  {name:'víceslovné vlastní jméno',text:'Jack Smith arrived today.',expected:3},
  {name:'opakované vlastní jméno',text:'Jack Smith arrived. Jack Smith left.',expected:3}
]) check(wcEval(sample.text,sample.task||'',sample.title||'',sample.genre||'').finalCount===sample.expected,`word-count zlatý vzorek: ${sample.name}`);
const paraGolden=wcEval('One two.\n\nThree four five.');
check(JSON.stringify(paraGolden.paraCounts)===JSON.stringify([2,3])&&paraGolden.finalCount===5,'word-count zachová audit po odstavcích');
const markerGolden=wcEval('[ZDROJ: NAHRANÝ_TEXT]\n'+Array.from({length:194},()=> 'word').join(' '));
check(markerGolden.finalCount===194&&!String(markerGolden.firstSentence).startsWith('[ZDROJ'),'technický marker staré relace se nepočítá ani nevstupuje do zámku');
const reviewSentence=wcEval('This phone is amazing and cheap\nThe battery lasts all day.','','','review');
check(reviewSentence.heading===null,'review bez nadpisu neořeže první větu');
const reviewHeading=wcEval('My Phone Review\n\nThe battery lasts all day.','','','review');
check(reviewHeading.heading?.type==='originální nadpis','review s nadpisem a prázdným řádkem nadpis rozpozná');
const narrationHeading=wcEval('A Difficult Journey\nIt began at dawn.','','','narration');
check(narrationHeading.heading?.type==='originální nadpis','narration rozpozná Title Case nadpis i bez prázdného řádku');

// Funkční kontrola, že snapshot neobsahuje base64 data příloh.
const snapshotSource=ui.slice(ui.indexOf('function serializableBatchJob'),ui.indexOf('function tryRestoreBatchProgress'));
const snapshotContext=vm.createContext({console,APP_VERSION:pkg.version,state:{set:'practice',genre:'opinion',taskIndex:0,taskTitle:'T',taskText:'',taskReqs:'',inputMode:'batch',evalMode:'deep',outputStyle:'teacher',resultView:'teacher',workMode:'api',series:{},roster:[],processingMode:'queue',queueRpm:5,batchJob:{name:'jobs/1',state:'SUCCEEDED',codes:['STUDENT_001'],raw:{inlinedResponses:[{response:{candidates:[{content:{parts:[{text:'citace studenta'}]}}]}}]}},usage:{},distribution:{sharedSecret:'secret'},backend:{accessToken:'token'}},batchStudents:[{code:'STUDENT_001',text:'Text',sourceFiles:[],files:[{name:'photo.jpg',mime:'image/jpeg',size:123,dataUrl:'data:image/jpeg;base64,AAAA'}]}],batchResults:[],sensitiveSaveEnabled:()=>false});
vm.runInContext(snapshotSource,snapshotContext,{timeout:1500});
const snapshotJson=vm.runInContext('JSON.stringify(buildBatchProgressSnapshot())',snapshotContext,{timeout:1000});
const snapshotParsed=JSON.parse(snapshotJson);
check(!snapshotJson.includes('base64')&&!snapshotJson.includes('AAAA'),'snapshot funkčně neobsahuje base64 data');
check(snapshotParsed.batchStudents[0].files.length===0&&snapshotParsed.batchStudents[0].attachmentRestoreRequired===true,'snapshot označí nutnost znovu přiložit přílohy');
check(!snapshotJson.includes('inlinedResponses')&&!snapshotJson.includes('candidates')&&!snapshotJson.includes('citace studenta'),'snapshot nikdy neukládá surovou Batch odpověď');
const storageContext=vm.createContext({console,state:snapshotContext.state,SENSITIVE_STATE_FIELDS:[],sensitiveSaveEnabled:()=>false});
const storageSource=ui.slice(ui.indexOf('function serializableBatchJob'),ui.indexOf('function saveState'));
vm.runInContext(storageSource,storageContext,{timeout:1500});
const storedStateJson=vm.runInContext('JSON.stringify(buildStateForStorage())',storageContext,{timeout:1000});
check(!storedStateJson.includes('inlinedResponses')&&!storedStateJson.includes('candidates')&&!storedStateJson.includes('citace studenta'),'hlavní uložený stav nikdy neobsahuje surovou Batch odpověď');

// Funkční kontrola blokace přílohy bez přepisu.
const singleGuardSource=transcription.slice(0,transcription.indexOf('function showSingleTranscriptGuidance'));
const singleGuardContext=vm.createContext({attachedFiles:[{name:'scan.pdf'}],state:{studentText:''}});
vm.runInContext(singleGuardSource,singleGuardContext,{timeout:1000});
check(vm.runInContext('singleAttachmentTranscriptRequired()',singleGuardContext)===true,'single příloha bez textu je blokována před hodnocením');
singleGuardContext.state.studentText='Zkontrolovaný přepis.';
check(vm.runInContext('singleAttachmentTranscriptRequired()',singleGuardContext)===false,'single příloha se zkontrolovaným přepisem může pokračovat');

// Funkční kontrola nerecyklovatelných kódů.
const codeSource=stateUi.slice(stateUi.indexOf('function nextBatchCode'),stateUi.indexOf('function addBatchStudent'));
const codeContext=vm.createContext({batchStudents:[{code:'STUDENT_002'},{code:'STUDENT_003'}],batchResults:[{code:'STUDENT_001'}]});
vm.runInContext(codeSource,codeContext,{timeout:1000});
check(vm.runInContext('nextBatchCode()',codeContext)==='STUDENT_004','po odebrání práce se vrací další maximální kód bez kolize');

check(contains(transcription,'Neopravuj gramatiku, spelling, slovosled ani styl.'),'přepis zachovává chyby');
check(contains(transcription,'transcriptConfirmed'),'povinné potvrzení přepisu');
check(contains(workflow,'validateBatchPreflight'),'předběžná kontrola dávky');
check(contains(workflow,'obrazových/PDF prací nemá potvrzený digitální přepis'),'dávka blokuje nepotvrzený přepis');

check(rubric.schema==='ghrab-essay-rubric-v2','schema rubriky');
check(rubric.version==='2026.04.27-r1','verze rubriky');
check(rubric.sections.length===8,'rubrika má 8 kategorií');
check(rubric.word_count.minimum===195,'minimum 195 slov');
check(rubric.word_count.long_penalty_from===300,'penalizace od 300 slov');
check(rubric.assignment.fail_conditions.length===4,'čtyři FAIL podmínky');
check(rubric.assignment.opinion_for_against_exception?.penalty_points===1,'opinion ↔ for-and-against má přesně −1 bod bez automatického FAIL');
check(rubric.ptn.missing_group_penalty===1,'chybějící skupina PTN odečte přesně jeden bod');
check(!Object.prototype.hasOwnProperty.call(rubric.ptn,'missing_any_caps_score_at'),'rubrika neobsahuje staré rozporné zastropování PTN');
check(rubric.grade_bands.length===5,'pět známkových pásem');
check(rubric.error_scoring.no_double_counting_across_lexis_and_grammar===true,'zákaz dvojího počítání');
check(rubric.zero_rule.other_zero_reduces_every_three_to_two_once===true,'pravidlo nuly');
check(rubric.required_outputs.requirement_evidence===true,'povinná důkazní mapa');
check(rubric.required_outputs.handwriting_legibility_percent===true,'čitelnost rukopisu');
check(rubric.required_outputs.teacher_detail&&rubric.required_outputs.student_feedback&&rubric.required_outputs.record_summary,'tři výstupní pohledy');

check(contains(rubricSpec,"const RUBRIC_VERSION='2026.04.27-r1'"),'programová verze rubriky');
check(contains(rubricSpec,'EVALUATION_RESPONSE_SCHEMA'),'strukturované response schema');
check(contains(rubricSpec,"required:['schema_version','rubric_version'"),'povinná pole JSON výstupu');
check(contains(rubricSpec,'detected_genre'),'schema vyžaduje rozpoznaný útvar');
check(contains(rubricSpec,'essayPairException'),'programová rubrika obsahuje výjimku opinion ↔ for-and-against');
check(contains(contract,'removeCrossCategoryDuplicates'),'odstranění dvojího počítání');
check(contains(contract,"uniquePush(fail,'FAIL-1')"),'deterministické FAIL-1');
check(contains(contract,"uniquePush(fail,'FAIL-2')"),'deterministické FAIL-2');
check(contains(contract,"uniquePush(fail,'FAIL-3')"),'deterministické FAIL-3');
check(contains(contract,"uniquePush(fail,'FAIL-4')"),'deterministické FAIL-4');
check(contains(contract,'scoreErrors'),'deterministické skóre chyb');
check(contains(contract,'gradeFromTotal(total)'),'deterministická známka');
check(contains(contract,'validateFinalEvaluation'),'validační brána');
check(contains(contract,'Důkazní mapa nemá přesně všechny body zadání'),'validace důkazní mapy');
check(contains(contract,'Součet kategorií nesouhlasí'),'validace součtu');
check(contains(contract,'Obrazový/PDF přepis nebyl potvrzen učitelem'),'validace přepisu');
check(contains(contract,'quoteOccursInStudentText'),'validace ověřuje, že citace skutečně pocházejí ze slohu');
check(contains(contract,'Návrhy FAIL kódů od AI nejsou autoritativní'),'FAIL kódy AI nejsou autoritativní');
check(contains(contract,'function generatedTeacherDetail'),'aplikace skládá autoritativní učitelský detail');
check(contains(contract,'Kontrola rozsahu a zámek vstupu'),'učitelský výstup obsahuje povinný word-count audit');
check(contains(contract,'Indikátory neautentického / šablonovitého projevu'),'učitelský výstup obsahuje úplnou opatrnou analýzu autenticity');
check(!contains(contract,'missingCap'),'hodnoticí engine nepoužívá staré zastropování PTN');

// Funkční jednotkové kontroly deterministického hodnoticího jádra.
const contractContext=vm.createContext({
  console,
  state:{taskText:'',taskTitle:'',taskReqs:'R1: první požadavek\nR2: druhý požadavek',genre:'opinion'},
  currentTask:()=>({title:''}),
  normalizeMatchText:value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),
  normalizePlainForCount:value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' '),
  localWordCountReport:()=>({rawCount:200,deductTotal:0,finalCount:200,paraCounts:[200],firstSentence:'First sentence.',lastSentence:'Last sentence.'})
});
vm.runInContext(rubricSpec+'\n'+contract,contractContext,{timeout:2500});
const sourceText='First sentence. This is a clear supporting example for requirement one. Another clear supporting example addresses requirement two. Students sometimes use learned phrases from class in their writing. A polished sentence can also come from careful revision. Repeated classroom templates may explain formal expressions. Last sentence.';
function validRawEvaluation(){
  const section={score_suggested:3,verdict:'splneno',evidence:['This is a clear supporting example for requirement one.'],reasoning:'Konkrétní důkaz podporuje přidělené body.'};
  return {
    schema_version:'2.0',rubric_version:'2026.04.27-r1',student_code:'STUDENT_001',
    transcription:{source_type:'text',legibility_percent:null,uncertain_fragments:[]},
    input_lock:{first_sentence:'First sentence.',last_sentence:'Last sentence.',confirmed_exact_input:true},
    assignment_analysis:{genre_match:true,detected_genre:'opinion',off_topic:false,formal_salutation_present:null,formal_closing_present:null,formal_pair_correct:null,heading_present:null,contractions_count:0,requirements:[
      {id:'R1',verdict:'splneno',evidence:[{paragraph:'P1',quote:'This is a clear supporting example for requirement one.'}],reason:'Požadavek je výslovně splněn.'},
      {id:'R2',verdict:'splneno',evidence:[{paragraph:'P1',quote:'Another clear supporting example addresses requirement two.'}],reason:'Požadavek je výslovně splněn.'}
    ],fail_codes_suggested:[]},
    sections:Object.fromEntries(['zadani_a_rozsah','odstavce_a_koherence','lexikalni_a_spellingove_chyby','gramaticke_chyby','obsah','ptn_a_koheze','uroven_slovni_zasoby','uroven_gramatiky'].map(id=>[id,{...section}])),
    errors:{lexical_local:[],lexical_global:[],grammar_local:[],grammar_global:[]},
    ptn:{PTN1:['and'],PTN2:['because'],PTN3:['in conclusion']},
    advanced_language:{b2_grammar:['relative clause'],advanced_grammar:[],b2_vocabulary:['supporting example']},
    authenticity:{estimate_percent:20,certainty:'nizka',signals:[
      {paragraph:'P1',quote:'Students sometimes use learned phrases from class',reason:'Může působit naučeně.',alternative_explanation:'Může jít o školní dril.'},
      {paragraph:'P1',quote:'A polished sentence can also come from careful revision',reason:'Věta je uhlazená.',alternative_explanation:'Student mohl text pečlivě revidovat.'},
      {paragraph:'P1',quote:'Repeated classroom templates may explain formal expressions',reason:'Formulace je šablonovitá.',alternative_explanation:'Může pocházet z učebnice.'}
    ]},
    feedback:{teacher_markdown:'Učitelský detail.',student_markdown:'Zpětná vazba pro studenta.',positive:['Silná stránka.'],negative:['Slabší stránka.'],improvements:['Konkrétní zlepšení.'],extreme_content_note:null}
  };
}
function contractEval(expression){return vm.runInContext(expression,contractContext,{timeout:1500});}
contractContext.__raw=validRawEvaluation();contractContext.__student={code:'STUDENT_001',text:sourceText,files:[],transcriptConfirmed:true};
let deterministic=contractEval('finalizeEvaluation(__raw,__student)');
check(deterministic.final.total===24&&deterministic.final.grade===1,'deterministický engine vypočte 24 bodů a známku 1');
contractContext.localWordCountReport=()=>({rawCount:207,deductTotal:7,finalCount:200,paraCounts:[200],firstSentence:'First sentence.',lastSentence:'Last sentence.'});
contractContext.__raw=validRawEvaluation();
check(contractEval('evaluationMachineSummary(finalizeEvaluation(__raw,__student)).deducted_word_count')===7,'strojový souhrn přenáší odečtený počet slov');
contractContext.localWordCountReport=()=>({rawCount:200,deductTotal:0,finalCount:200,paraCounts:[200],firstSentence:'First sentence.',lastSentence:'Last sentence.'});
check(contains(contract,'## Tři kroky pro příští sloh')&&contains(contract,'## Doporučený postup opravy'),'studentská zpětná vazba obsahuje akční plán');
check(deterministic.validation.ok===true,'úplný strukturovaný výstup projde validační bránou');
contractContext.GENRES=[{id:'opinion',label:'Opinion essay'}];contractContext.getOutboundStudentTextFromValues=(text,identity,code)=>({text,code,map:[]});contractContext.getOutboundStudentText=()=>({text:contractContext.state.studentText||'',code:contractContext.state.studentCode||'STUDENT_001',map:[]});contractContext.formatWordCountAuditForPrompt=()=> 'WORD_COUNT_AUDIT';contractContext.RUBRIC_PROMPT='RUBRIKA';contractContext.materializeResponseSchema=value=>value;contractContext.state.studentText=sourceText;contractContext.state.studentCode='STUDENT_001';
const manualPrompt=contractEval('buildPrompt(__student,true)');
check(manualPrompt.includes('\"student_code\"')&&manualPrompt.includes('\"assignment_analysis\"')&&manualPrompt.includes('Odpověz POUZE tímto JSONem'),'ruční prompt skutečně obsahuje response schema');
contractContext.RESULT_JSON_START='=== MACHINE_SUMMARY_JSON ===';contractContext.RESULT_JSON_END='=== END_MACHINE_SUMMARY_JSON ===';contractContext.RESULT_FEEDBACK_START='=== FEEDBACK_MARKDOWN ===';contractContext.RESULT_VIEW_MARKERS={teacher:'=== TEACHER_DETAIL ===',student:'=== STUDENT_FEEDBACK ===',record:'=== RECORD_TABLE ==='};contractContext.attachedFiles=[];contractContext.batchResults=[];contractContext.__manualInput={value:JSON.stringify(validRawEvaluation())};contractContext.$=id=>id==='manualResultInput'?contractContext.__manualInput:{disabled:false};contractContext.renderResult=()=>{};contractContext.saveState=()=>{};contractContext.goTo=()=>{};contractContext.toast=()=>{};contractContext.formatDeductionList=()=>'';contractContext.formatParagraphAudit=()=> 'P1=200';
const manualImportSource=wordcount.slice(wordcount.indexOf('function stripManualJsonFence'),wordcount.indexOf('async function downloadPromptBundleTxt'));
vm.runInContext(manualImportSource,contractContext,{timeout:1500});
contractEval('importManualResult()');
check(contractContext.state.result.includes('=== MACHINE_SUMMARY_JSON ===')&&contractContext.state.lastEvaluation?.final?.grade===1,'ruční JSON round-trip spustí deterministický engine a vytvoří autoritativní výsledek');
contractContext.__raw=validRawEvaluation();contractContext.__raw.assignment_analysis.fail_codes_suggested=['FAIL-2'];
deterministic=contractEval('finalizeEvaluation(__raw,__student)');
check(deterministic.final.fail_codes.length===0,'AI návrh FAIL kódu nemůže sám vyvolat neúspěch');
contractContext.__raw=validRawEvaluation();contractContext.__raw.sections.obsah.score_suggested=0;
deterministic=contractEval('finalizeEvaluation(__raw,__student)');
check(deterministic.final.scores.zadani_a_rozsah===3,'pravidlo nuly nesnižuje sekci Zadání');
check(deterministic.final.scores.odstavce_a_koherence===2&&deterministic.final.scores.obsah===0,'pravidlo nuly sníží ostatní trojky právě jednou');
contractContext.__raw=validRawEvaluation();contractContext.__raw.assignment_analysis.genre_match=false;contractContext.__raw.assignment_analysis.detected_genre='review';
deterministic=contractEval('finalizeEvaluation(__raw,__student)');
check(deterministic.final.fail_codes.includes('FAIL-1')&&deterministic.final.grade===5,'FAIL-1 je určen deterministicky a vede ke známce 5');
contractContext.__raw=validRawEvaluation();contractContext.__raw.assignment_analysis.genre_match=false;contractContext.__raw.assignment_analysis.detected_genre='for_against';
deterministic=contractEval('finalizeEvaluation(__raw,__student)');
check(deterministic.final.fail_codes.length===0&&deterministic.final.scores.zadani_a_rozsah===2,'záměna opinion a for-and-against znamená −1 bod, nikoli FAIL');
contractContext.__raw=validRawEvaluation();contractContext.__raw.ptn.PTN3=[];
deterministic=contractEval('finalizeEvaluation(__raw,__student)');
check(deterministic.final.scores.ptn_a_koheze===2,'chybějící skupina PTN odečte přesně jeden bod');
contractContext.localWordCountReport=()=>({rawCount:194,deductTotal:0,finalCount:194,paraCounts:[194],firstSentence:'First sentence.',lastSentence:'Last sentence.'});contractContext.__raw=validRawEvaluation();
deterministic=contractEval('finalizeEvaluation(__raw,__student)');
check(deterministic.final.below_minimum===true&&deterministic.final.grade===5,'méně než 195 slov vede ke známce 5');
contractContext.localWordCountReport=()=>({rawCount:200,deductTotal:0,finalCount:200,paraCounts:[200],firstSentence:'First sentence.',lastSentence:'Last sentence.'});
check(contractEval('scoreErrors(0,0)')===3&&contractEval('scoreErrors(6,2)')===1&&contractEval('scoreErrors(18,0)')===0,'vzorec lokálních a globálních chyb odpovídá rubrice');


check(contains(workflow,"responseMimeType:'application/json'"),'Gemini JSON MIME type');
check(contains(workflow,'responseSchema:materializeResponseSchema'),'Gemini response schema');
check(contains(workflow,"temperature:0.05"),'nízká teplota hodnocení');
check(contains(workflow,'if(!evaluation.validation.ok)')&&contains(workflow,'OPRAVNÁ VALIDACE'),'opravný validační požadavek');
check(contains(workflow,'batchResultDone(s.code)'),'hotové práce se neodesílají znovu');
check(contains(stateUi,"['hotovo','kontrola'].includes(r.status)"),'dokončený výsledek ke kontrole se neodesílá znovu');
check(contains(stateUi,"['hotovo','kontrola','chyba','čeká na pokračování']"),'reset dávky vrací i stav kontrola');
check(contains(gemini,'renderGeminiModelSelect(unique,current,apiVersion)'),'ověřené Gemini modely se propíší do výběru');
check(contains(roster,'syncStudentContactToResult')&&contains(roster,"result.deliveryStatus='not-ready'"),'změna kontaktu zneplatní schválení a distribuci');
check(contains(distribution,'function isValidEmail'),'distribuce používá syntaktickou validaci e-mailu');
check(contains(seriesDomain,'function localIsoDate')&&!contains(seriesDomain,"toISOString().slice(0,10)"),'lokální datum není odvozeno z UTC dne');
check(contains(workflow,'queueThrottle'),'řízené RPM fronty');
check(contains(workflow,':batchGenerateContent'),'správná REST metoda Batch API');
check(contains(workflow,"v1beta/models/"),'modelový Batch endpoint');
check(contains(workflow,'estimateBatchPayloadBytes'),'kontrola velikosti inline Batch požadavku');
check(contains(workflow,'19*1024*1024'),'bezpečný limit pod 20 MB');
check(contains(workflow,'response?.inlinedResponses'),'REST načtení Batch výsledků');
check(!contains(workflow,'job.codes?.[i]'),'Batch odpověď bez metadata.key se nepřiřazuje podle indexu');
check(!contains(workflow,'job.raw=data'),'surová Batch odpověď se nedrží v persistovaném stavu');
check(contains(workflow,'Model nedokončil strukturovaný výstup'),'MAX_TOKENS má řízenou srozumitelnou chybu');
check(contains(gemini,'Přepis je delší než výstupní limit')&&!contains(gemini,'Pokračuj v přerušeném hodnocení'),'transkripce nepoužívá legacy pokračování hodnocení');
check(contains(workflow,"registerUsage(row.response?.usageMetadata||{},'batch')"),'Batch spotřeba tokenů');

check(contains(seriesDomain,'GEMINI_PRICE_TABLE'),'cenová tabulka');
check(contains(seriesDomain,'estimateSeriesBudget'),'odhad ceny série');
check(contains(seriesDomain,'registerUsage'),'evidence skutečné spotřeby');
check(contains(seriesDomain,'DAILY_USAGE_KEY'),'denní přehled spotřeby');

check(contains(distribution,'distributionReadyResults'),'výběr schválených výsledků');
check(contains(distribution,'r.approved&&r.validation?.ok&&isValidEmail(r.email)'),'distribuce jen validních schválených výsledků');
check(contains(distribution,'duplicitní e-mail'),'kontrola duplicitních e-mailů');
check(contains(distribution,"action==='send'"),'koncepty i přímé odeslání');
check(contains(distribution,"extractResultViewSection(r.result,'student')"),'e-mail používá studentský výstup');
check(contains(distribution,'Přímé odeslání'),'potvrzení nevratné akce');
check(contains(distribution,"form.target='_blank'")&&contains(distribution,"input.name='payload'"),'kompatibilní formulářová distribuce');
check(contains(distribution,'submitted-unconfirmed'),'kompatibilní režim neoznačuje zprávy falešně jako doručené');

check(contains(appsScript,"const MAX_ITEMS = 20"),'Apps Script limit 20');
check(contains(appsScript,'function doPost(e)'),'Apps Script POST endpoint');
check(contains(appsScript,'e.parameter && e.parameter.payload'),'Apps Script přijímá kompatibilní formulářový POST');
check(contains(appsScript,'GmailApp.createDraft'),'Apps Script vytváří koncepty');
check(contains(appsScript,'GmailApp.sendEmail'),'Apps Script umí odeslat');
check(contains(appsScript,"getProperty('SHARED_SECRET')"),'Apps Script tajemství v Script Properties');
check(contains(appsScript,'duplicitní e-mail'),'Apps Script kontroluje duplicity');
check(contains(appsScript,'item.approved'),'Apps Script kontroluje schválení');

check(contains(backend,"BACKEND_CONTRACT_VERSION='1.0'"),'backend kontrakt 1.0');
check(contains(backend,"backendRequest('/health'"),'backend health check');
check(contains(backend,'`essay-evaluator/${APP_VERSION}`'),'backendový klient používá APP_VERSION');
check(studioRegistration.fallbackManifest?.version==='__APP_VERSION__'&&contains(text('scripts/patch-ai-studio.mjs'),"replaceAll('__APP_VERSION__',pkg.version)"),'fallback registrace AI Studia přebírá verzi z package.json');
check(contains(backend,"backendRequest('/v1/evaluation-series'"),'backend vytvoření série');
check(contains(backend,'/v1/evaluation-series/${encodeURIComponent(jobId)}'),'backend stav série');
check(contains(openapi,'maxItems: 20'),'OpenAPI limit 20');
check(contains(openapi,'/v1/evaluation-series/{jobId}'),'OpenAPI stavový endpoint');


let generatedDocxOk=false,generatedDocxLogo=false,generatedDocxStyles=false,generatedDocxSignature=false;
try{
  const docxContext=vm.createContext({console,Blob,Uint8Array,ArrayBuffer,TextEncoder,TextDecoder,setTimeout,clearTimeout,setImmediate,clearImmediate,Promise,URL});
  docxContext.window=docxContext;docxContext.self=docxContext;docxContext.global=docxContext;
  vm.runInContext(text('src/vendor/jszip.min.js'),docxContext,{timeout:5000});
  docxContext.ensureJSZip=async()=>docxContext.JSZip;
  docxContext.state={reportSettings:{signature:'Testovací podpis'},series:{teacherName:'Testovací učitel'}};
  docxContext.APP_VERSION=pkg.version;
  docxContext.seriesDisplayName=()=> 'Testovací série';
  docxContext.xmlEscape=value=>String(value??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
  const logoBytes=readFileSync(join(SRC,'assets','ghrab-logo.png'));
  docxContext.location={href:'http://127.0.0.1/'};
  docxContext.fetch=async()=>({ok:true,arrayBuffer:async()=>logoBytes.buffer.slice(logoBytes.byteOffset,logoBytes.byteOffset+logoBytes.byteLength)});
  const docxFunctions=reportEnhancements.slice(reportEnhancements.indexOf('function docxRun'),reportEnhancements.indexOf('function reportPrintCss'));
  vm.runInContext(docxFunctions,docxContext,{timeout:5000});
  docxContext.__markdown='# Hodnocení\n\n| Položka | Hodnota |\n|---|---|\n| Body | 20/24 |\n\n## Doporučení\n\n- Opravit větu.';
  const blob=await vm.runInContext("createDocxBlob('Testovací report',__markdown)",docxContext,{timeout:10000});
  const zip=await docxContext.JSZip.loadAsync(await blob.arrayBuffer());
  const documentXml=await zip.file('word/document.xml')?.async('string');
  generatedDocxOk=blob.size>1000&&!!documentXml&&!!zip.file('[Content_Types].xml')&&!!zip.file('word/_rels/document.xml.rels');
  generatedDocxLogo=!!zip.file('word/media/ghrab-logo.png')&&String(documentXml).includes('rIdLogo');
  generatedDocxStyles=!!zip.file('word/styles.xml')&&String(documentXml).includes('Heading2');
  generatedDocxSignature=String(documentXml).includes('Testovací podpis');
}catch(error){console.error('DOCX dynamický test:',error);}
check(generatedDocxOk,'vygenerovaný DOCX má platné základní části balíku');
check(generatedDocxLogo,'vygenerovaný DOCX obsahuje a používá školní logo');
check(generatedDocxStyles,'vygenerovaný DOCX obsahuje styly a strukturované nadpisy');
check(generatedDocxSignature,'vygenerovaný DOCX obsahuje volitelný podpis');

check(manifest.schema==='ai-studio-app-manifest-v1','schema AI Studio manifestu');
check(manifest.id==='essay-evaluator','ID aplikace essay-evaluator');
check(manifest.compatibility.studioMinVersion==='0.6.3','manifest vyžaduje AI Studio 0.6.3');
check(studioRegistration.fallbackManifest?.icon==='assets/apps/essay-evaluator-v2.png','fallback registrace používá novou lokální ikonu portálu');
check(studioRegistration.accessPolicy?.trainingCode==='HOD-01','registrace používá školení HOD-01');
check(studioRegistration.permission?.serverClaim==='app.essay-evaluator.use','registrace používá správný server claim');
if(contains(deployWorkflow,'event_type=app-updated')){pass++;console.log('PASS','workflow oznamuje aktualizaci událostí app-updated');}else{console.warn('WARN','volitelné oznámení AI Studiu není v lokálním workflow; nasazení aplikace tím není blokováno');}
check(!/produk|production/i.test(JSON.stringify(manifest.status)),'pilotní status');
check(manifest.limits.typicalSeriesSize===15,'manifest typická série 15');
check(manifest.limits.maxSeriesSize===20,'manifest maximum 20');
for(const capability of ['versioned-rubric','deterministic-scoring','structured-output','validation-gate','class-roster','zip-import','multipage-work','handwriting-transcription-review','student-pairing','evaluation-queue','batch-api','gmail-distribution','usage-cost-tracking','backend-ready','professional-reports','a4-preview','styled-docx','teacher-comment-bank','anonymous-class-analytics','pseudonymous-progress','offline-docx-import']){
  check(manifest.capabilities.includes(capability),`manifest capability ${capability}`);
}

check(template.includes('data-ghrab-access="checking"'),'stránka začíná v checking režimu');
check(access.includes("const APP_ID = 'essay-evaluator'"),'access guard používá správné ID');
check(access.includes('guardModule.protectApp(APP_ID'),'centrální access guard zůstává autoritou');
check(access.includes("await import('./app.js')"),'aplikace se načítá dynamicky po rozhodnutí brány');
check(exists('src/access-gate.css')&&contains(template,'href="access-gate.css"')&&!contains(template,'access/access-gate.css'),'vzhled brány je lokální a cacheovatelný');
check(contains(access,'IMPORT_TIMEOUT_MS')&&contains(access,'CHECK_TIMEOUT_MS')&&contains(access,'clearTimeout(timer)'),'brána má timeout a uklízí časovač');
check(!contains(access,'Nouzový offline režim')&&!contains(access,'addOfflineWarning'),'brána nemá fail-open offline režim');
check(contains(access,"ghrabAccess='denied'")&&!/catch\s*\([^)]*\)\s*\{[\s\S]{0,350}loadApplication\s*\(/.test(access),'chyba a timeout guardu zůstávají fail-closed');
check(contains(access,"if(allowed) await loadApplication();")&&contains(access,"else document.documentElement.dataset.ghrabAccess='denied'"),'explicitní zamítnutí přístupu se neobchází');
check((js.match(/\binit\(\);/g)||[]).length===1,'právě jedno volání init()');
check(bootstrap.trim().startsWith('init();'),'bootstrap začíná init()');
check(contains(bootstrap,"document.documentElement.dataset.appReady='1'"),'ready příznak');
check(contains(bootstrap,'window.__HODNOTITEL_READY__=true'),'globální smoke-test příznak');
for(const uniqueName of ['createDocxBlob','printPdfExport','reportHeaderHtml','renderReportDocument']){
  const declarations=(js.match(new RegExp('(?:async\\s+)?function\\s+'+uniqueName+'\\s*\\(','g'))||[]).length;
  check(declarations===1,`jediná implementace ${uniqueName}`);
}

for(const dead of ['buildStateForStorageLegacy','saveStateLegacy','loadStateLegacy','renderProgressLegacy','renderBatchListLegacy','runEvaluationLegacy','runBatchEvaluationLegacy','buildPromptLegacy']){
  check(!contains(js,`function ${dead}`),`odstraněn mrtvý kód ${dead}`);
}

check(!/AIza[0-9A-Za-z_-]{20,}/.test(js+appsScript+text('README.md')),'bez vloženého Gemini API klíče');
check(!/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}/.test(js+body),'bez vložené Apps Script URL');
check(!contains(appsScript,'SHARED_SECRET ='),'bez vloženého sdíleného tajemství');

const changelogBlock=js.slice(js.indexOf('const CHANGELOG = ['),js.indexOf('];\nfunction latestChangelog'));
check((changelogBlock.match(/\{version:/g)||[]).length===10,'UI changelog má přesně 10 verzí');
check(changelogBlock.trimStart().startsWith("const CHANGELOG = [\n  {version:APP_VERSION+' AI STUDIO EDITION'"),'changelog začíná aktuální APP_VERSION');
check(contains(js,'CHANGELOG_MAX_ENTRIES = 10'),'limit changelogu 10');

for(const path of [
  'README.md','CHANGELOG.md','QA_REPORT.md','docs/ARCHITEKTURA.md','docs/BEZPECNOST.md','docs/ZMENY-A-OPRAVY.md','docs/PRACOVNI-POSTUP.md','docs/NAHRANI-NA-GITHUB.md',
  'integrations/gmail-apps-script/README.md','integrations/backend-contract/README.md','integrations/backend-contract/openapi.yaml','src/rubric/rubric-v2026.04.27-r1.json'
])check(exists(path),`dokument/soubor ${path}`);

check(contains(build,"'rubric'"),'build kopíruje rubriku');
check(contains(build,"execFileSync(process.execPath,['--check'"),'build kontroluje dist/app.js');
check(contains(build,"manifest.limits?.maxSeriesSize!==20"),'build kontroluje limit manifestu');
check(contains(build,"rubric.version!=='2026.04.27-r1'"),'build kontroluje verzi rubriky');


check(existsSync(join(ROOT,'src','manual','index.html')),'Zdrojový interaktivní manuál existuje.');
const manualSource=readFileSync(join(ROOT,'src','manual','index.html'),'utf8');
check(manualSource.includes('data-ghrab-access-bootstrap')&&manualSource.includes('const APP_ID="essay-evaluator"'),'Manuál dědí oprávnění Hodnotitele z AI Studia.');
check(readFileSync(join(ROOT,'src','body.html'),'utf8').includes('manual-launch-btn'),'Záhlaví obsahuje samostatné tlačítko interaktivního manuálu.');


check(exists('package-lock.json'),'repozitář obsahuje lockfile pro npm ci a npm audit');
check(exists('qa/qa-manifest.json')&&JSON.parse(text('qa/qa-manifest.json')).standard==='GHRAB-QA-1.0.2','QA manifest používá GHRAB QA 1.0.2');
check(contains(deployWorkflow,'npm run qa:release')&&contains(deployWorkflow,'playwright install'),'GitHub Actions spouští úplnou QA bránu s Chromium');
check(!/\(\?(?:<=|<!)/.test(js),'runtime neobsahuje regex lookbehind');

console.log(`\n${pass} PASS / ${fail} FAIL`);
if(fail)process.exit(1);
