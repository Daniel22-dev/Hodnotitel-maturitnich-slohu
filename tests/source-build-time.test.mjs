import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceBuildTime } from '../scripts/ci/source-build-time.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shaClock = () => '1791567082\n';

test('CI SHA time overrides a hostile or accidental local epoch', () => {
  const t = sourceBuildTime({root: ROOT, env: {GITHUB_ACTIONS: 'true', SOURCE_DATE_EPOCH: '999999999999'}, git: shaClock});
  assert.equal(t, new Date(1791567082000).toISOString());
});
test('independent CI build jobs receive identical timestamp for the same HEAD', () => {
  assert.equal(sourceBuildTime({root: ROOT, env: {GITHUB_ACTIONS: 'true'}, git: shaClock}),
    sourceBuildTime({root: ROOT, env: {GITHUB_ACTIONS: 'true'}, git: shaClock}));
});
test('CI missing Git object is fail closed', () => {
  assert.throws(() => sourceBuildTime({root: ROOT, env: {GITHUB_ACTIONS: 'true'}, git: () => { throw new Error('missing commit'); }}), /Cannot resolve checked-out commit timestamp/);
});
test('local source archive resolves a canonical, tracked ISO timestamp', () => {
  const t = sourceBuildTime({root: ROOT, env: {}});
  assert.equal(t, '2026-07-11T13:55:00.000Z');
});
test('SOURCE_DATE_EPOCH supports deterministic local reproduction', () => {
  assert.equal(sourceBuildTime({root: ROOT, env: {SOURCE_DATE_EPOCH: '0'}}), '1970-01-01T00:00:00.000Z');
});
test('malformed or out-of-range SOURCE_DATE_EPOCH is rejected', () => {
  for (const input of ['-1', '1.5', 'not-a-date', '9999999999999', '']) {
    assert.throws(() => sourceBuildTime({root: ROOT, env: {SOURCE_DATE_EPOCH: input}}), /SOURCE_DATE_EPOCH/);
  }
});
