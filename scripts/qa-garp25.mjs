#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve('.');
const tools = path.join(root, 'security', 'garp251', 'tools');
const critical = path.join(root, 'security', 'garp251', 'security-critical-assets.json');
const reportDir = path.join(root, 'qa-results');
fs.mkdirSync(reportDir, { recursive: true });
const steps = [];
const record = (id, ok, detail = '') => steps.push({ id, ok: Boolean(ok), detail: String(detail).slice(0, 4000) });

function runNode(id, script, args = [], expect = 0) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
  const output = `${r.stdout || ''}${r.stderr || ''}`.trim();
  record(id, r.status === expect, `exit=${r.status}; expected=${expect}; ${output}`);
  return { ...r, output };
}

const selftest = runNode('tooling.selftest-43', path.join(tools, 'selftest-garp251.mjs'));
if (selftest.status === 0) {
  try { record('tooling.selftest-status-pass', JSON.parse(selftest.stdout).status === 'PASS'); }
  catch { record('tooling.selftest-status-pass', false, 'invalid JSON'); }
}

const publicSw = path.join(root, 'dist', 'sw.js');
const publicDistPresent = fs.existsSync(publicSw);
record('build.public-dist-present', publicDistPresent, publicDistPresent ? '' : 'dist/sw.js missing - run npm run build first');
if (!publicDistPresent) {
  const pkg = JSON.parse(await fsp.readFile(path.join(root, 'package.json'), 'utf8'));
  const report = {schema:'ghrab-garp251-shield-prep-qa-v1',appId:'essay-evaluator',appVersion:pkg.version,toolingRevision:'GARP-2.5.1-R2',profile:'SHIELD-PREP',syntheticDataOnly:true,generatedAt:new Date().toISOString(),status:'failed',summary:{total:steps.length,passed:steps.filter(s=>s.ok).length,failed:steps.filter(s=>!s.ok).length},steps};
  await fsp.writeFile(path.join(reportDir, 'garp251-shield-prep.json'), JSON.stringify(report, null, 2) + '\n');
  console.error(JSON.stringify({status:'failed',summary:report.summary,failed:['build.public-dist-present']},null,2));
  process.exit(1);
}

// Derive the school profile from the exact public dist already under test; do not rebuild source here.
runNode('build.school-profile', path.join(root, 'scripts', 'build-school-profile.mjs'));

for (const name of ['dist', 'dist-school-server']) {
  const deploy = path.join(root, name);
  runNode(`gh02.sw-security-freeze.${name}`, path.join(tools, 'check-sw-security-freeze.mjs'), [path.join(deploy, 'sw.js'), deploy, critical]);
  runNode(`deployment.leak-scan.${name}`, path.join(tools, 'scan-deployment-leaks.mjs'), [deploy]);
}

runNode('gh02.sw-boundary-behavioral', path.join(root, 'scripts', 'qa-sw-boundary.mjs'));
runNode('assurance-links.verifier-selftest', path.join(root, 'scripts', 'qa-assurance-links.mjs'), ['--selftest']);

try {
  const school = JSON.parse(await fsp.readFile(path.join(root, 'dist-school-server', 'config', 'deployment.json'), 'utf8'));
  record('gh05.school.auth-server-session', school.authMode === 'server-session', school.authMode);
  record('gh05.school.ai-school-gateway', school.aiTransport === 'school-gateway', school.aiTransport);
  record('gh05.school.local-provider-keys-denied', school.features?.allowLocalProviderKeys === false, String(school.features?.allowLocalProviderKeys));
  record('gh05.school.offline-access-disabled', Number(school.access?.maxOfflineAgeHours) === 0, String(school.access?.maxOfflineAgeHours));
  record('gh05.school.same-origin-api', String(school.apiBaseUrl || '').startsWith('/') && !/^https?:/i.test(String(school.apiBaseUrl || '')), school.apiBaseUrl || '');
} catch (e) { record('gh05.school.profile-readable', false, e.message); }

try {
  const list = JSON.parse(await fsp.readFile(critical, 'utf8'));
  const sw = await fsp.readFile(path.join(root, 'src', 'sw.js'), 'utf8');
  const missing = list.filter((rel) => !['release-integrity.json','release-integrity.sig'].includes(rel) && !sw.includes(`'${rel}'`) && !sw.includes(`\"${rel}\"`));
  record('gh02.critical-list-boundary-sync', missing.length === 0, missing.join(','));
  record('gh02.cache-default-deny', sw.includes('CACHEABLE_STATIC_PATHS') && sw.includes('isCacheableStaticRequest') && sw.includes('event.respondWith(networkOnlyNoStore(request))'), 'explicit static allowlist + network-only fallback');
} catch (e) { record('gh02.critical-list-boundary-sync', false, e.message); }

// GHNC-02: mutation must fail the same R2 checker that guards the real build.
const ncRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'garp251-ghnc02-'));
try {
  let sw = await fsp.readFile(path.join(root, 'dist', 'sw.js'), 'utf8');
  sw = sw.replace('const CORE = [', 'const CORE = [\n  "./release-integrity.json",');
  await fsp.writeFile(path.join(ncRoot, 'sw.js'), sw);
  await fsp.writeFile(path.join(ncRoot, 'release-integrity.json'), '{}\n');
  runNode('ghnc02.security-critical-precache-mutation-rejected', path.join(tools, 'check-sw-security-freeze.mjs'), [path.join(ncRoot, 'sw.js'), ncRoot, critical], 1);
} finally { await fsp.rm(ncRoot, { recursive: true, force: true }); }

// Deployment leak scanner negative control: .env.* must be fail-closed.
const ncLeak = await fsp.mkdtemp(path.join(os.tmpdir(), 'garp251-leak-nc-'));
try {
  await fsp.writeFile(path.join(ncLeak, '.env.production'), 'SYNTHETIC_ONLY=not-a-secret\n');
  runNode('negative-control.env-production-rejected', path.join(tools, 'scan-deployment-leaks.mjs'), [ncLeak], 1);
} finally { await fsp.rm(ncLeak, { recursive: true, force: true }); }

const failed = steps.filter((s) => !s.ok);
const pkg = JSON.parse(await fsp.readFile(path.join(root, 'package.json'), 'utf8'));
const report = {
  schema: 'ghrab-garp251-shield-prep-qa-v1',
  appId: 'essay-evaluator',
  appVersion: pkg.version,
  toolingRevision: 'GARP-2.5.1-R2',
  profile: 'SHIELD-PREP',
  syntheticDataOnly: true,
  generatedAt: new Date().toISOString(),
  status: failed.length ? 'failed' : 'passed',
  summary: { total: steps.length, passed: steps.length - failed.length, failed: failed.length },
  steps
};
await fsp.writeFile(path.join(reportDir, 'garp251-shield-prep.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, summary: report.summary, failed: failed.map((x) => x.id) }, null, 2));
if (failed.length) process.exit(1);
