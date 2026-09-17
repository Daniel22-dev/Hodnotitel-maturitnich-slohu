#!/usr/bin/env node
// GARP 2.5.1 / essay-evaluator - live release verification before app-updated.
//
// Duvod: deploy dosud odesilal `app-updated` do AI Studia ihned po uspesnem
// deploy jobu, bez jakehokoli overeni, ze publikovana verze je skutecne ta,
// kterou release gate schvalil. GitHub Pages ma mezi uspesnym deployem a
// citelnosti novych bajtu kratke zpozdeni, takze jediny okamzity fetch nesmi
// rozhodovat o trvalem FAIL.
//
// Model podle Master §9.1: kratky OMEZENY retry/backoff pred dispatchem.
// Po vycerpani pokusu konci fail-closed. Zadna nekonecna smycka.
//
// Skript nepracuje s zadnym tokenem a nic tajneho netiskne.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const env = (name, fallback = '') => String(process.env[name] ?? fallback).trim();
const sha256 = (text) => crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');

const rawUrl = env('GHRAB_LIVE_URL');
const expected = {
  appId: env('GHRAB_LIVE_APP_ID'),
  version: env('GHRAB_LIVE_VERSION'),
  sourceCommit: env('GHRAB_LIVE_SOURCE_SHA').toLowerCase(),
  artifactDigest: env('GHRAB_LIVE_ARTIFACT_DIGEST').toLowerCase(),
  manifestSha256: env('GHRAB_LIVE_MANIFEST_SHA256').toLowerCase(),
};
const allowedOrigin = env('GHRAB_LIVE_ALLOWED_ORIGIN', 'https://daniel22-dev.github.io');
const attempts = Math.min(Math.max(Number(env('GHRAB_LIVE_ATTEMPTS', '8')) || 8, 1), 20);
const baseDelayMs = Math.min(Math.max(Number(env('GHRAB_LIVE_DELAY_MS', '5000')) || 5000, 0), 60000);
const maxDelayMs = Math.min(Math.max(Number(env('GHRAB_LIVE_MAX_DELAY_MS', '30000')) || 30000, baseDelayMs), 120000);
const requestTimeoutMs = Math.min(Math.max(Number(env('GHRAB_LIVE_TIMEOUT_MS', '15000')) || 15000, 1000), 60000);
const outPath = env('GHRAB_LIVE_OUT');

function fail(reason, detail = {}) {
  console.error(JSON.stringify({ schema: 'ghrab-live-release-verification-v1', status: 'FAIL', reason, ...detail }, null, 2));
  process.exit(1);
}

const missing = Object.entries(expected).filter(([, value]) => !value).map(([key]) => key);
if (!rawUrl) missing.push('url');
if (missing.length) fail('required-input-missing', { missing });
if (!/^[0-9a-f]{40}$/.test(expected.sourceCommit)) fail('invalid-source-commit');
for (const key of ['artifactDigest', 'manifestSha256']) {
  if (!/^[0-9a-f]{64}$/.test(expected[key])) fail(`invalid-${key}`);
}

let base;
try {
  base = new URL(rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`);
} catch {
  fail('unparsable-url');
}
if (base.protocol !== 'https:') fail('insecure-url', { origin: base.origin });
if (base.origin !== allowedOrigin) fail('unexpected-origin', { origin: base.origin, allowedOrigin });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'error',
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache', accept: 'application/json' },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.text();
}

function evaluate(integrityText, manifestText) {
  const problems = [];
  let integrity;
  let manifest;
  try { integrity = JSON.parse(integrityText); } catch { return { problems: ['release-integrity-unparsable'] }; }
  try { manifest = JSON.parse(manifestText); } catch { return { problems: ['studio-manifest-unparsable'] }; }

  const liveManifestSha256 = sha256(manifestText);
  if (integrity.appId !== expected.appId) problems.push(`appId:${integrity.appId}`);
  if (integrity.version !== expected.version) problems.push(`version:${integrity.version}`);
  if (String(integrity.sourceCommit || '').toLowerCase() !== expected.sourceCommit) problems.push(`sourceCommit:${integrity.sourceCommit}`);
  if (String(integrity.artifactDigest || '').toLowerCase() !== expected.artifactDigest) problems.push(`artifactDigest:${integrity.artifactDigest}`);
  if (String(integrity.manifestSha256 || '').toLowerCase() !== expected.manifestSha256) problems.push(`integrity.manifestSha256:${integrity.manifestSha256}`);
  if (liveManifestSha256 !== expected.manifestSha256) problems.push(`liveManifestSha256:${liveManifestSha256}`);
  if (manifest.id !== expected.appId) problems.push(`manifest.id:${manifest.id}`);
  if (manifest.version !== expected.version) problems.push(`manifest.version:${manifest.version}`);

  return { problems, integrity, liveManifestSha256 };
}

const integrityUrl = new URL('release-integrity.json', base).toString();
const manifestUrl = new URL('studio-manifest.json', base).toString();
const history = [];

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  let outcome;
  try {
    const [integrityText, manifestText] = await Promise.all([fetchText(integrityUrl), fetchText(manifestUrl)]);
    outcome = evaluate(integrityText, manifestText);
  } catch (error) {
    outcome = { problems: [`fetch:${error.message}`] };
  }

  if (outcome.problems.length === 0) {
    const verified = {
      schema: 'ghrab-live-release-verification-v1',
      status: 'PASS',
      attempt,
      attempts,
      appId: expected.appId,
      version: expected.version,
      sourceCommit: expected.sourceCommit,
      artifactDigest: expected.artifactDigest,
      manifestSha256: expected.manifestSha256,
      sbomSha256: String(outcome.integrity.sbomSha256 || '').toLowerCase() || null,
      evidenceManifestSha256: String(outcome.integrity.evidenceManifestSha256 || '').toLowerCase() || null,
      buildProvenanceSha256: String(outcome.integrity.buildProvenanceSha256 || '').toLowerCase() || null,
      assuranceMode: outcome.integrity.assuranceMode || null,
      garpProfile: outcome.integrity.garpProfile || null,
      gate: outcome.integrity.gate || null,
      releaseIntegrityUrl: integrityUrl,
      deployedUrl: base.toString(),
      verifiedAt: new Date().toISOString(),
    };
    if (outPath) {
      fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
      fs.writeFileSync(path.resolve(outPath), `${JSON.stringify(verified, null, 2)}\n`, 'utf8');
    }
    console.log(JSON.stringify(verified, null, 2));
    process.exit(0);
  }

  history.push({ attempt, problems: outcome.problems });
  if (attempt < attempts) {
    await sleep(Math.min(baseDelayMs * attempt, maxDelayMs));
  }
}

fail('live-release-not-confirmed', { attempts, deployedUrl: base.toString(), history });
