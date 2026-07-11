#!/usr/bin/env node
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
  mkdirSync,
  cpSync,
  existsSync
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const SRC=join(ROOT,'src');
const DIST=join(ROOT,'dist');
const fail=message=>{console.error('[build] CHYBA: '+message);process.exit(1);};
const log=message=>console.log('[build] '+message);

rmSync(DIST,{recursive:true,force:true});
mkdirSync(DIST,{recursive:true});

const jsFiles=readdirSync(join(SRC,'js')).filter(f=>f.endsWith('.js')).sort();
const cssFiles=readdirSync(join(SRC,'styles')).filter(f=>f.endsWith('.css')).sort();
const template=readFileSync(join(SRC,'index.template.html'),'utf8');
const body=readFileSync(join(SRC,'body.html'),'utf8');
const styles=cssFiles.map(f=>`/* ${f} */\n${readFileSync(join(SRC,'styles',f),'utf8')}`).join('\n');
let app=jsFiles.map(f=>`/* ${f} */\n${readFileSync(join(SRC,'js',f),'utf8')}`).join('\n');

const version=(app.match(/version:'([0-9.]+)'/)||[])[1];
if(!version)fail('Nelze zjistit RELEASE.version.');
const sw=readFileSync(join(SRC,'sw.js'),'utf8');
const swVersion=(sw.match(/APP_VERSION='([0-9.]+)'/)||[])[1];
if(version!==swVersion)fail(`Verze aplikace ${version} nesedí se sw.js ${swVersion}.`);
if(!app.includes(`version:'${version} AI STUDIO EDITION'`))fail('První záznam changelogu neobsahuje aktuální verzi.');
if((app.match(/\binit\(\);/g)||[]).length!==1)fail('Aplikace musí mít právě jedno bootstrap volání init().');

let buildHash='';
try{
  buildHash=execFileSync('git',['rev-parse','--short','HEAD'],{cwd:ROOT,stdio:['ignore','pipe','ignore']}).toString().trim();
}catch(_){/* ZIP nemusí být git repozitář. */}
if(buildHash)app=app.replace("build:'__BUILD__'",`build:'${buildHash}'`);

const html=template
  .replace('/*==HODNOTITEL_STYLES==*/',styles)
  .replace('<!--==HODNOTITEL_BODY==-->',body);
if(/HODNOTITEL_(STYLES|BODY)/.test(html))fail('V indexu zůstal build token.');

writeFileSync(join(DIST,'index.html'),html);
writeFileSync(join(DIST,'app.js'),app);

for(const name of ['access-bootstrap.js','manifest-v1.3.4.webmanifest','manifest.webmanifest','sw.js']){
  cpSync(join(SRC,name),join(DIST,name));
}
for(const name of ['assets','icons','vendor','rubric']){
  if(existsSync(join(SRC,name)))cpSync(join(SRC,name),join(DIST,name),{recursive:true});
}

const manifestText=readFileSync(join(SRC,'studio-manifest.template.json'),'utf8')
  .replaceAll('__APP_VERSION__',version)
  .replaceAll('__BUILD_TIME__',new Date().toISOString());
const manifest=JSON.parse(manifestText);
if(/produk|production/i.test(`${manifest.status?.cs||''} ${manifest.status?.en||''}`)){
  fail('Manifest nesmí před schválením deklarovat produkční provoz.');
}
if(manifest.limits?.maxSeriesSize!==20)fail('Manifest musí deklarovat limit 20 prací.');
writeFileSync(join(DIST,'studio-manifest.json'),manifestText);
writeFileSync(join(DIST,'.nojekyll'),'');

try{
  execFileSync(process.execPath,['--check',join(DIST,'app.js')],{stdio:'pipe'});
}catch(error){
  fail('Výsledný dist/app.js neprošel syntaktickou kontrolou: '+String(error.stderr||error.message));
}

const rubricPath=join(DIST,'rubric','rubric-v2026.04.27-r1.json');
if(!existsSync(rubricPath))fail('Build neobsahuje verzovanou rubriku.');
const rubric=JSON.parse(readFileSync(rubricPath,'utf8'));
if(rubric.version!=='2026.04.27-r1')fail('Nesouhlasí verze rubriky v dist.');

log(`HOTOVO · verze ${version} · ${jsFiles.length} JS modulů · ${cssFiles.length} CSS modulů · rubrika ${rubric.version}`);
