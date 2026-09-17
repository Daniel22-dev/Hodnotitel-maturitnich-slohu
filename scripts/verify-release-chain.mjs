#!/usr/bin/env node
// GARP 2.5.1 / essay-evaluator - release chain regression.
//
// Duvod: dist/build-provenance.json a dist/security-evidence-manifest.json se
// dosud pouze generovaly, ale nikdy se na skutecnem artefaktu neoverovaly, a
// zadny krok neoveroval po VSECH post-processing krocich, ze release-integrity,
// studio manifest, SBOM, provenance a evidence stale popisuji tentyz release.
//
// Tato kontrola je posledni krok prepare:pages a je fail-closed. Overuje presne
// ty bajty, ktere odchazi na GitHub Pages.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');
const QA_RESULTS = path.join(ROOT, 'qa-results');
const TOOLS = path.join(ROOT, 'security', 'garp251', 'tools');

const checks = [];
const add = (id, ok, detail = '') => checks.push({ id, ok: Boolean(ok), detail: String(detail).slice(0, 400) });
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const isSha256 = (v) => /^[a-f0-9]{64}$/i.test(String(v || ''));
const isCommit = (v) => /^[a-f0-9]{40}$/i.test(String(v || ''));

function runTool(id, script, args, env = {}) {
  const result = spawnSync(process.execPath, [path.join(TOOLS, script), ...args], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  add(id, result.status === 0, `exit=${result.status}; ${output}`);
  return result.status === 0;
}

const pkg = JSON.parse(await fsp.readFile(path.join(ROOT, 'package.json'), 'utf8'));
const appId = 'essay-evaluator';

const files = {
  integrity: path.join(DIST, 'release-integrity.json'),
  studioManifest: path.join(DIST, 'studio-manifest.json'),
  sbom: path.join(DIST, 'sbom.cdx.json'),
  provenance: path.join(DIST, 'build-provenance.json'),
  evidence: path.join(DIST, 'security-evidence-manifest.json'),
};
for (const [name, file] of Object.entries(files)) add(`file.${name}`, fs.existsSync(file), file);
if (checks.some((c) => !c.ok)) finish();

const integrity = JSON.parse(await fsp.readFile(files.integrity, 'utf8'));
const studioManifest = JSON.parse(await fsp.readFile(files.studioManifest, 'utf8'));

// --- identita release ---
add('identity.appId', integrity.appId === appId, String(integrity.appId));
add('identity.version', integrity.version === pkg.version, `${integrity.version} vs package ${pkg.version}`);
add('identity.sourceCommit', isCommit(integrity.sourceCommit), String(integrity.sourceCommit));
add('identity.artifactDigest', isSha256(integrity.artifactDigest), String(integrity.artifactDigest));
add('identity.manifest-app', studioManifest.id === appId && studioManifest.version === pkg.version,
  `${studioManifest.id} ${studioManifest.version}`);
add('identity.assurance-mode-declared', integrity.assuranceMode === 'TRANSITIONAL',
  String(integrity.assuranceMode));
const expectedStage = process.env.GITHUB_ACTIONS === 'true'
  && /\.github\/workflows\/deploy\.yml/.test(String(process.env.GITHUB_WORKFLOW_REF || ''))
  ? 'LIVE-PUBLIC-PAGES'
  : 'PREP-VALIDATION';
add('identity.release-stage', integrity.releaseStage === expectedStage,
  `${integrity.releaseStage} vs ${expectedStage}`);
add('identity.created-at', !Number.isNaN(Date.parse(String(integrity.createdAt || ''))),
  String(integrity.createdAt));
add('identity.environment', integrity.environment === 'github-pages', String(integrity.environment));
add('identity.tooling', integrity.tooling?.garp === '2.5.1' && Boolean(integrity.tooling?.node),
  JSON.stringify(integrity.tooling || {}));
add('identity.signature-not-overclaimed',
  integrity.signature?.status === 'NOT_PRESENT' || integrity.signature?.status === 'VERIFIED',
  String(integrity.signature?.status));
add('identity.build-run', Boolean(integrity.buildRun?.repository) && integrity.buildRun?.sourceCommit === integrity.sourceCommit,
  `${integrity.buildRun?.repository || ''}@${integrity.buildRun?.sourceCommit || ''}`);

// --- krizove vazby po vsech post-processing krocich ---
const links = [
  ['manifestSha256', files.studioManifest],
  ['sbomSha256', files.sbom],
  ['buildProvenanceSha256', files.provenance],
  ['evidenceManifestSha256', files.evidence],
];
for (const [field, file] of links) {
  const expected = sha256(file);
  add(`link.${field}`, String(integrity[field] || '').toLowerCase() === expected,
    `${integrity[field]} vs ${expected}`);
}

// --- kontrakt Studio manifestu prezije post-processing ---
const platform = studioManifest.platform || {};
const requiredPlatformKeys = ['schema', 'contract', 'requiredPlatformRange', 'platformVersion', 'brandVersion',
  'themeContract', 'swContract', 'studioBridge', 'artifactEnvelope', 'storagePrefix', 'cacheName'];
const missingPlatform = requiredPlatformKeys.filter((key) => platform[key] == null || platform[key] === '');
add('contract.platform-complete', missingPlatform.length === 0, missingPlatform.join(','));
add('contract.storage-prefix', platform.storagePrefix === `ghrab.${appId}.`, String(platform.storagePrefix));
add('contract.cache-name', platform.cacheName === `ghrab-${appId}-v${pkg.version}`, String(platform.cacheName));
add('contract.release-identity-pointer',
  studioManifest.releaseIdentity?.contract === 'ghrab-release-integrity-v2'
  && studioManifest.releaseIdentity?.url === './release-integrity.json',
  JSON.stringify(studioManifest.releaseIdentity || {}));
add('contract.repository', String(studioManifest.repository || '').toLowerCase() === 'daniel22-dev/hodnotitel-maturitnich-slohu',
  String(studioManifest.repository));
add('contract.launch-url', /^https:\/\//.test(String(studioManifest.launchUrl || '')), String(studioManifest.launchUrl));

// --- SBOM popisuje tuto verzi ---
try {
  const sbom = JSON.parse(await fsp.readFile(files.sbom, 'utf8'));
  add('sbom.format', sbom.bomFormat === 'CycloneDX' && String(sbom.specVersion || '').startsWith('1.'),
    `${sbom.bomFormat} ${sbom.specVersion}`);
  add('sbom.component-version', sbom.metadata?.component?.version === pkg.version,
    String(sbom.metadata?.component?.version));
} catch (error) {
  add('sbom.readable', false, error.message);
}

// --- provenance je svazana s presne timto manifestem a commitem ---
// Pozn.: provenance.releaseIntegrity.artifactDigest zustava null zamerne. Digest
// artefaktu se pocita nad celym dist/ vcetne build-provenance.json, takze zpetna
// vazba provenance -> artifactDigest je strukturalne cirkularni. Misto ni se
// overuje neprotichudny dopredny retez:
//   release-integrity -> buildProvenanceSha256 -> provenance -> studio manifest.
try {
  const provenance = JSON.parse(await fsp.readFile(files.provenance, 'utf8'));
  add('provenance.subject-is-manifest',
    String(provenance.subject?.sha256 || '').toLowerCase() === String(integrity.manifestSha256 || '').toLowerCase(),
    `${provenance.subject?.sha256} vs ${integrity.manifestSha256}`);
  add('provenance.source-commit', provenance.source?.revision === integrity.sourceCommit,
    `${provenance.source?.revision} vs ${integrity.sourceCommit}`);
  add('provenance.lockfile', isSha256(provenance.invocation?.lockfileSha256)
    && provenance.invocation.lockfileSha256 === sha256(path.join(ROOT, 'package-lock.json')),
    String(provenance.invocation?.lockfileSha256));
  add('provenance.no-self-asserted-slsa-level', provenance.assurance?.claimedSlsaLevel == null,
    String(provenance.assurance?.claimedSlsaLevel));
  add('provenance.builder-matches-environment',
    process.env.GITHUB_ACTIONS === 'true'
      ? provenance.builder?.id === 'github-actions'
      : provenance.builder?.id === 'local-untrusted-builder',
    String(provenance.builder?.id));
} catch (error) {
  add('provenance.readable', false, error.message);
}

// --- nezavisle overeni vendorovanymi GARP nastroji ---
runTool('verify.release-integrity', 'verify-release-integrity.mjs', [DIST, files.integrity]);
runTool('verify.build-provenance', 'verify-build-provenance.mjs', [
  files.studioManifest,
  files.provenance,
  ...(process.env.GITHUB_ACTIONS === 'true' ? [] : ['--allow-local-builder']),
], {
  GHRAB_EXPECT_SOURCE_COMMIT: integrity.sourceCommit,
  ...(process.env.GITHUB_ACTIONS === 'true' ? { GHRAB_EXPECT_BUILDER_ID: 'github-actions' } : {}),
});
runTool('verify.evidence-manifest', 'verify-evidence-manifest.mjs', [QA_RESULTS, files.evidence]);
runTool('verify.deployment-leaks', 'scan-deployment-leaks.mjs', [DIST]);

function finish() {
  const failed = checks.filter((c) => !c.ok);
  const report = {
    schema: 'ghrab-release-chain-verification-v1',
    appId,
    version: pkg.version,
    status: failed.length ? 'failed' : 'passed',
    summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
    failed: failed.map((c) => c.id),
    checks,
  };
  console[failed.length ? 'error' : 'log'](JSON.stringify(report, null, 2));
  process.exit(failed.length ? 1 : 0);
}

finish();
