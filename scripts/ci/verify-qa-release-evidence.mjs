#!/usr/bin/env node
// Independent QA-release gate for a parallel, same-run Pages deployment fan-in.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REQUIRED = ['project', 'technical', 'security', 'pwa', 'combinatorial', 'visual', 'critical'];
const fail = detail => { throw new Error('QA RELEASE ADMISSION FAIL: ' + detail); };

export function verifyQaRelease({ root, sourceSha, checkedOutSha, runId = '' }) {
  if (!/^[a-f0-9]{40}$/i.test(sourceSha || '') || sourceSha !== checkedOutSha) fail('source SHA does not match checked-out HEAD');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'qa/qa-manifest.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (manifest.appVersion !== pkg.version) fail('QA manifest version differs from package');
  const dir = path.join(root, 'qa-results');
  const reportFile = path.join(dir, 'qa-report.json');
  const verdictFile = path.join(dir, 'release-verdict.txt');
  if (!fs.existsSync(reportFile) || !fs.existsSync(verdictFile)) fail('missing QA report or verdict');
  const bytes = fs.readFileSync(reportFile);
  const report = JSON.parse(bytes.toString('utf8'));
  const verdict = fs.readFileSync(verdictFile, 'utf8').trim();
  if (report.commit !== sourceSha || report.appId !== manifest.appId ||
      report.version !== pkg.version || report.qaStandard !== manifest.standard) fail('QA identity/version/SHA mismatch');
  if (verdict !== report.verdict || !['AUTOMATED_READY', 'READY', 'READY_WITH_MINOR_ISSUES'].includes(verdict)) fail('QA verdict not ready');
  if (report.automaticVerdict !== 'AUTOMATED_READY') fail('automatic readiness failed');
  if (!/^[a-f0-9]{64}$/i.test(report.buildSha256 || '')) fail('missing build SHA-256');
  if (!Array.isArray(report.gates)) fail('missing QA gates');
  for (const name of REQUIRED) {
    const found = report.gates.filter(gate => gate.name === name);
    if (found.length !== 1 || !['PASS', 'WARN'].includes(found[0].status)) fail('gate ' + name + ' is absent or failed');
  }
  if (report.counts?.FAIL !== 0 || !Array.isArray(report.blockerAndMajor) || report.blockerAndMajor.length !== 0) fail('QA report contains blockers');
  if (report.gates.some(gate => gate.status === 'FAIL')) fail('a QA gate failed');
  const receipt = {
    schema: 'ghrab-parallel-qa-release-v1',
    sourceSha,
    runId,
    appId: manifest.appId,
    appVersion: pkg.version,
    verdict,
    qaReportSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    buildSha256: report.buildSha256,
    requiredGateCount: REQUIRED.length,
    status: 'PASS',
  };
  fs.writeFileSync(path.join(dir, 'qa-release-ci-receipt.json'), JSON.stringify(receipt, null, 2) + '\n', {mode: 0o600});
  return receipt;
}

const isCLI = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCLI) {
  try {
    const root = process.cwd();
    if (process.env.GITHUB_ACTIONS === 'true' && !process.env.GITHUB_SHA) fail('GITHUB_SHA is required');
    const checkedOutSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    const receipt = verifyQaRelease({root, sourceSha: process.env.GITHUB_SHA || checkedOutSha, checkedOutSha, runId: process.env.GITHUB_RUN_ID || ''});
    console.log('QA RELEASE ADMISSION PASS: ' + receipt.sourceSha + ', ' + receipt.requiredGateCount + ' gates, ' + receipt.verdict);
  } catch (error) {
    console.error('::error::' + error.message);
    process.exitCode = 1;
  }
}
