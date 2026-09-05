const APP_ID = 'essay-evaluator';
const SUITE_CONTRACT = 'ghrab-suite-session-v1';
const OBSERVED_KEY = 'ghrab.essay-evaluator.suite-session-observed.v1';
const CLEANUP_COMPLETE_KEY = 'ghrab.essay-evaluator.suite-session-cleanup-complete.v1';

const LOCAL_TARGETS = Object.freeze([
  ['state', 'maturitniHodnotitelStateV130', 'ghrab.essay-evaluator.state.v1'],
  ['tasks', 'maturitniHodnotitelTasksV100', 'ghrab.essay-evaluator.tasks.v1'],
  ['history', 'maturitniHodnotitelPseudonymousHistoryV130', 'ghrab.essay-evaluator.history.v1'],
  ['provider-key-local', 'maturitniHodnotitelGeminiKeyV061', 'ghrab.essay-evaluator.ai.key.local.v1'],
  ['sensitive-save-preference', 'maturitniHodnotitelSensitiveSaveV073', 'ghrab.essay-evaluator.legacy.SensitiveSaveV073'],
  ['batch-recovery-local', 'maturitniHodnotitelBatchProgressLocalV078', 'ghrab.essay-evaluator.legacy.BatchProgressLocalV078'],
  ['legacy-state-v100', 'maturitniHodnotitelStateV100', 'ghrab.essay-evaluator.legacy.StateV100'],
  ['legacy-state-v070', 'maturitniHodnotitelStateV070', 'ghrab.essay-evaluator.legacy.StateV070'],
  ['legacy-state-v071', 'maturitniHodnotitelStateV071', 'ghrab.essay-evaluator.legacy.StateV071'],
  ['legacy-state-v072', 'maturitniHodnotitelStateV072', 'ghrab.essay-evaluator.legacy.StateV072'],
  ['legacy-state-v073', 'maturitniHodnotitelStateV073', 'ghrab.essay-evaluator.legacy.StateV073'],
  ['legacy-state-v074', 'maturitniHodnotitelStateV074', 'ghrab.essay-evaluator.legacy.StateV074'],
  ['legacy-state-v075', 'maturitniHodnotitelStateV075', 'ghrab.essay-evaluator.legacy.StateV075'],
  ['legacy-state-v076', 'maturitniHodnotitelStateV076', 'ghrab.essay-evaluator.legacy.StateV076'],
  ['legacy-state-v077', 'maturitniHodnotitelStateV077', 'ghrab.essay-evaluator.legacy.StateV077'],
  ['legacy-state-v078', 'maturitniHodnotitelStateV078', 'ghrab.essay-evaluator.legacy.StateV078'],
].map(([id, ...keys]) => Object.freeze({ id, keys: Object.freeze(keys) })));

const SESSION_TARGETS = Object.freeze([
  ['tasks-session', 'maturitniHodnotitelTasksSessionV117', 'ghrab.essay-evaluator.legacy.TasksSessionV117'],
  ['provider-key-session', 'maturitniHodnotitelGeminiKeySessionV061', 'ghrab.essay-evaluator.ai.key.session.v1'],
  ['batch-recovery-session', 'maturitniHodnotitelBatchProgressSessionV078', 'ghrab.essay-evaluator.legacy.BatchProgressSessionV078'],
].map(([id, ...keys]) => Object.freeze({ id, keys: Object.freeze(keys) })));

export const CLEAR_ON_END_WORK = Object.freeze({
  localStorage: LOCAL_TARGETS,
  sessionStorage: SESSION_TARGETS,
});

function errorText(error) {
  return String(error?.message || error || 'unknown-error').slice(0, 240);
}

function allPhysicalKeys(store) {
  const keys = [];
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (key !== null) keys.push(String(key));
  }
  return keys;
}

function removeAndVerify(store, targets, storeName) {
  const failures = [];
  for (const target of targets) {
    for (const key of target.keys) {
      try { store.removeItem(key); }
      catch (error) { failures.push(`${storeName}:${target.id}:remove:${key}:${errorText(error)}`); }
    }
  }
  let physical = [];
  try { physical = allPhysicalKeys(store); }
  catch (error) { failures.push(`${storeName}:enumerate:${errorText(error)}`); }
  for (const target of targets) {
    for (const key of target.keys) {
      try {
        if (store.getItem(key) !== null) failures.push(`${storeName}:${target.id}:readback:${key}`);
      } catch (error) {
        failures.push(`${storeName}:${target.id}:readback-error:${key}:${errorText(error)}`);
      }
      if (physical.includes(key)) failures.push(`${storeName}:${target.id}:physical-residual:${key}`);
    }
  }
  return failures;
}

function hasResidualData(store, targets) {
  for (const target of targets) {
    for (const key of target.keys) {
      try { if (store.getItem(key) !== null) return true; }
      catch (_) { return true; }
    }
  }
  return false;
}

function writeEvidence(store, key, detail, phase) {
  const record = JSON.stringify({
    schema: 'ghrab-suite-session-evidence-v1',
    appId: APP_ID,
    generation: String(detail.generation || ''),
    phase,
    reason: String(detail.reason || ''),
    replay: Boolean(detail.replay),
    at: new Date().toISOString(),
  });
  try {
    store.setItem(key, record);
    const readback = JSON.parse(store.getItem(key) || '{}');
    return readback.generation === String(detail.generation || '') && readback.phase === phase;
  } catch (_) {
    return false;
  }
}

function setStatus(value) {
  try { document.documentElement.dataset.ghrabSuiteCleanup = value; } catch (_) {}
}

export function createSuiteSessionLifecycle(options = {}) {
  const platform = options.platform || globalThis.GHRAB_PLATFORM;
  const localStore = options.localStorage || globalThis.localStorage;
  const sessionStore = options.sessionStorage || globalThis.sessionStorage;
  const beforeCleanup = typeof options.beforeCleanup === 'function' ? options.beforeCleanup : async () => {};
  const afterCleanup = typeof options.afterCleanup === 'function' ? options.afterCleanup : async () => {};
  const onFailure = typeof options.onFailure === 'function' ? options.onFailure : () => {};
  const reload = typeof options.reload === 'function' ? options.reload : () => globalThis.location?.reload?.();
  let persistenceBlocked = false;
  let handledGeneration = '';
  let inFlightGeneration = '';
  let inFlightPromise = null;
  let started = false;

  function contractReady() {
    return Boolean(platform?.session && platform.session.contract === SUITE_CONTRACT &&
      typeof platform.session.generation === 'function' && typeof platform.session.seen === 'function' &&
      typeof platform.session.pending === 'function' && typeof platform.session.onEnd === 'function' &&
      typeof platform.session.acknowledge === 'function');
  }

  async function run(detail = {}) {
    const generation = String(detail.generation || '');
    if (!generation || detail.schema !== SUITE_CONTRACT) return { ok: false, reason: 'invalid-suite-signal' };
    if (generation === handledGeneration) return { ok: true, generation, duplicate: true };
    if (generation === inFlightGeneration && inFlightPromise) return inFlightPromise;

    inFlightGeneration = generation;
    inFlightPromise = (async () => {
      persistenceBlocked = true;
      setStatus('running');
      const failures = [];
      if (!writeEvidence(localStore, OBSERVED_KEY, detail, 'observed')) failures.push('evidence:observed-write-failed');
      try { await beforeCleanup(detail); } catch (error) { failures.push(`runtime:before:${errorText(error)}`); }
      if (detail.clearApplicationData !== false) {
        failures.push(...removeAndVerify(localStore, LOCAL_TARGETS, 'localStorage'));
        failures.push(...removeAndVerify(sessionStore, SESSION_TARGETS, 'sessionStorage'));
      }
      try { await afterCleanup(detail); } catch (error) { failures.push(`runtime:after:${errorText(error)}`); }

      if (failures.length) {
        setStatus('failed');
        try { onFailure({ ok: false, generation, failures: [...new Set(failures)] }); } catch (_) {}
        return { ok: false, generation, failures: [...new Set(failures)] };
      }
      if (!writeEvidence(localStore, CLEANUP_COMPLETE_KEY, detail, 'cleanup-complete')) {
        const result = { ok: false, generation, failures: ['evidence:cleanup-complete-write-failed'] };
        setStatus('failed');
        try { onFailure(result); } catch (_) {}
        return result;
      }

      let acknowledged = false;
      try {
        acknowledged = platform.session.acknowledge(generation) === true && platform.session.seen() === generation;
      } catch (_) { acknowledged = false; }
      if (!acknowledged) {
        const result = { ok: false, generation, failures: ['acknowledgement:write-or-readback-failed'] };
        setStatus('failed');
        try { onFailure(result); } catch (_) {}
        return result;
      }

      handledGeneration = generation;
      setStatus('complete');
      try { setTimeout(() => reload(detail), 0); } catch (_) {}
      return { ok: true, generation };
    })();

    try { return await inFlightPromise; }
    finally {
      inFlightGeneration = '';
      inFlightPromise = null;
    }
  }

  async function reconcile(reason = 'context-reconcile') {
    if (!contractReady()) return { ok: false, reason: 'suite-contract-unavailable' };
    const generation = String(platform.session.generation() || '');
    if (!generation || generation === handledGeneration) return { ok: true, generation, noop: true };
    // Do not trust the shared per-app ACK here. A stale/BFCache context may have
    // missed the storage event while another tab already acknowledged the same
    // generation. Fresh contexts set handledGeneration during start().
    return run({ schema: SUITE_CONTRACT, generation, reason, clearApplicationData: true, appId: APP_ID, replay: true });
  }

  async function clearLocalWork(reason = 'local-end-work') {
    persistenceBlocked = true;
    setStatus('running');
    const failures = [];
    try { await beforeCleanup({ reason, clearApplicationData: true, localOnly: true }); }
    catch (error) { failures.push(`runtime:before:${errorText(error)}`); }
    failures.push(...removeAndVerify(localStore, LOCAL_TARGETS, 'localStorage'));
    failures.push(...removeAndVerify(sessionStore, SESSION_TARGETS, 'sessionStorage'));
    try { await afterCleanup({ reason, clearApplicationData: true, localOnly: true }); }
    catch (error) { failures.push(`runtime:after:${errorText(error)}`); }
    if (failures.length) {
      const result = { ok: false, failures: [...new Set(failures)] };
      setStatus('failed');
      try { onFailure(result); } catch (_) {}
      return result;
    }
    setStatus('complete');
    try { setTimeout(() => reload({ reason, localOnly: true }), 0); } catch (_) {}
    return { ok: true };
  }

  async function start() {
    if (started) return { ok: true, alreadyStarted: true };
    if (!contractReady()) {
      persistenceBlocked = true;
      setStatus('failed');
      throw new Error('GHRAB Platform 1.1.2 suite-session contract is unavailable.');
    }
    started = true;
    platform.session.onEnd((detail) => run(detail), { replay: false });
    globalThis.addEventListener?.('storage', (event) => {
      if (event.key === platform.session.generationKey && event.newValue && String(event.newValue) !== handledGeneration) {
        void run({ schema: SUITE_CONTRACT, generation: String(event.newValue), reason: 'cross-context-child-guard', clearApplicationData: true, appId: APP_ID });
      }
    });
    globalThis.addEventListener?.('pageshow', () => { void reconcile('history-reconcile'); });
    globalThis.addEventListener?.('focus', () => { void reconcile('focus-reconcile'); });
    globalThis.document?.addEventListener?.('visibilitychange', () => {
      if (globalThis.document.visibilityState === 'visible') void reconcile('visibility-reconcile');
    });

    const generation = String(platform.session.generation() || '');
    if (!generation) return { ok: true, startupCleanup: false };
    const pending = platform.session.pending();
    const staleSessionContext = !pending && hasResidualData(sessionStore, SESSION_TARGETS);
    if (!pending && !staleSessionContext) {
      handledGeneration = generation;
      return { ok: true, startupCleanup: false, alreadyAcknowledged: true };
    }
    const result = await run({
      schema: SUITE_CONTRACT,
      generation,
      reason: pending ? 'pending-suite-end' : 'stale-context-suite-end',
      clearApplicationData: true,
      appId: APP_ID,
      replay: true,
    });
    if (!result.ok) throw new Error(`Pending suite-session cleanup failed: ${(result.failures || [result.reason]).join(', ')}`);
    return { ok: true, startupCleanup: true, generation };
  }

  return Object.freeze({
    contract: SUITE_CONTRACT,
    evidence: Object.freeze({ observedKey: OBSERVED_KEY, cleanupCompleteKey: CLEANUP_COMPLETE_KEY }),
    start,
    run,
    reconcile,
    clearLocalWork,
    isPersistenceBlocked: () => persistenceBlocked,
    handledGeneration: () => handledGeneration,
  });
}
