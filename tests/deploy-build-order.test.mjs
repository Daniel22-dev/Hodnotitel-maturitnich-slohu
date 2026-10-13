import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wf = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
function verifyOrder(yaml) {
  const foundation = yaml.indexOf('- name: Enforce GARP 2.7 foundation before production release');
  const platform = yaml.indexOf('- name: Verify GHRAB Platform P3 conformance');
  const p5 = yaml.indexOf('- name: Enforce P5 R2 release gate');
  if (!(foundation >= 0 && foundation < platform && platform < p5)) {
    throw new Error('Platform conformance must run after the foundation build and before the final P5');
  }
  if (!yaml.includes('needs: [qa-build, release-qa]')) {
    throw new Error('Pages publish must require both independent QA and build certificates');
  }
}
test('Pages QA build creates dist before platform conformance and P5', () => {
  assert.doesNotThrow(() => verifyOrder(wf));
});
test('reversing the platform/build steps is a regression', () => {
  const broken = wf.replace(
    '      - name: Verify GHRAB Platform P3 conformance\n        run: npm run qa:platform\n',
    ''
  ).replace(
    '      - name: Enforce GARP 2.7 foundation before production release',
    '      - name: Verify GHRAB Platform P3 conformance\n        run: npm run qa:platform\n      - name: Enforce GARP 2.7 foundation before production release'
  );
  assert.throws(() => verifyOrder(broken), /after the foundation build/);
});
test('missing parallel QA prerequisite is a regression', () => {
  assert.throws(() => verifyOrder(wf.replace('needs: [qa-build, release-qa]', 'needs: qa-build')), /both independent/);
});
