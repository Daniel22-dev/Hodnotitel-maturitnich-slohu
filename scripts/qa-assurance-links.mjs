#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve('.');
const args = process.argv.slice(2);
const has = (x) => args.includes(x);
const value = (name) => { const i=args.indexOf(name); return i>=0 ? args[i+1] : null; };
const sha256File = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sha256Text = (s) => crypto.createHash('sha256').update(s).digest('hex');
const json = (p) => JSON.parse(fs.readFileSync(p,'utf8'));
const isHash = (v) => /^[a-f0-9]{64}$/i.test(String(v||''));

function resolveFiles(overrides={}) {
  const sec = path.join(ROOT,'security','garp251');
  return {
    manifest: overrides.manifest || value('--release-integrity') || path.join(sec,'PREP-RELEASE-INTEGRITY.json'),
    sbom: overrides.sbom || path.join(sec,'sbom.cdx.json'),
    evidence: overrides.evidence || path.join(sec,'security-evidence-manifest.json'),
    provenance: overrides.provenance || path.join(sec,'build-provenance-prep.json'),
    registry: overrides.registry || path.join(sec,'PREP-RELEASE-REGISTRY.json'),
    trustRoot: overrides.trustRoot || path.join(sec,'PREP-ONLY-DISPOSABLE-TRUST-ROOT.json'),
    lockfile: overrides.lockfile || path.join(ROOT,'package-lock.json'),
    deploymentZip: overrides.deploymentZip || value('--deployment-zip') || process.env.GHRAB_ASSURANCE_DEPLOYMENT_ZIP || null,
  };
}

function verify(files) {
  const required = ['manifest','sbom','evidence','provenance','registry','trustRoot','lockfile'];
  const missing = required.filter(k => !files[k] || !fs.existsSync(files[k]));
  if (missing.length) return {status:'failed',checks:[],errors:missing.map(k=>`missing:${k}:${files[k]||''}`)};
  const m=json(files.manifest), e=json(files.evidence), p=json(files.provenance), r=json(files.registry), t=json(files.trustRoot);
  const app=(r.apps||[]).find(x=>x.appId===m.appId);
  const key=(t.keys||[]).find(x=>x.keyId===m.signature?.keyId);
  const checks=[];
  const add=(id,ok,actual,expected)=>checks.push({id,ok:Boolean(ok),actual:String(actual??''),expected:String(expected??'')});

  add('manifest.sbomSha256', m.sbomSha256===sha256File(files.sbom), m.sbomSha256, sha256File(files.sbom));
  add('manifest.evidenceManifestSha256', m.evidenceManifestSha256===sha256File(files.evidence), m.evidenceManifestSha256, sha256File(files.evidence));
  const sourceLink = m.sourcePackageSha256;
  add('manifest.sourcePackageSha256', isHash(sourceLink) && sourceLink===p.source?.sourcePackageSha256 && sourceLink===e.sourcePackageSha256,
      `${sourceLink}|${p.source?.sourcePackageSha256}|${e.sourcePackageSha256}`, 'same 64-hex corrective-input source hash in manifest/provenance/evidence');

  if (files.deploymentZip && fs.existsSync(files.deploymentZip)) {
    const zipHash=sha256File(files.deploymentZip);
    add('provenance.subject.sha256', p.subject?.sha256===zipHash, p.subject?.sha256, zipHash);
  } else {
    add('provenance.subject.sha256', false, p.subject?.sha256, 'actual deployment ZIP required via --deployment-zip');
  }
  add('provenance.releaseIntegrity.artifactDigest', p.releaseIntegrity?.artifactDigest===m.artifactDigest, p.releaseIntegrity?.artifactDigest, m.artifactDigest);
  add('provenance.lockfileSha256', p.invocation?.lockfileSha256===sha256File(files.lockfile), p.invocation?.lockfileSha256, sha256File(files.lockfile));
  add('registry.artifactDigest', app?.artifactDigest===m.artifactDigest, app?.artifactDigest, m.artifactDigest);
  add('registry.version', app?.approvedVersion===m.version, app?.approvedVersion, m.version);
  add('registry.keyId', app?.keyId===m.signature?.keyId, app?.keyId, m.signature?.keyId);
  add('trustRoot.keyId', Boolean(key), m.signature?.keyId, key?.keyId||'missing');

  const failed=checks.filter(x=>!x.ok);
  return {schema:'ghrab-app-assurance-links-verification-v2',status:failed.length?'failed':'passed',summary:{total:checks.length,passed:checks.length-failed.length,failed:failed.length},checks};
}

async function selftest() {
  const d=await fsp.mkdtemp(path.join(os.tmpdir(),'assurance-links-selftest-'));
  try {
    const wr=(name,data)=>fs.writeFileSync(path.join(d,name),typeof data==='string'?data:JSON.stringify(data,null,2)+'\n');
    wr('sbom.json','{"bomFormat":"CycloneDX"}\n');
    wr('evidence.json',{sourcePackageSha256:'a'.repeat(64)});
    wr('lock.json','{"lockfileVersion":3}\n');
    wr('deployment.zip','synthetic-deployment-zip');
    const artifact='b'.repeat(64), keyId='test-key', version='9.9.9', appId='synthetic';
    const manifest={appId,version,sourcePackageSha256:'a'.repeat(64),artifactDigest:artifact,sbomSha256:sha256File(path.join(d,'sbom.json')),evidenceManifestSha256:sha256File(path.join(d,'evidence.json')),signature:{keyId}};
    wr('manifest.json',manifest);
    wr('provenance.json',{subject:{sha256:sha256File(path.join(d,'deployment.zip'))},source:{sourcePackageSha256:'a'.repeat(64)},invocation:{lockfileSha256:sha256File(path.join(d,'lock.json'))},releaseIntegrity:{artifactDigest:artifact}});
    wr('registry.json',{apps:[{appId,approvedVersion:version,artifactDigest:artifact,keyId}]});
    wr('trust.json',{keys:[{keyId}]});
    const files=resolveFiles({manifest:path.join(d,'manifest.json'),sbom:path.join(d,'sbom.json'),evidence:path.join(d,'evidence.json'),provenance:path.join(d,'provenance.json'),registry:path.join(d,'registry.json'),trustRoot:path.join(d,'trust.json'),lockfile:path.join(d,'lock.json'),deploymentZip:path.join(d,'deployment.zip')});
    const good=verify(files);
    manifest.sbomSha256='0'.repeat(64); wr('manifest.json',manifest);
    const bad=verify(files);
    const ok=good.status==='passed' && bad.status==='failed' && bad.checks.some(x=>x.id==='manifest.sbomSha256'&&!x.ok);
    console.log(JSON.stringify({schema:'ghrab-app-assurance-links-selftest-v1',status:ok?'passed':'failed',positive:good.summary,negative:bad.summary},null,2));
    process.exit(ok?0:1);
  } finally { await fsp.rm(d,{recursive:true,force:true}); }
}

if (has('--selftest')) await selftest();
const result=verify(resolveFiles());
const out=value('--json-out');
if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify(result,null,2));
process.exit(result.status==='passed'?0:1);
