import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collectCertificationEvidence } from '../scripts/ci/collect-certification-evidence.mjs';

const SHA = 'a'.repeat(40);
const files = [
  'qa-suite-session-report.json', 'quality-report.json', 'qa-p3-browser-report.json',
  'qa-p5-runtime-report.json', 'qa-p5-xss-sinks-report.json', 'qa-p5-axe-runtime-report.json',
  'qa-p5-release-report.json', 'qa-p5-acceptance-report.json',
];
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghrab-evidence-test-'));
  fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'audit/evidence/garp27-current'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '1.5.30' }));
  fs.writeFileSync(path.join(dir, 'ghrab-platform.consumer.json'), JSON.stringify({ appId: 'essay-evaluator', appVersion: '1.5.30' }));
  for (const file of files) {
    fs.writeFileSync(path.join(dir, 'dist', file), JSON.stringify({
      appId: 'essay-evaluator', appVersion: '1.5.30', status: 'passed',
      summary: { failed: 0, blockers: 0 },
      syntheticDataOnly: true, axeRequired: true, scriptsExecuted: true,
      checks: [{ id: 'contract', ok: true }], failures: [],
    }));
  }
  const ids = ['build', 'contracts', 'architecture', 'policy-mutations', 'mutations', 'auto-patch', 'legacy-garp25', 'platform'];
  fs.writeFileSync(path.join(dir, 'audit/evidence/garp27-current/foundation-summary.json'), JSON.stringify({
    classification: 'GARP27_FOUNDATION_GATE', garpVersion: '2.7', appId: 'essay-evaluator',
    appVersion: '1.5.30', status: 'FOUNDATION_PASS_LIVE_NOT_TESTED',
    summary: { passed: 8, failed: 0 }, steps: ids.map(id => ({ id, pass: true, actualExit: 0 })),
  }));
  return dir;
}
function invoke(root, phase = 'p5', sourceSha = SHA, checkedOutSha = SHA) {
  return collectCertificationEvidence({ root, outputRoot: root, phase, sourceSha, checkedOutSha, ref: 'refs/heads/candidate', runId: '123' });
}
function clean(dir) { fs.rmSync(dir, { recursive: true, force: true }); }

test('P5 PASS evidence retains exactly eight whitelisted reports, hashes and SHA', () => {
  const dir = fixture();
  try {
    const { target, manifest } = invoke(dir);
    assert.equal(manifest.status, 'PASS');
    assert.equal(manifest.checkedOutSha, SHA);
    assert.equal(manifest.reports.length, 8);
    assert.equal(fs.readdirSync(target).length, 9);
    assert.match(manifest.reports[0].sha256, /^[0-9a-f]{64}$/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(target, 'evidence-manifest.json'))).githubRunId, '123');
  } finally { clean(dir); }
});

test('P5 missing report is blocking', () => {
  const dir = fixture();
  try {
    fs.rmSync(path.join(dir, 'dist/qa-p5-release-report.json'));
    assert.throws(() => invoke(dir), /missing ordinary report file/);
  } finally { clean(dir); }
});

test('P5 wrong status, unsynthetic data, or disabled axe is blocking', () => {
  const dir = fixture();
  try {
    const file = path.join(dir, 'dist/qa-p5-release-report.json');
    const report = JSON.parse(fs.readFileSync(file));
    report.status = 'failed'; fs.writeFileSync(file, JSON.stringify(report));
    assert.throws(() => invoke(dir), /non-PASS/);
    report.status = 'passed'; report.axeRequired = false; fs.writeFileSync(file, JSON.stringify(report));
    assert.throws(() => invoke(dir), /require axe/);
    report.axeRequired = true; fs.writeFileSync(file, JSON.stringify(report));
    const suiteFile = path.join(dir, 'dist/qa-suite-session-report.json');
    const suite = JSON.parse(fs.readFileSync(suiteFile));
    suite.syntheticDataOnly = false; fs.writeFileSync(suiteFile, JSON.stringify(suite));
    assert.throws(() => invoke(dir), /synthetic data only/);
  } finally { clean(dir); }
});

test('source SHA mismatch blocks artifact staging', () => {
  const dir = fixture();
  try { assert.throws(() => invoke(dir, 'p5', SHA, 'b'.repeat(40)), /does not match/); }
  finally { clean(dir); }
});

test('GARP foundation full PASS creates separate evidence artifact', () => {
  const dir = fixture();
  try {
    const { target, manifest } = invoke(dir, 'foundation');
    assert.equal(manifest.requiredReportCount, 1);
    assert.deepEqual(fs.readdirSync(target).sort(), ['evidence-manifest.json', 'foundation-summary.json']);
  } finally { clean(dir); }
});

test('GARP foundation rejected if failed, missing steps, or stale app version', () => {
  const dir = fixture();
  try {
    const file = path.join(dir, 'audit/evidence/garp27-current/foundation-summary.json');
    const summary = JSON.parse(fs.readFileSync(file));
    summary.steps[3].pass = false; fs.writeFileSync(file, JSON.stringify(summary));
    assert.throws(() => invoke(dir, 'foundation'), /did not PASS/);
    summary.steps[3].pass = true; summary.appVersion = '1.5.29'; fs.writeFileSync(file, JSON.stringify(summary));
    assert.throws(() => invoke(dir, 'foundation'), /identity mismatch/);
  } finally { clean(dir); }
});
