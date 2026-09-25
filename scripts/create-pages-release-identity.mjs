#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const qaResults = path.join(root, 'qa-results');
const pkg = JSON.parse(await fsp.readFile(path.join(root, 'package.json'), 'utf8'));
const appId = 'essay-evaluator';
const version = pkg.version;
const integrityPath = path.join(dist, 'release-integrity.json');
const sbomPath = path.join(dist, 'sbom.cdx.json');
const provenancePath = path.join(dist, 'build-provenance.json');
const evidencePath = path.join(dist, 'security-evidence-manifest.json');
const studioManifestPath = path.join(dist, 'studio-manifest.json');

if (!fs.existsSync(dist)) throw new Error('Release identity FAIL: chybí dist/.');
if (!fs.existsSync(studioManifestPath)) throw new Error('Release identity FAIL: chybí dist/studio-manifest.json.');
if (!fs.existsSync(qaResults)) throw new Error('Release identity FAIL: chybí qa-results z aktuálního release gate.');

function runNode(script, args, env = {}) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`Release identity FAIL: ${script} skončil ${result.status}.\n${result.stdout || ''}\n${result.stderr || ''}`);
  }
  return result.stdout;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function resolveSourceCommit() {
  const fromEnv = String(process.env.GITHUB_SHA || '').trim();
  if (/^[0-9a-f]{40}$/i.test(fromEnv)) return fromEnv.toLowerCase();
  const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  const fromGit = String(git.stdout || '').trim();
  if (/^[0-9a-f]{40}$/i.test(fromGit)) return fromGit.toLowerCase();
  throw new Error('Release identity FAIL: nelze určit 40znakový source commit SHA.');
}

const sourceCommit = resolveSourceCommit();
const repository = process.env.GITHUB_REPOSITORY || 'Daniel22-dev/Hodnotitel-maturitnich-slohu';
const workflowRef = process.env.GITHUB_WORKFLOW_REF || 'local';
// Master §13: aktualni stav musi jednoznacne rikat, zda jde o PREP nebo LIVE.
// prepare:pages bezi i v P5 gate, kde se artefakt nikdy nepublikuje - takovy zaznam
// se nesmi tvarit jako zivy release.
const isPagesDeploy = process.env.GITHUB_ACTIONS === 'true'
  && /\.github\/workflows\/deploy\.yml/.test(workflowRef);
const releaseStage = isPagesDeploy ? 'LIVE-PUBLIC-PAGES' : 'PREP-VALIDATION';
const runId = process.env.GITHUB_RUN_ID || 'local';
const runAttempt = process.env.GITHUB_RUN_ATTEMPT || '1';
const buildId = `github-${runId}-${runAttempt}`;
const createdAt = new Date().toISOString();

// Manifest only points at the existing GARP release-integrity contract. It does not
// invent a second cryptographic format. The integrity document itself is excluded
// from its own artifact digest by the GARP 2.5.1 tooling, avoiding circular hashes.
for (const name of ['studio-manifest.json', 'app-manifest.json']) {
  const file = path.join(dist, name);
  if (!fs.existsSync(file)) continue;
  const manifest = JSON.parse(await fsp.readFile(file, 'utf8'));
  if (manifest.id !== appId || manifest.version !== version) {
    throw new Error(`Release identity FAIL: ${name} neodpovídá ${appId} ${version}.`);
  }
  manifest.releaseIdentity = {
    contract: 'ghrab-release-integrity-v2',
    url: './release-integrity.json',
    assuranceMode: 'TRANSITIONAL',
  };
  await fsp.writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

runNode('scripts/create-garp25-sbom.mjs', [sbomPath]);
runNode('security/garp251/tools/create-evidence-manifest.mjs', [qaResults, evidencePath], {
  GHRAB_APP_ID: appId,
  GHRAB_APP_VERSION: version,
  GHRAB_SOURCE_COMMIT: sourceCommit,
});
runNode('security/garp251/tools/create-build-provenance.mjs', [studioManifestPath, provenancePath], {
  GHRAB_SOURCE_REPOSITORY: repository,
  GHRAB_SOURCE_COMMIT: sourceCommit,
  // Lokální běh se nesmí vydávat za ověřený GitHub Actions builder.
  GHRAB_BUILDER_ID: process.env.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'local-untrusted-builder',
  GHRAB_WORKFLOW_REF: workflowRef,
  GHRAB_BUILD_ENTRYPOINT: 'npm run prepare:pages',
  GHRAB_BUILD_STARTED_AT: process.env.GITHUB_RUN_STARTED_AT || createdAt,
  GHRAB_BUILD_FINISHED_AT: createdAt,
  GHRAB_LOCKFILE: path.join(root, 'package-lock.json'),
  GHRAB_BUILD_PROFILE: 'GARP-2.7/P5-R2',
});

const sbomSha256 = sha256(sbomPath);
const provenanceSha256 = sha256(provenancePath);
const evidenceSha256 = sha256(evidencePath);
const manifestSha256 = sha256(studioManifestPath);

runNode('security/garp251/tools/create-release-integrity.mjs', [
  dist,
  appId,
  version,
  'TRANSITIONAL-UNSIGNED',
  integrityPath,
], {
  GHRAB_BUILD_ID: buildId,
  GHRAB_SOURCE_COMMIT: sourceCommit,
  GHRAB_BUILD_PROVENANCE_SHA256: provenanceSha256,
  GHRAB_SBOM_SHA256: sbomSha256,
  GHRAB_EVIDENCE_MANIFEST_SHA256: evidenceSha256,
});

const integrity = JSON.parse(await fsp.readFile(integrityPath, 'utf8'));
if (integrity.appId !== appId || integrity.version !== version || integrity.sourceCommit !== sourceCommit) {
  throw new Error('Release identity FAIL: GARP release-integrity app/version/sourceCommit drift.');
}
if (!/^[0-9a-f]{64}$/i.test(integrity.artifactDigest || '')) {
  throw new Error('Release identity FAIL: artifactDigest není SHA-256.');
}
integrity.assuranceMode = 'TRANSITIONAL';
integrity.releaseStage = releaseStage;
integrity.status = 'GREEN';
integrity.environment = 'github-pages';
integrity.garpProfile = 'GARP-2.7';
integrity.gate = 'P5-R2';
integrity.manifestSha256 = manifestSha256;
integrity.sbomSha256 = sbomSha256;
integrity.buildProvenanceSha256 = provenanceSha256;
integrity.evidenceManifestSha256 = evidenceSha256;
integrity.buildRun = {
  provider: 'github-actions',
  repository,
  workflowRef,
  runId: String(runId),
  runAttempt: String(runAttempt),
  sourceCommit,
};
integrity.tooling = {
  garp: '2.5.1',
  platform: '1.1.2',
  node: process.version,
};
integrity.signature = {
  algorithm: 'Ed25519',
  keyId: 'TRANSITIONAL-UNSIGNED',
  status: 'NOT_PRESENT',
  note: 'TRANSITIONAL: exact release identity is machine-verified, but no production signing key is asserted for this GitHub Pages release.',
};
await fsp.writeFile(integrityPath, `${JSON.stringify(integrity, null, 2)}\n`, 'utf8');

runNode('security/garp251/tools/verify-release-integrity.mjs', [dist, integrityPath]);
runNode('security/garp251/tools/scan-deployment-leaks.mjs', [dist]);

const finalIntegrity = JSON.parse(await fsp.readFile(integrityPath, 'utf8'));
for (const required of [
  ['sourceCommit', finalIntegrity.sourceCommit],
  ['artifactDigest', finalIntegrity.artifactDigest],
  ['manifestSha256', finalIntegrity.manifestSha256],
  ['sbomSha256', finalIntegrity.sbomSha256],
  ['buildProvenanceSha256', finalIntegrity.buildProvenanceSha256],
  ['evidenceManifestSha256', finalIntegrity.evidenceManifestSha256],
]) {
  if (!/^[0-9a-f]{40}$/i.test(required[1] || '') && required[0] === 'sourceCommit') {
    throw new Error(`Release identity FAIL: ${required[0]} není commit SHA.`);
  }
  if (required[0] !== 'sourceCommit' && !/^[0-9a-f]{64}$/i.test(required[1] || '')) {
    throw new Error(`Release identity FAIL: ${required[0]} není SHA-256.`);
  }
}

console.log(JSON.stringify({
  status: 'PASS',
  appId,
  version,
  sourceCommit,
  artifactDigest: finalIntegrity.artifactDigest,
  releaseStage: finalIntegrity.releaseStage,
  assuranceMode: finalIntegrity.assuranceMode,
  signatureStatus: finalIntegrity.signature.status,
  evidence: {
    manifestSha256,
    sbomSha256,
    provenanceSha256,
    evidenceSha256,
  },
}, null, 2));
