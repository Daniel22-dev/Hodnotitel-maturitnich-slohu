#!/usr/bin/env node
import {readFileSync,writeFileSync,readdirSync,rmSync,mkdirSync,cpSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');const SRC=join(ROOT,'src');const DIST=join(ROOT,'dist');
const fail=message=>{console.error('[build] CHYBA: '+message);process.exit(1);};const log=message=>console.log('[build] '+message);
const pkg=JSON.parse(readFileSync(join(ROOT,'package.json'),'utf8'));const version=String(pkg.version||'').trim();if(!/^\d+\.\d+\.\d+$/.test(version))fail('package.json neobsahuje platnou semver verzi.');
const inject=text=>String(text).replaceAll('__APP_VERSION__',version);const readInjected=path=>inject(readFileSync(path,'utf8'));
rmSync(DIST,{recursive:true,force:true});mkdirSync(DIST,{recursive:true});
const jsFiles=readdirSync(join(SRC,'js')).filter(f=>f.endsWith('.js')).sort();const cssFiles=readdirSync(join(SRC,'styles')).filter(f=>f.endsWith('.css')).sort();
const template=readInjected(join(SRC,'index.template.html'));const body=readInjected(join(SRC,'body.html'));const styles=cssFiles.map(f=>`/* ${f} */\n${readInjected(join(SRC,'styles',f))}`).join('\n');let app=jsFiles.map(f=>`/* ${f} */\n${readInjected(join(SRC,'js',f))}`).join('\n');
if(!app.includes(`version:'${version}'`))fail('RELEASE.version nebyla injektována z package.json.');if((app.match(/\binit\(\);/g)||[]).length!==1)fail('Aplikace musí mít právě jedno bootstrap volání init().');
let buildHash='';try{buildHash=execFileSync('git',['rev-parse','--short','HEAD'],{cwd:ROOT,stdio:['ignore','pipe','ignore']}).toString().trim();}catch(_){}if(buildHash)app=app.replace("build:'__BUILD__'",`build:'${buildHash}'`);
const html=template.replace('/*==HODNOTITEL_STYLES==*/',styles).replace('<!--==HODNOTITEL_BODY==-->',body);if(/HODNOTITEL_(STYLES|BODY)|__APP_VERSION__/.test(html+app))fail('V sestavení zůstal build token.');
writeFileSync(join(DIST,'index.html'),html);writeFileSync(join(DIST,'app.js'),app);
for(const name of ['access-bootstrap.js','access-gate.css','manifest.webmanifest','sw.js'])writeFileSync(join(DIST,name),readInjected(join(SRC,name)));
for(const name of ['assets','icons','vendor','rubric'])if(existsSync(join(SRC,name)))cpSync(join(SRC,name),join(DIST,name),{recursive:true});
const manifestText=readInjected(join(SRC,'studio-manifest.template.json')).replaceAll('__BUILD_TIME__',new Date().toISOString());const manifest=JSON.parse(manifestText);if(/produk|production/i.test(`${manifest.status?.cs||''} ${manifest.status?.en||''}`))fail('Manifest nesmí před schválením deklarovat produkční provoz.');if(manifest.limits?.maxSeriesSize!==20)fail('Manifest musí deklarovat limit 20 prací.');writeFileSync(join(DIST,'studio-manifest.json'),manifestText);writeFileSync(join(DIST,'.nojekyll'),'');
const pwa=JSON.parse(readFileSync(join(DIST,'manifest.webmanifest'),'utf8'));if(pwa.id!=='/Hodnotitel-maturitnich-slohu/'||pwa.start_url!=='./')fail('PWA identita a start_url musí zůstat stabilní.');
try{execFileSync(process.execPath,['--check',join(DIST,'app.js')],{stdio:'pipe'});execFileSync(process.execPath,['--check',join(DIST,'access-bootstrap.js')],{stdio:'pipe'});}catch(error){fail('Výsledný JavaScript neprošel syntaktickou kontrolou: '+String(error.stderr||error.message));}
const rubricPath=join(DIST,'rubric','rubric-v2026.04.27-r1.json');if(!existsSync(rubricPath))fail('Build neobsahuje verzovanou rubriku.');const rubric=JSON.parse(readFileSync(rubricPath,'utf8'));if(rubric.version!=='2026.04.27-r1')fail('Nesouhlasí verze rubriky v dist.');
log(`HOTOVO · verze ${version} · ${jsFiles.length} JS modulů · ${cssFiles.length} CSS modulů · rubrika ${rubric.version}`);
