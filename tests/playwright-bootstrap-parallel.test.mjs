import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../scripts/ci/install-playwright-chromium-parallel.sh');
const fakeNpx = [
  '#!/bin/sh',
  'set -eu',
  'case "$*" in',
  '  "--no-install playwright install-deps chromium") phase=deps; peer=browser ;;',
  '  "--no-install playwright install chromium") phase=browser; peer=deps ;;',
  '  *) echo "unexpected command: $*" >&2; exit 99 ;;',
  'esac',
  'printf started > "$MARK_DIR/$phase.started"',
  'i=0',
  'while [ ! -f "$MARK_DIR/$peer.started" ] && [ "$i" -lt 40 ]; do',
  '  sleep 0.05',
  '  i=$((i+1))',
  'done',
  'if [ ! -f "$MARK_DIR/$peer.started" ]; then echo NOT_PARALLEL >&2; exit 85; fi',
  'if [ "$FAIL_PHASE" = "$phase" ] || [ "$FAIL_PHASE" = both ]; then exit 17; fi',
  'echo "$phase complete"',
].join('\n') + '\n';

function run(failure = '') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ghrab-bootstrap-test-'));
  const bin = path.join(root, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'npx'), fakeNpx, { mode: 0o755 });
  const result = spawnSync('bash', [script], {
    env: { ...process.env, PATH: [bin, process.env.PATH].join(':'), MARK_DIR: root, FAIL_PHASE: failure },
    encoding: 'utf8', timeout: 15000,
  });
  const files = fs.readdirSync(root);
  fs.rmSync(root, { recursive: true, force: true });
  if (result.error) throw result.error;
  return { ...result, files };
}

test('mandatory browser and OS phases overlap, not sequential', () => {
  const r = run();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /PLAYWRIGHT_BOOTSTRAP_PASS/);
  assert.match(r.stdout, /deps_exit=0 browser_exit=0/);
  assert.ok(r.files.includes('deps.started') && r.files.includes('browser.started'));
});

test('a failed OS dependency install blocks the certificate', () => {
  const r = run('deps');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /deps_exit=17 browser_exit=0/);
  assert.match(r.stderr, /PLAYWRIGHT_BOOTSTRAP_FAILED/);
});

test('a failed browser install blocks the certificate', () => {
  const r = run('browser');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /deps_exit=0 browser_exit=17/);
});

test('both failures still produce an overall failure', () => {
  const r = run('both');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /deps_exit=17 browser_exit=17/);
});
