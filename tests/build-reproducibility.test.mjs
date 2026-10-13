import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
function digest(dir) {
  const hashes = [];
  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) {
        hashes.push({
          name: path.relative(dir, file).split(path.sep).join('/'),
          sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
        });
      }
    }
  }
  walk(dir);
  return hashes;
}

test('two clean builds produce byte-identical complete dist, not only manifest', () => {
  const runBuild = () => execFileSync(process.execPath, ['scripts/build.mjs'], {
    cwd: root, encoding: 'utf8', env: process.env,
    timeout: 60000, maxBuffer: 4 * 1024 * 1024,
  });
  runBuild();
  const before = digest(dist);
  runBuild();
  const after = digest(dist);
  assert.ok(before.length >= 30, 'complete build should include at least 30 files');
  assert.deepEqual(after, before, 'same checked-out SHA must not generate different public bytes');
});
