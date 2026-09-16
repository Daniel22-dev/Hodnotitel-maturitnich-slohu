#!/usr/bin/env node

const REQUIRED_STATUS_CHECKS = ['p5-release-gate'];

const isActions = process.env.GITHUB_ACTIONS === 'true';
if (!isActions) {
  console.log('GITHUB GOVERNANCE SKIP: mimo GitHub Actions');
  process.exit(0);
}

const repo = String(process.env.GITHUB_REPOSITORY || '').trim();
const ref = String(process.env.GITHUB_REF_NAME || '').trim();
const token = String(process.env.GITHUB_TOKEN || '').trim();

if (!repo || !ref || !token) {
  console.error('GITHUB GOVERNANCE FAIL: chybi GITHUB_REPOSITORY/GITHUB_REF_NAME/GITHUB_TOKEN');
  process.exit(1);
}

if (ref !== 'main') {
  console.error('GITHUB GOVERNANCE FAIL: verejny deploy je povolen pouze z main');
  process.exit(1);
}

const url = `https://api.github.com/repos/${repo}/branches/${encodeURIComponent(ref)}`;
const response = await fetch(url, {
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  },
  redirect: 'error',
});

if (!response.ok) {
  console.error(`GITHUB GOVERNANCE FAIL: branch metadata HTTP ${response.status}`);
  process.exit(1);
}

const branch = await response.json();
if (branch?.protected !== true) {
  console.error('GITHUB GOVERNANCE FAIL: main neni chranena; verejny deploy je bezpecne zablokovan');
  process.exit(1);
}

const requiredStatusChecks = branch?.protection?.required_status_checks;
if (!requiredStatusChecks || requiredStatusChecks.enforcement_level === 'off') {
  console.error('GITHUB GOVERNANCE FAIL: main nema aktivni required status checks');
  process.exit(1);
}
if (requiredStatusChecks.enforcement_level !== 'everyone') {
  console.error(`GITHUB GOVERNANCE FAIL: required checks nejsou vynuceny i pro administratory (enforcement=${requiredStatusChecks.enforcement_level || 'unknown'})`);
  process.exit(1);
}

const configuredChecks = new Set([
  ...(Array.isArray(requiredStatusChecks.contexts) ? requiredStatusChecks.contexts : []),
  ...(Array.isArray(requiredStatusChecks.checks)
    ? requiredStatusChecks.checks.map((item) => item?.context).filter(Boolean)
    : []),
]);

const missingChecks = REQUIRED_STATUS_CHECKS.filter((name) => !configuredChecks.has(name));
if (missingChecks.length) {
  console.error(`GITHUB GOVERNANCE FAIL: chybi required check(s): ${missingChecks.join(', ')}`);
  process.exit(1);
}

console.log(`GITHUB GOVERNANCE PASS: main je chranena a required checks jsou aktivni (${REQUIRED_STATUS_CHECKS.join(', ')})`);
