#!/usr/bin/env node
// GARP 2.5.1 GHRAB / GH-02 - behavioralni test hranice service workeru.
//
// Duvod vzniku: existujici dukazy GH-02 (check-sw-security-freeze, platform
// conformance, gh02.critical-list-boundary-sync) jsou vyhradne textove. Service
// worker, jehoz isSecurityCriticalRequest vzdy vraci false, jimi projde.
// Tento test overuje SKUTECNE CHOVANI fetch handleru, ne pritomnost retezcu.
//
// Princip: sw.js se nacte do izolovaneho node:vm kontextu se stubnutym Cache API
// a fetch. Pro kazdou polozku security-critical-assets.json se vystreli synteticky
// fetch event a overi se, ze:
//   1. request je zachycen security-critical vetvi (respondWith byl zavolan),
//   2. jde presne jeden fetch s cache:'no-store',
//   3. behem obsluhy nedojde k ZADNEMU zapisu do Cache API.
// Kontrolni (nekriticke) assety musi byt naopak zpracovany beznou cestou.
//
// Soucasti je povinna negativni kontrola (GHNC-02-B): tentyz test se pusti proti
// mutaci, ve ktere guard vzdy vraci false. Mutace MUSI selhat. Bez toho by slo
// o dalsi self-certifying dukaz.
//
// Bezi bez prohlizece, deterministicky, offline.
// Pouziti: node scripts/qa-sw-boundary.mjs [--json]

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve('.');
const CRITICAL_LIST = path.join(ROOT, 'security', 'garp251', 'security-critical-assets.json');
const PROFILES = ['dist', 'dist-school-server'];
const CONTROL_ASSETS = ['app.js', 'manual/manual.js', 'vendor/jszip.min.js'];
const SCOPE = '/app/';

function fail(message) {
  console.error(JSON.stringify({ status: 'ERROR', error: message }, null, 2));
  process.exit(2);
}

if (!existsSync(CRITICAL_LIST)) fail(`chybi ${CRITICAL_LIST}`);
const critical = JSON.parse(readFileSync(CRITICAL_LIST, 'utf8'));
if (!Array.isArray(critical) || !critical.length) fail('security-critical-assets.json neni neprazdne pole');

// --- izolovany bezovy kontext pro service worker -----------------------------

function instantiate(code, label) {
  const cacheWrites = [];
  const fetchCalls = [];
  const listeners = new Map();

  const cache = {
    addAll: async (urls) => { for (const u of urls || []) cacheWrites.push({ op: 'addAll', url: String(u) }); },
    add: async (u) => { cacheWrites.push({ op: 'add', url: String(u) }); },
    put: async (req) => { cacheWrites.push({ op: 'put', url: String(req?.url ?? req) }); },
    match: async () => undefined,
    delete: async () => true,
  };

  const self = {
    location: { href: `https://example.test${SCOPE}sw.js`, origin: 'https://example.test' },
    addEventListener: (type, fn) => { listeners.set(type, fn); },
    skipWaiting: () => {},
    clients: { claim: async () => {} },
    registration: {},
    caches: { open: async () => cache, keys: async () => [], delete: async () => true, match: async () => undefined },
  };

  const ctx = {
    self,
    caches: self.caches,
    location: self.location,
    console,
    URL,
    Response,
    Request: class { constructor(u) { this.url = String(u); } },
    Promise, Error, Object, Array, JSON, Map, Set, RegExp, String, Number, Boolean, Date, Math,
    setTimeout, clearTimeout, queueMicrotask,
    fetch: async (req, init) => {
      fetchCalls.push({
        url: String(req?.url ?? req),
        cache: init?.cache ?? null,
        credentials: init?.credentials ?? null,
      });
      return { ok: true, status: 200, clone() { return this; } };
    },
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  try {
    vm.runInContext(code, ctx, { filename: label });
  } catch (error) {
    fail(`service worker se nepodarilo vyhodnotit (${label}): ${error.message}`);
  }
  if (!listeners.has('fetch')) fail(`service worker neregistruje fetch handler (${label})`);
  return { listeners, cacheWrites, fetchCalls };
}

async function probe(code, label, relative) {
  const { listeners, cacheWrites, fetchCalls } = instantiate(code, label);
  let responded = null;
  const request = {
    method: 'GET',
    url: `https://example.test${SCOPE}${relative}`,
    mode: 'no-cors',
    cache: 'default',
  };
  listeners.get('fetch')({ request, respondWith: (p) => { responded = p; } });
  if (responded) { try { await responded; } catch { /* sitova chyba je pro tento test irelevantni */ } }
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { relative, handled: responded !== null, cacheWrites, fetchCalls };
}

// --- vyhodnoceni jednoho service workeru -------------------------------------

async function evaluate(code, label) {
  const failures = [];

  for (const rel of critical) {
    const r = await probe(code, label, rel);
    const touched = r.cacheWrites.filter((w) => w.url.includes(rel));
    if (!r.handled) {
      failures.push(`${rel}: request neni zachycen security-critical vetvi (padá do cache-first)`);
      continue;
    }
    const netOnly = r.fetchCalls.length === 1 && r.fetchCalls[0].cache === 'no-store';
    if (!netOnly) failures.push(`${rel}: nejde network-only/no-store (${JSON.stringify(r.fetchCalls)})`);
    if (touched.length) failures.push(`${rel}: zapis do Cache API (${JSON.stringify(touched)})`);
  }

  for (const rel of CONTROL_ASSETS) {
    const r = await probe(code, label, rel);
    if (!r.handled) failures.push(`kontrolni asset ${rel}: nezpracovan - test je nespolehlivy`);
  }

  return failures;
}

// Mutace pro negativni kontrolu: guard zustava volan a literaly zustavaji v tele
// funkce (takze textove kontroly dal projdou), ale vraci vzdy false.
function disableGuard(code) {
  const start = code.indexOf('function isSecurityCriticalRequest');
  if (start < 0) return null;
  const bodyStart = code.indexOf('{', start);
  if (bodyStart < 0) return null;
  let depth = 0, end = -1;
  for (let i = bodyStart; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) return null;
  const literals = JSON.stringify(critical);
  const mutated = `function isSecurityCriticalRequest(url, scopePath) {\n`
    + `  const relative = url.pathname.slice(scopePath.length);\n`
    + `  const AUDIT_NOTE = ${literals};\n`
    + `  void AUDIT_NOTE; void relative;\n`
    + `  return false;\n`
    + `}`;
  return code.slice(0, start) + mutated + code.slice(end + 1);
}

// --- beh ----------------------------------------------------------------------

const steps = [];
for (const profile of PROFILES) {
  const swPath = path.join(ROOT, profile, 'sw.js');
  if (!existsSync(swPath)) {
    steps.push({ id: `boundary.${profile}`, ok: false, detail: `chybi ${profile}/sw.js - nejdriv sestav profil` });
    continue;
  }
  const code = readFileSync(swPath, 'utf8');

  const failures = await evaluate(code, swPath);
  steps.push({
    id: `boundary.${profile}`,
    ok: failures.length === 0,
    detail: failures.join(' | ').slice(0, 2000),
  });

  const mutated = disableGuard(code);
  if (!mutated) {
    steps.push({ id: `negative-control.${profile}`, ok: false, detail: 'mutaci guardu nelze sestavit - zmenila se struktura sw.js' });
  } else {
    const mutatedFailures = await evaluate(mutated, `${swPath}#guard-disabled`);
    steps.push({
      id: `negative-control.${profile}`,
      ok: mutatedFailures.length > 0,
      detail: mutatedFailures.length
        ? `mutace spravne odmitnuta (${mutatedFailures.length} poruseni hranice)`
        : 'MUTACE PROSLA - test nedokaze detekovat vyrazeny guard',
    });
  }
}

const failed = steps.filter((s) => !s.ok);
const report = {
  schema: 'ghrab-gh02-sw-boundary-behavioral-v1',
  criticalAssets: critical.length,
  profiles: PROFILES,
  status: failed.length ? 'failed' : 'passed',
  summary: { total: steps.length, passed: steps.length - failed.length, failed: failed.length },
  steps,
  note: 'Behavioralni jednotkovy test hranice SW. Nenahrazuje SIM-07 ani test v realnem prohlizeci, '
      + 'ale na rozdil od textovych kontrol odhali vyrazeny isSecurityCriticalRequest.',
};
console.log(JSON.stringify(report, null, 2));
process.exit(failed.length ? 1 : 0);
