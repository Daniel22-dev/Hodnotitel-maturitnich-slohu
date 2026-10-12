#!/usr/bin/env node
// Fail-closed, exact-SHA GitHub Actions evidence collector for P5 R2 and GARP 2.7.
// Keep certification evidence outside dist/: foundation and subsequent builds erase dist/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REQUIRED_P5 = Object.freeze([
  'qa-suite-session-report.json',
  'quality-report.json',
  'qa-p3-browser-report.json',
  'qa-p5-runtime-report.json',
  'qa-p5-xss-sinks-report.json',
  'qa-p5-axe-runtime-report.json',
  'qa-p5-release-report.json',
  'qa-p5-acceptance-report.json',
]);
const FOUNDATION_FILE = 'foundation-summary.json';
const EXPECTED_FOUNDATION_STEPS = Object.freeze([
  'build', 'contracts', 'architecture', 'policy-mutations',
  'mutations', 'auto-patch', 'legacy-garp25', 'platform',
]);
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const validSha = sha => /^[0-9a-f]{40}$/i.test(String(sha || ''));

function requireCondition(ok, detail) {
  if (!ok) throw new Error(`CERTIFICATION EVIDENCE FAIL: ${detail}`);
}

function verifiedReport(root, relative, appId, version) {
  const source = path.join(root, relative);
  requireCondition(fs.existsSync(source) && fs.lstatSync(source).isFile(), `missing ordinary report file ${relative}`);
  const bytes = fs.readFileSync(source);
  const report = JSON.parse(bytes.toString('utf8'));
  requireCondition(report && typeof report === 'object' && !Array.isArray(report), `invalid JSON object ${relative}`);
  requireCondition(report.appId === appId, `appId mismatch in ${relative}`);
  requireCondition(!report.appVersion || report.appVersion === version, `appVersion mismatch in ${relative}`);
  requireCondition(report.status === 'passed', `non-PASS report ${relative}: ${report.status}`);
  if (report.summary && Object.hasOwn(report.summary, 'failed')) {
    requireCondition(report.summary.failed === 0, `failed tests in ${relative}`);
  }
  return { source, bytes, report };
}

export function collectCertificationEvidence({
  root,
  outputRoot,
  phase,
  sourceSha,
  checkedOutSha,
  ref = '',
  runId = '',
  runAttempt = '',
}) {
  requireCondition(phase === 'p5' || phase === 'foundation', 'unsupported evidence phase');
  requireCondition(validSha(sourceSha) && sourceSha === checkedOutSha, 'GITHUB_SHA does not match checked-out HEAD');
  requireCondition(path.isAbsolute(outputRoot), 'evidence output root must be absolute');

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const consumer = JSON.parse(fs.readFileSync(path.join(root, 'ghrab-platform.consumer.json'), 'utf8'));
  requireCondition(pkg.version === consumer.appVersion, 'package and consumer versions differ');
  requireCondition(consumer.appId === 'essay-evaluator', 'unexpected application identity');

  const files = phase === 'p5' ? REQUIRED_P5 : [FOUNDATION_FILE];
  const reports = [];
  for (const file of files) {
    const relative = phase === 'p5' ? `dist/${file}` : `audit/evidence/garp27-current/${file}`;
    if (phase === 'p5') {
      const { bytes, report } = verifiedReport(root, relative, consumer.appId, pkg.version);
      if (file === 'qa-suite-session-report.json') {
        requireCondition(report.syntheticDataOnly === true, 'suite-session report must contain synthetic data only');
      }
      if (file === 'qa-p5-release-report.json') {
        requireCondition(report.axeRequired === true, 'P5 certification must require axe');
        requireCondition(Array.isArray(report.checks) && report.checks.length > 0 && report.checks.every(check => check.ok === true), 'P5 checks incomplete or failed');
      }
      if (file === 'qa-p5-runtime-report.json' || file === 'qa-p5-axe-runtime-report.json') {
        requireCondition(report.scriptsExecuted === true && report.summary?.blockers === 0, `runtime assurance invalid in ${file}`);
      }
      if (file === 'qa-p5-xss-sinks-report.json') {
        requireCondition(Array.isArray(report.failures) && report.failures.length === 0, 'XSS regression failures detected');
      }
      reports.push({ file, bytes, status: report.status });
    } else {
      const source = path.join(root, relative);
      requireCondition(fs.existsSync(source) && fs.lstatSync(source).isFile(), 'GARP 2.7 foundation summary is absent');
      const bytes = fs.readFileSync(source);
      const report = JSON.parse(bytes.toString('utf8'));
      requireCondition(report.classification === 'GARP27_FOUNDATION_GATE' && report.garpVersion === '2.7', 'wrong foundation report identity');
      requireCondition(report.appId === consumer.appId && report.appVersion === pkg.version, 'foundation app identity mismatch');
      requireCondition(report.status === 'FOUNDATION_PASS_LIVE_NOT_TESTED', 'foundation is not PASS');
      requireCondition(report.summary?.failed === 0 && report.summary?.passed === EXPECTED_FOUNDATION_STEPS.length, 'foundation failed or incomplete');
      requireCondition(Array.isArray(report.steps) && report.steps.length === EXPECTED_FOUNDATION_STEPS.length, 'foundation step count mismatch');
      for (let i = 0; i < EXPECTED_FOUNDATION_STEPS.length; i++) {
        const step = report.steps[i];
        requireCondition(step.id === EXPECTED_FOUNDATION_STEPS[i] && step.pass === true && step.actualExit === 0, `foundation step ${EXPECTED_FOUNDATION_STEPS[i]} did not PASS`);
      }
      reports.push({ file, bytes, status: report.status });
    }
  }

  const target = path.join(outputRoot, `ghrab-certification-${phase}`);
  // Validate *all* required reports before replacing the previous staged evidence.
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  const hashes = reports.map(({ file, bytes, status }) => {
    fs.writeFileSync(path.join(target, file), bytes, { flag: 'wx', mode: 0o600 });
    return { file, sha256: sha256(bytes), size: bytes.length, status };
  });
  const manifest = {
    schema: 'ghrab-ci-certification-evidence-v1',
    phase,
    appId: consumer.appId,
    appVersion: pkg.version,
    checkedOutSha: sourceSha,
    githubRef: ref,
    githubRunId: runId,
    githubRunAttempt: runAttempt,
    status: 'PASS',
    requiredReportCount: hashes.length,
    reports: hashes,
  };
  fs.writeFileSync(path.join(target, 'evidence-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  return { target, manifest };
}

const isCLI = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCLI) {
  try {
    const root = process.cwd();
    const checkedOutSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    if (process.env.GITHUB_ACTIONS === 'true' && !process.env.GITHUB_SHA) {
      throw new Error('GITHUB_SHA is required in GitHub Actions');
    }
    const collected = collectCertificationEvidence({
      root,
      outputRoot: process.env.RUNNER_TEMP || path.join(root, 'qa-results'),
      phase: process.argv[2],
      sourceSha: process.env.GITHUB_SHA || checkedOutSha,
      checkedOutSha,
      ref: process.env.GITHUB_REF || '',
      runId: process.env.GITHUB_RUN_ID || '',
      runAttempt: process.env.GITHUB_RUN_ATTEMPT || '',
    });
    console.log(`CERTIFICATION EVIDENCE PASS: ${collected.manifest.phase}, SHA ${collected.manifest.checkedOutSha}, ${collected.manifest.requiredReportCount} reports -> ${collected.target}`);
  } catch (error) {
    console.error(`::error::${error?.message || String(error)}`);
    process.exitCode = 1;
  }
}
