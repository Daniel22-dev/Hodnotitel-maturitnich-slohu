const APP_ID = 'essay-evaluator';
const FALLBACK_STUDIO_URL = '/AI-Studio-GHRAB/';
const IMPORT_TIMEOUT_MS = 4500;
const CHECK_TIMEOUT_MS = 8000;
let studioUrl = FALLBACK_STUDIO_URL;

class GuardTimeoutError extends Error {
  constructor(stage) {
    super(`Časový limit přístupové brány: ${stage}`);
    this.name = 'GuardTimeoutError';
  }
}

function withTimeout(promise, ms, stage) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new GuardTimeoutError(stage)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function showFatal(message) {
  document.documentElement.dataset.ghrabAccess = 'denied';
  document.body.style.visibility = 'visible';
  document.body.replaceChildren();
  const box = document.createElement('div');
  box.className = 'ghrab-access-fatal';
  box.innerHTML = '<div><h1>Aplikaci se nepodařilo spustit</h1><p></p><p>Obnovte stránku nebo aplikaci otevřete z AI Studia.</p><p><a data-ghrab-studio-link>Otevřít AI Studio</a></p></div>';
  box.querySelector('p').textContent = message;
  box.querySelector('[data-ghrab-studio-link]').href = studioUrl;
  document.body.appendChild(box);
}

function startLocalReporter(context) {
  return import('./access/reporter-bootstrap.js')
    .then((module) => module.startReporterBestEffort('./error-reporter-adapter.js', { context }))
    .catch((error) => {
      console.warn('Reportér Hodnotitele nebyl načten; aplikace pokračuje.', error);
      return null;
    });
}

async function loadApplication() {
  await import('./app.js');
}

async function start() {
  try {
    const deploymentModule = await withTimeout(import('./access/deployment-config.js'), IMPORT_TIMEOUT_MS, 'načtení deployment konfigurace');
    const deployment = await deploymentModule.loadDeploymentConfig({ appId: APP_ID });
    const urls = deploymentModule.deploymentUrls(deployment);
    studioUrl = urls.studioUrl;
    const guardModule = await withTimeout(import(urls.guardUrl), IMPORT_TIMEOUT_MS, 'načtení modulu');
    if (typeof guardModule.protectApp !== 'function') throw new Error('Modul přístupové brány neobsahuje protectApp().');
    const allowed = await withTimeout(
      guardModule.protectApp(APP_ID, { studioUrl, errorReporter: false }),
      CHECK_TIMEOUT_MS,
      'ověření oprávnění',
    );
    if (!allowed) return;
    void startLocalReporter('essay-evaluator:granted');
    await loadApplication();
  } catch (error) {
    console.error('Hodnotitel access bootstrap failed', error);
    showFatal('Přístupovou bránu se nepodařilo bezpečně ověřit. Aplikace zůstává uzamčena: ' + (error?.message || error));
    void startLocalReporter('essay-evaluator:bootstrap-failure');
  }
}

void start();
