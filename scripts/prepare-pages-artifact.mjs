#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// The Platform P3 post-processor intentionally exposes additional aliases in
// some build artifacts. AI Studio deployment evidence, however, has one
// canonical public contract. Re-assert it at the final publication boundary so
// the exact bytes uploaded to Pages are safe for automated release promotion.
await import('./fix-studio-manifest-platform-contract.mjs');

const root=process.cwd();
const dist=path.join(root,'dist');
if(!fs.existsSync(dist)) throw new Error('Chybí dist/. Nejprve spusť build a QA.');
const explicit=[
  'quality-report.json','qa-p3-browser-report.json','qa-p3-reflow-runtime-report.json','qa-p3-axe-report.json',
  'qa-p4-a11y-report.json','qa-p4-release-report.json','qa-p5-runtime-report.json','qa-p5-xss-sinks-report.json',
  'qa-p5-axe-runtime-report.json','qa-p5-release-report.json','qa-p5-acceptance-report.json','qa-suite-session-report.json','config/quality-manifest.json'
];
for(const rel of explicit) fs.rmSync(path.join(dist,...rel.split('/')),{force:true});

// actions/upload-pages-artifact does not preserve the root .nojekyll dotfile in
// the published TAR. Remove it before computing GARP release-integrity so the
// declared file set and digest describe the exact bytes Pages actually receives.
fs.rmSync(path.join(dist,'.nojekyll'),{force:true});

function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?walk(p):[p]});}
const forbidden=walk(dist).filter(file=>{
  const rel=path.relative(dist,file).split(path.sep).join('/');
  return /(?:^|\/)qa-[^/]*\.json$/i.test(rel)||/(?:^|\/)(?:quality-report|quality-manifest)\.json$/i.test(rel);
});
if(forbidden.length) throw new Error(`Ve veřejném Pages artefaktu zůstaly QA soubory: ${forbidden.map(f=>path.relative(dist,f)).join(', ')}`);

const studioManifestPath=path.join(dist,'studio-manifest.json');
if(!fs.existsSync(studioManifestPath)) throw new Error('Pages artifact FAIL: chybí studio-manifest.json.');
const studioManifest=JSON.parse(fs.readFileSync(studioManifestPath,'utf8'));
const platform=studioManifest.platform||{};
const requiredPlatformKeys=['schema','contract','requiredPlatformRange','platformVersion','brandVersion','themeContract','swContract','studioBridge','artifactEnvelope','storagePrefix','cacheName'];
const missingPlatformKeys=requiredPlatformKeys.filter(key=>platform[key]==null||platform[key]==='');
if(missingPlatformKeys.length) throw new Error(`Pages artifact FAIL: studio-manifest platform contract není kanonický; chybí ${missingPlatformKeys.join(', ')}.`);
if(platform.schema!=='ghrab-platform-app-integration-v1'||platform.contract!=='ghrab-platform-v1') throw new Error('Pages artifact FAIL: studio-manifest má neplatný platform contract.');
if(platform.storagePrefix!==`ghrab.${studioManifest.id}.`) throw new Error('Pages artifact FAIL: studio-manifest má neplatný storagePrefix.');
if(platform.cacheName!==`ghrab-${studioManifest.id}-v${studioManifest.version}`) throw new Error('Pages artifact FAIL: studio-manifest cacheName neodpovídá publikované verzi.');

// Bind the exact public bytes to the current app/version/source commit using the
// existing GARP 2.5.1 release-integrity v2 contract. This stays explicitly
// TRANSITIONAL until a production signing key is available; no fake signature is
// asserted merely to turn CI green.
await import('./create-pages-release-identity.mjs');

// Povinná regresní assertion po VŠECH post-processing krocích: release-integrity,
// Studio manifest, SBOM, provenance a evidence musí stále popisovat tentýž release.
// Fail-closed – bez tohoto ověření nesmí artefakt odejít na Pages.
const chain = spawnSync(process.execPath, [path.join(root, 'scripts', 'verify-release-chain.mjs')], {
  cwd: root,
  encoding: 'utf8',
});
if (chain.status !== 0) {
  throw new Error(`Pages artifact FAIL: release chain regression neprošla.\n${chain.stdout || ''}\n${chain.stderr || ''}`);
}
console.log('[release-chain] PASS · release-integrity, manifest, SBOM, provenance a evidence popisují tentýž release.');

console.log('Pages artifact clean: QA-only reporty a nepublikovaný .nojekyll byly odstraněny, Studio manifest je kanonický a GARP release identity přesně váže veřejný artefakt na source commit.');
