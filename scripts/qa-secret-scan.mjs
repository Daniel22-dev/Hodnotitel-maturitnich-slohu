import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {containsConfidentialExamJson} from './lib/confidential-exam-json.mjs';

const ROOT=fileURLToPath(new URL('..',import.meta.url));
const IGNORE_DIRS=new Set(['.git','node_modules','qa-results','test-results']);
const IGNORE_FILES=new Set(['qa-secret-scan.mjs']);
// Exact upstream GARP selftest contains synthetic secret sentinels by design.
// It is exempt from value-pattern findings only while byte-identical to the pinned R2 file.
const TRUSTED_SYNTHETIC_SECRET_FIXTURES=new Map([
  ['security/garp251/tools/selftest-garp251.mjs','1e52035cd256ea2e5e6a10d91b7d8a3b5bdf00a55922b8dcb857baaaf789fa15'],
]);
const sha256=data=>createHash('sha256').update(data).digest('hex');
const TEXT_EXTS=new Set(['.js','.mjs','.cjs','.json','.html','.css','.md','.txt','.yml','.yaml','.webmanifest','.xml','.svg']);
const SECRET_FILE_RE=/(^|\/)(?:\.env(?:\.[^/]+)?|id_rsa|id_ed25519|[^/]+\.(?:pem|p12|pfx|key))$/i;
const PATTERNS=[
  ['Google API key',/AIza[A-Za-z0-9_-]{25,}/g],
  ['OpenAI-style key',/sk-[A-Za-z0-9_-]{20,}/g],
  ['GitHub PAT',/(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/g],
  ['AWS access key',/AKIA[0-9A-Z]{16}/g],
  ['Slack token',/xox[baprs]-[A-Za-z0-9-]{20,}/g],
  ['Private key block',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];
const findings=[];
function walk(dir){
  for(const name of readdirSync(dir)){
    if(IGNORE_DIRS.has(name)) continue;
    const abs=join(dir,name); const st=statSync(abs); const rel=relative(ROOT,abs).replaceAll('\\','/');
    if(st.isDirectory()){walk(abs);continue;}
    if(IGNORE_FILES.has(name)) continue;
    if(SECRET_FILE_RE.test(rel)){findings.push(`${rel}: citlivý typ souboru`);continue;}
    if(!TEXT_EXTS.has(extname(name).toLowerCase()) && !['Dockerfile','Makefile'].includes(name)) continue;
    const raw=readFileSync(abs); const text=raw.toString('utf8');
    if(extname(name).toLowerCase()==='.json'&&containsConfidentialExamJson(text))findings.push(`${rel}: důvěrný obsah ostrého zadání nesmí být commitnut do repozitáře`);
    const trustedFixtureHash=TRUSTED_SYNTHETIC_SECRET_FIXTURES.get(rel);
    const trustedSyntheticFixture=Boolean(trustedFixtureHash)&&sha256(raw)===trustedFixtureHash;
    for(const [label,re] of PATTERNS){re.lastIndex=0;if(re.test(text)&&!trustedSyntheticFixture)findings.push(`${rel}: ${label}`);}
  }
}
walk(ROOT);
if(findings.length){console.error('SECRET SCAN FAIL');findings.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('SECRET SCAN PASS: 0 nálezů');
