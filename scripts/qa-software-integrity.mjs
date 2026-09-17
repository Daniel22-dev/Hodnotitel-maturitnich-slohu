#!/usr/bin/env node
// GARP 2.5.1 / essay-evaluator - software integrity gate.
//
// Duvod: repozitar uz nesl autoritativni seznam hashu GARP 2.5.1 toolingu
// (security/garp251/GARP-2.5.1-TOOLING-SHA256SUMS.txt), ale zadny krok CI ani
// release cesty jej nevynucoval. Bezpecnostni nastroj (napr. N5 scanner) tak
// mohl byt oslaben bez detekce. Tato kontrola je fail-closed a bezi jako soucast
// qa:garp25, tedy v qa:p5 i qa:p5:ci.
//
// Pokryva:
//  1. vsech 14 vendorovanych GARP 2.5.1 nastroju proti autoritativnimu seznamu
//     (mnozinova shoda - neznamy nastroj navic je take FAIL),
//  2. vendorovane artefakty GHRAB AI Core proti jeho release manifestu,
//  3. tretistranne vendorovane assety pripnute v software-integrity-pins.json.
//
// Kontrola zamerne needituje zadny soubor a nema zadnou --fix vetev.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const ROOT = path.resolve(argValue('--root') || '.');
const SELF = fileURLToPath(import.meta.url);

const TOOLING_DIR = ['security', 'garp251', 'tools'];
const TOOLING_SUMS = ['security', 'garp251', 'GARP-2.5.1-TOOLING-SHA256SUMS.txt'];
const PINS = ['security', 'garp251', 'software-integrity-pins.json'];
const AI_CORE_DIR = ['vendor', 'ghrab-ai-core-1.0.0'];
const AI_CORE_MANIFEST = 'ghrab-ai-core-manifest-1.0.0.json';

const checks = [];
const add = (id, ok, detail = '') => checks.push({ id, ok: Boolean(ok), detail: String(detail).slice(0, 400) });
const at = (...rel) => path.join(ROOT, ...rel);
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function parseSums(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const m = /^([a-f0-9]{64})\s+(.+?)\s*$/i.exec(line);
    if (m) map.set(m[2], m[1].toLowerCase());
  }
  return map;
}

// 1) GARP tooling
try {
  const sums = parseSums(await fsp.readFile(at(...TOOLING_SUMS), 'utf8'));
  const expected = new Map(
    [...sums.entries()].filter(([name]) => name.startsWith('TOOLS/')).map(([name, hash]) => [name.slice('TOOLS/'.length), hash])
  );
  const present = (await fsp.readdir(at(...TOOLING_DIR))).filter((n) => n.endsWith('.mjs')).sort();

  add('tooling.sums-list-present', expected.size > 0, `${expected.size} TOOLS entries`);

  const unlisted = present.filter((name) => !expected.has(name));
  add('tooling.no-unlisted-tool', unlisted.length === 0, unlisted.join(','));

  const missing = [...expected.keys()].filter((name) => !present.includes(name));
  add('tooling.no-missing-tool', missing.length === 0, missing.join(','));

  const drift = [];
  for (const name of present) {
    const want = expected.get(name);
    if (!want) continue;
    const got = sha256(at(...TOOLING_DIR, name));
    if (got !== want) drift.push(`${name}:${got}`);
  }
  add('tooling.no-hash-drift', drift.length === 0, drift.join(','));
} catch (error) {
  add('tooling.readable', false, error.message);
}

// 2) vendorovany GHRAB AI Core
try {
  const manifest = JSON.parse(await fsp.readFile(at(...AI_CORE_DIR, AI_CORE_MANIFEST), 'utf8'));
  const artifacts = Object.entries(manifest.artifacts || {});
  add('ai-core.manifest-schema', manifest.schema === 'ghrab-ai-core-release-v1', String(manifest.schema));
  add('ai-core.artifacts-declared', artifacts.length > 0, `${artifacts.length}`);
  const drift = [];
  for (const [name, meta] of artifacts) {
    const file = at(...AI_CORE_DIR, name);
    if (!fs.existsSync(file)) { drift.push(`${name}:missing`); continue; }
    const got = sha256(file);
    if (got !== String(meta?.sha256 || '').toLowerCase()) drift.push(`${name}:${got}`);
  }
  add('ai-core.no-hash-drift', drift.length === 0, drift.join(','));
} catch (error) {
  add('ai-core.readable', false, error.message);
}

// 3) tretistranne vendorovane assety
try {
  const pins = JSON.parse(await fsp.readFile(at(...PINS), 'utf8'));
  add('pins.schema', pins.schema === 'ghrab-software-integrity-pins-v1', String(pins.schema));
  const entries = Array.isArray(pins.pins) ? pins.pins : [];
  add('pins.declared', entries.length > 0, `${entries.length}`);
  const drift = [];
  for (const pin of entries) {
    const file = at(...String(pin.path || '').split('/'));
    if (!fs.existsSync(file)) { drift.push(`${pin.path}:missing`); continue; }
    const got = sha256(file);
    if (got !== String(pin.sha256 || '').toLowerCase()) drift.push(`${pin.path}:${got}`);
  }
  add('pins.no-hash-drift', drift.length === 0, drift.join(','));
} catch (error) {
  add('pins.readable', false, error.message);
}

async function selftest() {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'ghrab-software-integrity-'));
  const run = (root) => spawnSync(process.execPath, [SELF, '--root', root], { encoding: 'utf8' });
  try {
    for (const rel of [
      path.join(...TOOLING_DIR),
      path.join(...AI_CORE_DIR),
      'src/vendor',
    ]) {
      await fsp.cp(path.join(ROOT, rel), path.join(tmp, rel), { recursive: true });
    }
    for (const rel of [path.join(...TOOLING_SUMS), path.join(...PINS)]) {
      await fsp.mkdir(path.dirname(path.join(tmp, rel)), { recursive: true });
      await fsp.copyFile(path.join(ROOT, rel), path.join(tmp, rel));
    }

    const positive = run(tmp);

    const tool = path.join(tmp, ...TOOLING_DIR, 'scan-deployment-leaks.mjs');
    await fsp.writeFile(tool, `${await fsp.readFile(tool, 'utf8')}\n// synthetic-tamper\n`);
    const tamperedTool = run(tmp);
    await fsp.copyFile(path.join(ROOT, ...TOOLING_DIR, 'scan-deployment-leaks.mjs'), tool);

    const extra = path.join(tmp, ...TOOLING_DIR, 'synthetic-unlisted-tool.mjs');
    await fsp.writeFile(extra, '// synthetic-unlisted\n');
    const unlistedTool = run(tmp);
    await fsp.rm(extra);

    const core = path.join(tmp, ...AI_CORE_DIR, 'ghrab-ai-core-1.0.0.js');
    await fsp.writeFile(core, `${await fsp.readFile(core, 'utf8')}\n// synthetic-tamper\n`);
    const tamperedCore = run(tmp);
    await fsp.copyFile(path.join(ROOT, ...AI_CORE_DIR, 'ghrab-ai-core-1.0.0.js'), core);

    const vendored = path.join(tmp, 'src', 'vendor', 'jszip.min.js');
    await fsp.writeFile(vendored, `${await fsp.readFile(vendored, 'utf8')}\n// synthetic-tamper\n`);
    const tamperedPin = run(tmp);

    const results = {
      positive: positive.status === 0,
      'negative.tampered-garp-tool': tamperedTool.status === 1,
      'negative.unlisted-garp-tool': unlistedTool.status === 1,
      'negative.tampered-ai-core': tamperedCore.status === 1,
      'negative.tampered-vendored-pin': tamperedPin.status === 1,
    };
    const failed = Object.entries(results).filter(([, ok]) => !ok).map(([id]) => id);
    console.log(JSON.stringify({
      schema: 'ghrab-software-integrity-selftest-v1',
      status: failed.length ? 'failed' : 'passed',
      results,
      failed,
    }, null, 2));
    process.exit(failed.length ? 1 : 0);
  } finally {
    await fsp.rm(tmp, { recursive: true, force: true });
  }
}

if (args.includes('--selftest')) await selftest();

const failed = checks.filter((c) => !c.ok);
const report = {
  schema: 'ghrab-software-integrity-v1',
  appId: 'essay-evaluator',
  root: ROOT,
  status: failed.length ? 'failed' : 'passed',
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
};
console[failed.length ? 'error' : 'log'](JSON.stringify(report, null, 2));
process.exit(failed.length ? 1 : 0);
