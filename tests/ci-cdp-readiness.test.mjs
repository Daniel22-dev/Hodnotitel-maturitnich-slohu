import test from 'node:test';
import assert from 'node:assert/strict';
import { waitCdpPageTarget } from '../scripts/ci/wait-cdp-page-target.mjs';

const url = 'http://127.0.0.1:9999/json';
const page = { type: 'page', webSocketDebuggerUrl: 'ws://127.0.0.1:9999/devtools/page/1' };
const ok = data => ({ ok: true, json: async () => data });

function clock() {
  let time = 0;
  return { now: () => time, delay: async ms => { time += ms; } };
}

test('immediate valid Chromium page target', async () => {
  const target = await waitCdpPageTarget(url, { fetchImpl: async () => ok([page]) });
  assert.deepEqual(target, page);
});

test('empty browser-target list is not considered readiness', async () => {
  let calls = 0;
  const target = await waitCdpPageTarget(url, {
    fetchImpl: async () => ok(++calls >= 3 ? [page] : []), ...clock(),
  });
  assert.deepEqual(target, page);
  assert.equal(calls, 3);
});

test('non-page targets and targets without websocket are ignored', async () => {
  let calls = 0;
  const target = await waitCdpPageTarget(url, {
    fetchImpl: async () => ok(++calls === 1 ? [{ type: 'service_worker', webSocketDebuggerUrl: 'ws://127.0.0.1:9999/sw' }, { type: 'page' }] : [page]),
    ...clock(),
  });
  assert.deepEqual(target, page);
  assert.equal(calls, 2);
});

test('localhost connection errors are retried, not accepted as PASS', async () => {
  let calls = 0;
  const target = await waitCdpPageTarget(url, {
    fetchImpl: async () => { if (++calls === 1) throw Error('ECONNREFUSED'); return ok([page]); },
    ...clock(),
  });
  assert.deepEqual(target, page);
  assert.equal(calls, 2);
});

test('wrong endpoint and missing page target fail closed', async () => {
  const t = clock();
  await assert.rejects(() => waitCdpPageTarget('https://attacker.invalid/json'), /loopback/);
  await assert.rejects(() => waitCdpPageTarget(url, {
    fetchImpl: async () => ok([]), ...t, timeoutMs: 100, pollMs: 50,
  }), /page target timeout/);
});

test('persistent HTTP error returns a bounded timeout', async () => {
  const t = clock();
  let count = 0;
  await assert.rejects(() => waitCdpPageTarget(url, {
    fetchImpl: async () => { count++; return { ok: false }; },
    ...t, timeoutMs: 100, pollMs: 50,
  }), /page target timeout/);
  assert.ok(count <= 3, 'Unexpected unbounded retry count: ' + count);
});
